process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createEscrowService, captureKey, transferKey, MAX_RELEASE_ATTEMPTS } = require('../src/services/escrow.service');
const { transitionPayment, PaymentTransitionError } = require('../src/services/payment-state');

/**
 * Minimal in-memory stand-in for the mysql2 pool, covering only the
 * statements the escrow service issues.
 */
function fakeDb({ payments = [], jobs = [], profiles = [] }) {
  const state = { payments, jobs, profiles, transactions: { committed: 0, rolledBack: 0 } };
  let failNextFinalise = false;
  let failNextTransferRecord = false;

  async function query(sql, params = []) {
    const s = sql.replace(/\s+/g, ' ').trim();
    if (s.startsWith('SELECT * FROM payments WHERE job_id = ?')) {
      const allowed = s.match(/status IN \(([^)]*)\)/)?.[1].match(/'(\w+)'/g).map((v) => v.slice(1, -1));
      return [state.payments.filter((p) => p.job_id === params[0] && (!allowed || allowed.includes(p.status)))];
    }
    if (s.startsWith("SELECT * FROM payments WHERE status = 'releasing'")) {
      return [state.payments.filter((p) => p.status === 'releasing' && p.stale)];
    }
    if (s.startsWith('SELECT p.id, p.job_id FROM payments p')) {
      return [state.payments.filter((p) => p.status === 'held' && p.overdue)];
    }
    if (s.startsWith('SELECT * FROM payments WHERE id = ?')) {
      return [state.payments.filter((p) => p.id === params[0])];
    }
    if (s.startsWith('SELECT payment_mode FROM jobs')) {
      return [state.jobs.filter((j) => j.id === params[0])];
    }
    // payment-state.js: UPDATE payments SET status = ?[, extra] WHERE id = ? AND status = ?
    if (s.startsWith('UPDATE payments SET status = ?')) {
      const [to] = params;
      const from = params.at(-1);
      const id = params.at(-2);
      if (to === 'released' && failNextFinalise) {
        failNextFinalise = false;
        throw new Error('database went away');
      }
      const p = state.payments.find((x) => x.id === id && x.status === from);
      if (p) {
        p.status = to;
        if (to === 'released') p.stripe_transfer_id = params[1];
        if (to === 'release_failed') p.release_error = params[1];
        if (to === 'releasing') p.release_attempts = s.includes('release_attempts = 1') ? 1 : (p.release_attempts || 0) + 1;
      }
      return [{ affectedRows: p ? 1 : 0 }];
    }
    if (s.startsWith('UPDATE payments SET release_started_at = NOW()')) {
      const p = state.payments.find((x) => x.id === params[0] && x.status === 'releasing' && x.stale);
      if (p) {
        p.stale = false;
        p.release_attempts = (p.release_attempts || 0) + 1;
      }
      return [{ affectedRows: p ? 1 : 0 }];
    }
    if (s.startsWith('UPDATE payments SET stripe_transfer_id = ?')) {
      if (failNextTransferRecord) {
        failNextTransferRecord = false;
        throw new Error('database went away');
      }
      state.payments.find((x) => x.id === params[1]).stripe_transfer_id = params[0];
      return [{ affectedRows: 1 }];
    }
    if (s.startsWith('SELECT stripe_account_id FROM provider_profiles')) {
      return [state.profiles.filter((p) => p.user_id === params[0])];
    }
    if (s.startsWith('SELECT provider_id, status FROM jobs')) {
      return [state.jobs.filter((j) => j.id === params[0])];
    }
    if (s.startsWith("UPDATE jobs SET status = 'completed'")) {
      state.jobs.find((j) => j.id === params[0]).status = 'completed';
      return [{ affectedRows: 1 }];
    }
    if (s.startsWith('UPDATE provider_profiles SET total_jobs_done')) {
      const p = state.profiles.find((x) => x.user_id === params[0]);
      if (p) p.total_jobs_done = (p.total_jobs_done || 0) + 1;
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected query: ${s}`);
  }

  return {
    state,
    failFinaliseOnce: () => {
      failNextFinalise = true;
    },
    failTransferRecordOnce: () => {
      failNextTransferRecord = true;
    },
    query,
    async getConnection() {
      return {
        query,
        beginTransaction: async () => {},
        commit: async () => {
          state.transactions.committed += 1;
        },
        rollback: async () => {
          state.transactions.rolledBack += 1;
        },
        release: () => {},
      };
    },
  };
}

/** Stripe double that honours idempotency keys like the real API. */
function fakeStripe(intentStatus = 'requires_capture') {
  const calls = { capture: [], transfer: [] };
  const idempotent = new Map();
  let transfers = 0;
  let failTransfersRemaining = 0;
  let captures = 0;
  const created = [];
  let loseNextCaptureResponse = false;
  let loseNextTransferResponse = false;
  const intents = new Map();
  const accountTransfers = new Map();
  const remember = (key, fn) => {
    if (!idempotent.has(key)) idempotent.set(key, fn());
    return idempotent.get(key);
  };
  return {
    calls,
    failNextTransfer: () => {
      failTransfersRemaining = 1;
    },
    // The call takes effect at Stripe, but the API response never arrives
    loseNextCaptureResponse: () => {
      loseNextCaptureResponse = true;
    },
    loseNextTransferResponse: () => {
      loseNextTransferResponse = true;
    },
    captureCount: () => captures,
    // Connected account capability per account id ('active' unless set)
    accountTransfers,
    accounts: {
      async retrieve(id) {
        return { id, capabilities: { transfers: accountTransfers.get(id) ?? 'active' } };
      },
    },
    // Stripe forgets idempotency keys after 24 hours
    expireIdempotencyKeys: () => idempotent.clear(),
    paymentIntents: {
      async retrieve(id) {
        return { id, status: intents.get(id) || intentStatus };
      },
      async capture(id, _params, { idempotencyKey }) {
        calls.capture.push(idempotencyKey);
        if (intents.get(id) === 'succeeded' && !idempotent.has(idempotencyKey)) {
          throw new Error('This PaymentIntent has already been captured');
        }
        const result = remember(idempotencyKey, () => {
          captures += 1;
          intents.set(id, 'succeeded');
          return { id, status: 'succeeded' };
        });
        if (loseNextCaptureResponse) {
          loseNextCaptureResponse = false;
          throw new Error('socket hang up');
        }
        return result;
      },
    },
    transfers: {
      async list({ transfer_group }) {
        return { data: created.filter((t) => t.transfer_group === transfer_group) };
      },
      async create(params, { idempotencyKey }) {
        calls.transfer.push(idempotencyKey);
        if (failTransfersRemaining > 0) {
          failTransfersRemaining -= 1;
          throw new Error('Stripe unavailable');
        }
        const result = remember(idempotencyKey, () => {
          const transfer = { id: `tr_${++transfers}`, amount: params.amount, transfer_group: params.transfer_group };
          created.push(transfer);
          return transfer;
        });
        if (loseNextTransferResponse) {
          loseNextTransferResponse = false;
          throw new Error('socket hang up');
        }
        return result;
      },
    },
    transferCount: () => transfers,
  };
}

const quiet = { info() {}, error() {}, warn() {} };

const scenario = (paymentOverrides = {}, intentStatus, { profile = {}, job = {}, noPayment = false } = {}) => {
  const db = fakeDb({
    payments: noPayment
      ? []
      : [{ id: 10, job_id: 1, provider_id: 7, provider_payout: '88.00', stripe_payment_intent_id: 'pi_1', status: 'held', release_attempts: 0, ...paymentOverrides }],
    jobs: [{ id: 1, provider_id: 7, status: 'in_progress', payment_mode: 'online_escrow', ...job }],
    profiles: [{ user_id: 7, stripe_account_id: 'acct_7', total_jobs_done: 0, ...profile }],
  });
  const stripe = fakeStripe(intentStatus);
  return { db, stripe, escrow: createEscrowService({ db, stripe, logger: quiet }) };
};

test('release captures, pays the provider once and completes the job', async () => {
  const { db, stripe, escrow } = scenario();

  assert.deepEqual(await escrow.releaseEscrowForJob(1), { released: true, completed: true });

  assert.equal(db.state.payments[0].status, 'released');
  assert.equal(db.state.payments[0].stripe_transfer_id, 'tr_1');
  assert.equal(db.state.jobs[0].status, 'completed');
  assert.equal(db.state.profiles[0].total_jobs_done, 1);
  assert.deepEqual(stripe.calls.capture, [captureKey(10)]);
  assert.deepEqual(stripe.calls.transfer, [transferKey(10)]);
});

test('a second release of the same job does nothing', async () => {
  const { db, stripe, escrow } = scenario();
  await escrow.releaseEscrowForJob(1);
  await escrow.releaseEscrowForJob(1);

  assert.equal(stripe.transferCount(), 1);
  assert.equal(db.state.profiles[0].total_jobs_done, 1);
});

test('concurrent releases transfer money only once', async () => {
  const { db, stripe, escrow } = scenario();
  const results = await Promise.all([escrow.releaseEscrowForJob(1), escrow.releaseEscrowForJob(1)]);

  assert.equal(results.filter((r) => r.released).length, 1);
  assert.equal(stripe.transferCount(), 1);
  assert.equal(db.state.payments[0].status, 'released');
});

test('a Stripe failure leaves the payment releasing, and resuming finishes it without paying twice', async () => {
  const { db, stripe, escrow } = scenario();
  stripe.failNextTransfer();

  await assert.rejects(escrow.releaseEscrowForJob(1), /Stripe unavailable/);
  assert.equal(db.state.payments[0].status, 'releasing');
  assert.equal(db.state.jobs[0].status, 'in_progress');

  db.state.payments[0].stale = true;
  await escrow.resumeStuckReleases();

  assert.equal(db.state.payments[0].status, 'released');
  assert.equal(stripe.transferCount(), 1);
  assert.ok(stripe.calls.transfer.every((key) => key === transferKey(10)));
});

test('a database failure after paying out is resumed without a second transfer', async () => {
  const { db, stripe, escrow } = scenario();
  db.failFinaliseOnce();

  await assert.rejects(escrow.releaseEscrowForJob(1), /database went away/);
  assert.equal(db.state.payments[0].stripe_transfer_id, 'tr_1', 'transfer id is recorded before finalising');

  db.state.payments[0].stale = true;
  await escrow.resumeStuckReleases();

  assert.equal(db.state.payments[0].status, 'released');
  assert.equal(stripe.transferCount(), 1);
  assert.equal(db.state.profiles[0].total_jobs_done, 1);
});

test('an unauthorised payment cannot be released', async () => {
  const { db, escrow } = scenario({ status: 'pending' }, 'requires_payment_method');

  await assert.rejects(escrow.releaseEscrowForJob(1), (err) => err.statusCode === 409);
  assert.equal(db.state.jobs[0].status, 'in_progress');
});

test('a pending payment that Stripe reports as authorised is synced and released', async () => {
  const { db, escrow } = scenario({ status: 'pending' }, 'requires_capture');

  await escrow.releaseEscrowForJob(1);

  assert.equal(db.state.payments[0].status, 'released');
});

test('the hourly job releases overdue held payments', async () => {
  const { db, escrow } = scenario({ overdue: true });

  await escrow.autoReleasePayments();

  assert.equal(db.state.payments[0].status, 'released');
});

// Crash at every stage of a release, then let the hourly job resume it.
// Whatever the failure point, the end state must be: released once,
// captured once, one transfer, job completed once.
const assertReleasedExactlyOnce = (db, stripe) => {
  assert.equal(db.state.payments[0].status, 'released');
  assert.equal(db.state.payments[0].stripe_transfer_id, 'tr_1');
  assert.equal(stripe.captureCount(), 1, 'captured exactly once');
  assert.equal(stripe.transferCount(), 1, 'paid out exactly once');
  assert.equal(db.state.jobs[0].status, 'completed');
  assert.equal(db.state.profiles[0].total_jobs_done, 1);
};

const crashStages = [
  {
    name: 'capture request fails before reaching Stripe',
    inject: ({ stripe }) => {
      const original = stripe.paymentIntents.capture;
      stripe.paymentIntents.capture = async () => {
        stripe.paymentIntents.capture = original;
        throw new Error('ECONNRESET');
      };
    },
    capturedBeforeResume: 0,
  },
  {
    name: 'capture succeeds at Stripe but the response is lost',
    inject: ({ stripe }) => stripe.loseNextCaptureResponse(),
    capturedBeforeResume: 1,
  },
  {
    name: 'capture succeeds, transfer request fails',
    inject: ({ stripe }) => stripe.failNextTransfer(),
    capturedBeforeResume: 1,
  },
  {
    name: 'transfer succeeds at Stripe but the response is lost',
    inject: ({ stripe }) => stripe.loseNextTransferResponse(),
    capturedBeforeResume: 1,
  },
  {
    name: 'transfer succeeds, recording the transfer id in the DB fails',
    inject: ({ db }) => db.failTransferRecordOnce(),
    capturedBeforeResume: 1,
  },
  {
    name: 'capture and transfer succeed, final DB transaction fails',
    inject: ({ db }) => db.failFinaliseOnce(),
    capturedBeforeResume: 1,
  },
];

for (const stage of crashStages) {
  test(`crash recovery: ${stage.name}`, async () => {
    const { db, stripe, escrow } = scenario();
    stage.inject({ db, stripe });

    await assert.rejects(escrow.releaseEscrowForJob(1));
    assert.equal(db.state.payments[0].status, 'releasing', 'payment is parked, not lost');
    assert.equal(db.state.jobs[0].status, 'in_progress', 'job is not completed before money moves');
    assert.equal(stripe.captureCount(), stage.capturedBeforeResume);

    // A user retrying in the meantime must not start a second release
    assert.deepEqual(await escrow.releaseEscrowForJob(1), { released: false, inProgress: true });

    db.state.payments[0].stale = true;
    await escrow.resumeStuckReleases();
    assertReleasedExactlyOnce(db, stripe);

    // Running the recovery job again is a no-op
    await escrow.resumeStuckReleases();
    assertReleasedExactlyOnce(db, stripe);
  });
}

test('a release resumed after idempotency keys expired still pays out only once', async () => {
  const { db, stripe, escrow } = scenario();
  stripe.loseNextTransferResponse();
  await assert.rejects(escrow.releaseEscrowForJob(1));

  stripe.expireIdempotencyKeys(); // resume more than 24h later
  db.state.payments[0].stale = true;
  await escrow.resumeStuckReleases();

  assertReleasedExactlyOnce(db, stripe);
});

// --- Settlement guarantees ------------------------------------------------

const assertNothingMoved = (db, stripe) => {
  assert.equal(stripe.captureCount(), 0, 'customer funds were not captured');
  assert.equal(stripe.transferCount(), 0, 'no transfer was attempted');
  assert.equal(db.state.jobs[0].status, 'in_progress', 'job was not completed');
  assert.equal(db.state.profiles[0].total_jobs_done, 0);
};

test('a provider without a Stripe account is never released, and nothing is captured', async () => {
  const { db, stripe, escrow } = scenario({}, undefined, { profile: { stripe_account_id: null } });

  await assert.rejects(escrow.releaseEscrowForJob(1), (err) => err.statusCode === 409);

  assertNothingMoved(db, stripe);
  assert.equal(db.state.payments[0].status, 'release_failed');
  assert.match(db.state.payments[0].release_error, /no connected Stripe account/);
});

test('a connected account that cannot receive transfers is rejected before capture', async () => {
  const { db, stripe, escrow } = scenario();
  stripe.accountTransfers.set('acct_7', 'inactive');

  await assert.rejects(escrow.releaseEscrowForJob(1), (err) => err.statusCode === 409);

  assertNothingMoved(db, stripe);
  assert.equal(db.state.payments[0].status, 'release_failed');
});

test('a failed release is not retried by users, and an admin retry pays out once the account is fixed', async () => {
  const { db, stripe, escrow } = scenario({}, undefined, { profile: { stripe_account_id: null } });
  await assert.rejects(escrow.releaseEscrowForJob(1));

  await assert.rejects(escrow.releaseEscrowForJob(1), (err) => err.statusCode === 409);
  await escrow.resumeStuckReleases(); // the hourly job leaves it alone
  assert.equal(db.state.payments[0].status, 'release_failed');

  db.state.profiles[0].stripe_account_id = 'acct_7';
  assert.deepEqual(await escrow.retryFailedRelease(10), { released: true });
  assertReleasedExactlyOnce(db, stripe);

  await assert.rejects(escrow.retryFailedRelease(10), (err) => err.statusCode === 409);
});

test('a transfer response without an id does not complete the job', async () => {
  const { db, stripe, escrow } = scenario();
  stripe.transfers.create = async () => ({});

  await assert.rejects(escrow.releaseEscrowForJob(1), /no transfer/);

  assert.equal(db.state.payments[0].status, 'releasing', 'left for the resume job');
  assert.equal(db.state.payments[0].stripe_transfer_id, undefined);
  assert.equal(db.state.jobs[0].status, 'in_progress');
});

test('without Stripe configured a release fails instead of completing silently', async () => {
  const { db } = scenario();
  const escrow = createEscrowService({ db, stripe: null, logger: quiet });

  await assert.rejects(escrow.releaseEscrowForJob(1), (err) => err.statusCode === 409);
  assert.equal(db.state.payments[0].status, 'release_failed');
  assert.equal(db.state.jobs[0].status, 'in_progress');
});

test('repeated transient failures end in release_failed instead of retrying forever', async () => {
  const { db, stripe, escrow } = scenario({ status: 'releasing', stale: true, release_attempts: MAX_RELEASE_ATTEMPTS });

  await escrow.resumeStuckReleases();

  assert.equal(db.state.payments[0].status, 'release_failed');
  assert.match(db.state.payments[0].release_error, /Gave up/);
  assertNothingMoved(db, stripe);
});

test('finalising rolls back the job update when the payment changed state underneath it', async () => {
  const { db, stripe, escrow } = scenario();
  const create = stripe.transfers.create;
  stripe.transfers.create = async (...args) => {
    const transfer = await create(...args);
    db.state.payments[0].status = 'disputed'; // e.g. a webhook moved it meanwhile
    return transfer;
  };

  await assert.rejects(escrow.releaseEscrowForJob(1), PaymentTransitionError);

  assert.equal(db.state.payments[0].status, 'disputed');
  assert.equal(db.state.jobs[0].status, 'in_progress');
  assert.equal(db.state.transactions.rolledBack, 1);
  assert.equal(db.state.transactions.committed, 0);
});

test('illegal transitions are refused before touching the database', async () => {
  let queried = false;
  const conn = {
    query: async () => {
      queried = true;
      return [{ affectedRows: 1 }];
    },
  };

  await assert.rejects(transitionPayment(conn, { id: 1, from: 'pending', to: 'released' }), PaymentTransitionError);
  await assert.rejects(transitionPayment(conn, { id: 1, from: 'released', to: 'releasing' }), PaymentTransitionError);
  assert.equal(queried, false);
});

// --- Jobs without an escrow payment -----------------------------------------

test('an online job with no payment record cannot be completed', async () => {
  const { db, escrow } = scenario({}, undefined, { noPayment: true });

  await assert.rejects(escrow.releaseEscrowForJob(1), (err) => err.statusCode === 409);
  assert.equal(db.state.jobs[0].status, 'in_progress');
});

test('an online job whose payment failed or was refunded cannot be completed', async () => {
  for (const status of ['failed', 'refunded']) {
    const { db, escrow } = scenario({ status });
    await assert.rejects(escrow.releaseEscrowForJob(1), (err) => err.statusCode === 409);
    assert.equal(db.state.jobs[0].status, 'in_progress');
  }
});

test('a cash job completes without a payment and without touching Stripe', async () => {
  const { db, stripe, escrow } = scenario({}, undefined, { noPayment: true, job: { payment_mode: 'cash' } });

  assert.deepEqual(await escrow.releaseEscrowForJob(1), { released: false, completed: true, settlement: 'cash' });

  assert.equal(db.state.jobs[0].status, 'completed');
  assert.equal(db.state.profiles[0].total_jobs_done, 1);
  assert.equal(stripe.captureCount(), 0);
});
