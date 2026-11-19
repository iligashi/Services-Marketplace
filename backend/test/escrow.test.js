process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createEscrowService, captureKey, transferKey } = require('../src/services/escrow.service');

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
      return [state.payments.filter((p) => p.job_id === params[0])];
    }
    if (s.startsWith("SELECT * FROM payments WHERE status = 'releasing'")) {
      return [state.payments.filter((p) => p.status === 'releasing' && p.stale)];
    }
    if (s.startsWith('SELECT p.id, p.job_id FROM payments p')) {
      return [state.payments.filter((p) => p.status === 'held' && p.overdue)];
    }
    if (s.startsWith("UPDATE payments SET status = 'held'")) {
      const p = state.payments.find((x) => x.id === params[0] && x.status === 'pending');
      if (p) p.status = 'held';
      return [{ affectedRows: p ? 1 : 0 }];
    }
    if (s.startsWith("UPDATE payments SET status = 'releasing'")) {
      const p = state.payments.find((x) => x.id === params[0] && x.status === 'held');
      if (p) p.status = 'releasing';
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
    if (s.startsWith("UPDATE payments SET status = 'released'")) {
      if (failNextFinalise) {
        failNextFinalise = false;
        throw new Error('database went away');
      }
      const p = state.payments.find((x) => x.id === params[1] && x.status === 'releasing');
      if (p) {
        p.status = 'released';
        p.stripe_transfer_id = params[0] || p.stripe_transfer_id;
      }
      return [{ affectedRows: p ? 1 : 0 }];
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

const scenario = (paymentOverrides = {}, intentStatus) => {
  const db = fakeDb({
    payments: [{ id: 10, job_id: 1, provider_id: 7, provider_payout: '88.00', stripe_payment_intent_id: 'pi_1', status: 'held', ...paymentOverrides }],
    jobs: [{ id: 1, provider_id: 7, status: 'in_progress' }],
    profiles: [{ user_id: 7, stripe_account_id: 'acct_7', total_jobs_done: 0 }],
  });
  const stripe = fakeStripe(intentStatus);
  return { db, stripe, escrow: createEscrowService({ db, stripe, logger: quiet }) };
};

test('release captures, pays the provider once and completes the job', async () => {
  const { db, stripe, escrow } = scenario();

  assert.deepEqual(await escrow.releaseEscrowForJob(1), { released: true });

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
