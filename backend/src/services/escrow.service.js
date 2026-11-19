const { AppError } = require('../middleware/error.middleware');
const { transitionPayment, requireTransition } = require('./payment-state');

/*
 * Escrow release is split into three steps so it is safe to retry after a
 * crash or a Stripe/network error at any point:
 *
 *   1. CLAIM    held -> releasing   (conditional UPDATE: only one worker wins)
 *   2. STRIPE   capture + transfer  (idempotency keys derived from payment id)
 *   3. FINALISE releasing -> released, job completed (one DB transaction)
 *
 * The provider's payout account is checked before anything is captured, and
 * a payment is only marked released with a transfer id Stripe returned.
 * Problems retrying cannot fix (no payout account) park the payment in
 * 'release_failed' for an admin to retry; the job stays open meanwhile.
 *
 * A database rollback cannot undo a Stripe call, so no Stripe call happens
 * inside a transaction. If step 2 or 3 fails the payment stays 'releasing'
 * and resumeStuckReleases() picks it up again; the idempotency keys make the
 * repeated Stripe calls return the original results instead of charging or
 * paying out twice.
 */

const RESUME_AFTER_MINUTES = 10;
const AUTO_RELEASE_AFTER_HOURS = 72;
// Transient failures (network, Stripe outage) are retried by the hourly job
// this many times before the payment is parked in 'release_failed'.
const MAX_RELEASE_ATTEMPTS = 5;

const captureKey = (paymentId) => `escrow-capture-${paymentId}`;
const transferKey = (paymentId) => `escrow-transfer-${paymentId}`;
const transferGroup = (paymentId) => `escrow-payment-${paymentId}`;

/**
 * The provider cannot be paid (no connected account, transfers not enabled,
 * Stripe not configured). Retrying will not help until someone fixes it, so
 * the payment goes to 'release_failed' instead of being retried forever.
 */
class PayoutUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PayoutUnavailableError';
  }
}

function createEscrowService({ db, stripe, logger }) {
  // A payment row is created as 'pending' and only becomes 'held' once Stripe
  // reports the funds as authorised. If the webhook has not arrived yet, ask
  // Stripe directly so a confirmed authorisation is never ignored.
  async function syncPendingPayment(payment) {
    if (payment.status !== 'pending' || !stripe || !payment.stripe_payment_intent_id) return payment;
    const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    if (intent.status === 'requires_capture' || intent.status === 'succeeded') {
      await transitionPayment(db, { id: payment.id, from: 'pending', to: 'held', set: 'held_at = NOW()' });
      return { ...payment, status: 'held' };
    }
    return payment;
  }

  const claimForRelease = (paymentId) =>
    transitionPayment(db, {
      id: paymentId,
      from: 'held',
      to: 'releasing',
      set: 'release_started_at = NOW(), release_attempts = release_attempts + 1',
    });

  // Checked before any money moves: never capture a customer's funds for a
  // provider who cannot receive them.
  async function payoutDestination(payment) {
    const [profiles] = await db.query('SELECT stripe_account_id FROM provider_profiles WHERE user_id = ?', [payment.provider_id]);
    const destination = profiles[0]?.stripe_account_id;
    if (!destination) {
      throw new PayoutUnavailableError(`Provider ${payment.provider_id} has no connected Stripe account`);
    }
    const account = await stripe.accounts.retrieve(destination);
    if (account?.capabilities?.transfers !== 'active') {
      throw new PayoutUnavailableError(`Stripe account ${destination} cannot receive transfers yet`);
    }
    return destination;
  }

  // Idempotency keys expire after 24h. If an earlier attempt created the
  // transfer but its id was never recorded, find it by its transfer group
  // instead of relying on the key, so a late resume cannot pay twice.
  async function recordedTransfer(payment) {
    if (payment.stripe_transfer_id) return payment.stripe_transfer_id;
    const existing = await stripe.transfers.list({ transfer_group: transferGroup(payment.id), limit: 1 });
    if (existing.data.length === 0) return null;
    await db.query('UPDATE payments SET stripe_transfer_id = ? WHERE id = ?', [existing.data[0].id, payment.id]);
    return existing.data[0].id;
  }

  async function capture(payment) {
    const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    if (intent.status === 'requires_capture') {
      await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {}, { idempotencyKey: captureKey(payment.id) });
    } else if (intent.status !== 'succeeded') {
      throw new Error(`Payment intent ${intent.id} cannot be captured (status: ${intent.status})`);
    }
  }

  // Returns the id of a transfer Stripe confirmed. Never returns empty: a
  // release without a transfer must fail, not complete.
  async function moveMoney(payment) {
    if (!stripe) throw new PayoutUnavailableError('Stripe is not configured');
    if (!payment.stripe_payment_intent_id) throw new PayoutUnavailableError(`Payment ${payment.id} has no PaymentIntent`);

    const recorded = await recordedTransfer(payment);
    const destination = recorded ? null : await payoutDestination(payment);

    await capture(payment);
    if (recorded) return recorded;

    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(Number(payment.provider_payout) * 100),
        currency: 'usd',
        destination,
        transfer_group: transferGroup(payment.id),
        metadata: { job_id: String(payment.job_id), payment_id: String(payment.id) },
      },
      { idempotencyKey: transferKey(payment.id) }
    );
    if (!transfer?.id) throw new Error(`Stripe returned no transfer for payment ${payment.id}`);
    // Record the transfer immediately so a later failure cannot lose it
    await db.query('UPDATE payments SET stripe_transfer_id = ? WHERE id = ?', [transfer.id, payment.id]);
    return transfer.id;
  }

  async function completeJob(conn, jobId) {
    const [jobRows] = await conn.query('SELECT provider_id, status FROM jobs WHERE id = ? FOR UPDATE', [jobId]);
    if (jobRows.length === 0 || jobRows[0].status === 'completed') return;
    await conn.query("UPDATE jobs SET status = 'completed' WHERE id = ?", [jobId]);
    if (jobRows[0].provider_id) {
      await conn.query('UPDATE provider_profiles SET total_jobs_done = total_jobs_done + 1 WHERE user_id = ?', [jobRows[0].provider_id]);
    }
  }

  async function inTransaction(work) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await work(conn);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Marks the payment released and the job completed together. If the
  // payment is no longer 'releasing' (another worker finished or failed it),
  // requireTransition throws and the job update is rolled back with it.
  async function finalise(payment, transferId) {
    if (!transferId) throw new Error(`Refusing to release payment ${payment.id} without a Stripe transfer`);
    await inTransaction(async (conn) => {
      await requireTransition(conn, {
        id: payment.id,
        from: 'releasing',
        to: 'released',
        set: 'released_at = NOW(), stripe_transfer_id = ?',
        setParams: [transferId],
      });
      await completeJob(conn, payment.job_id);
    });
  }

  async function markReleaseFailed(payment, reason) {
    const moved = await transitionPayment(db, {
      id: payment.id,
      from: 'releasing',
      to: 'release_failed',
      set: 'release_error = ?',
      setParams: [String(reason).slice(0, 500)],
    });
    if (moved) logger.error(`Release of payment ${payment.id} for job ${payment.job_id} needs attention: ${reason}`);
  }

  async function runRelease(payment) {
    let transferId;
    try {
      transferId = await moveMoney(payment);
    } catch (err) {
      if (err instanceof PayoutUnavailableError) await markReleaseFailed(payment, err.message);
      throw err;
    }
    await finalise(payment, transferId);
  }

  // A job without an escrow payment may only complete when it was agreed to
  // be settled outside the platform. A missing payment row is not a licence
  // to complete an online job.
  async function completeUnpaidJob(jobId) {
    const [jobs] = await db.query('SELECT payment_mode FROM jobs WHERE id = ?', [jobId]);
    if (jobs.length === 0) throw new AppError('Job not found', 404);
    const mode = jobs[0].payment_mode || 'online_escrow';
    if (mode === 'online_escrow') {
      throw new AppError('This job has no payment held in escrow, so it cannot be completed yet', 409);
    }
    await inTransaction((conn) => completeJob(conn, jobId));
    return { released: false, completed: true, settlement: mode };
  }

  // Capture the held payment, pay the provider and mark the job completed.
  // Used by customer confirm, provider confirm and the 72h auto-release.
  async function releaseEscrowForJob(jobId) {
    const [payments] = await db.query(
      "SELECT * FROM payments WHERE job_id = ? AND status IN ('pending', 'held', 'releasing', 'release_failed', 'released')",
      [jobId]
    );
    if (payments.length === 0) return completeUnpaidJob(jobId);

    const payment = await syncPendingPayment(payments[0]);

    switch (payment.status) {
      case 'released':
        return { released: true, completed: true };
      case 'pending':
        throw new AppError('Payment has not been authorised yet, so it cannot be released', 409);
      case 'releasing':
        // Another request or a previous attempt is already releasing it
        return { released: false, inProgress: true };
      case 'release_failed':
        throw new AppError('The payout to the provider failed and is waiting for support to retry it', 409);
      default:
        break;
    }

    if (!(await claimForRelease(payment.id))) {
      return { released: false, inProgress: true };
    }
    try {
      await runRelease({ ...payment, status: 'releasing' });
    } catch (err) {
      if (err instanceof PayoutUnavailableError) {
        throw new AppError('The provider cannot receive payouts yet. The payment stays held and support has been notified.', 409);
      }
      throw err;
    }
    return { released: true, completed: true };
  }

  // Admin action once the cause (e.g. missing payout account) is fixed
  async function retryFailedRelease(paymentId) {
    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (rows.length === 0) throw new AppError('Payment not found', 404);
    const moved = await transitionPayment(db, {
      id: rows[0].id,
      from: 'release_failed',
      to: 'releasing',
      set: 'release_started_at = NOW(), release_attempts = 1, release_error = NULL',
    });
    if (!moved) throw new AppError(`Only failed releases can be retried (status: ${rows[0].status})`, 409);
    try {
      await runRelease({ ...rows[0], status: 'releasing' });
    } catch (err) {
      if (err instanceof PayoutUnavailableError) throw new AppError(err.message, 409);
      throw err;
    }
    return { released: true };
  }

  // Finish releases that were claimed but never finalised (crash, Stripe outage)
  async function resumeStuckReleases() {
    const [stuck] = await db.query(
      `SELECT * FROM payments
       WHERE status = 'releasing' AND release_started_at < DATE_SUB(NOW(), INTERVAL ${RESUME_AFTER_MINUTES} MINUTE)`
    );
    for (const payment of stuck) {
      if ((payment.release_attempts || 0) >= MAX_RELEASE_ATTEMPTS) {
        await markReleaseFailed(payment, `Gave up after ${payment.release_attempts} attempts`);
        continue;
      }
      // Re-claim so two workers cannot resume the same payment at once
      const [claimed] = await db.query(
        `UPDATE payments SET release_started_at = NOW(), release_attempts = release_attempts + 1
         WHERE id = ? AND status = 'releasing' AND release_started_at < DATE_SUB(NOW(), INTERVAL ${RESUME_AFTER_MINUTES} MINUTE)`,
        [payment.id]
      );
      if (claimed.affectedRows !== 1) continue;
      try {
        await runRelease(payment);
        logger.info(`Resumed release of payment ${payment.id} for job ${payment.job_id}`);
      } catch (err) {
        logger.error(`Failed to resume release of payment ${payment.id}: ${err.message}`);
      }
    }
  }

  // Safety net so funds never get stuck if a party goes silent
  async function autoReleasePayments() {
    try {
      await resumeStuckReleases();
      const [payments] = await db.query(
        `SELECT p.id, p.job_id
         FROM payments p
         JOIN jobs j ON p.job_id = j.id
         WHERE p.status = 'held'
           AND j.status = 'in_progress'
           AND p.held_at < DATE_SUB(NOW(), INTERVAL ${AUTO_RELEASE_AFTER_HOURS} HOUR)`
      );
      for (const payment of payments) {
        try {
          await releaseEscrowForJob(payment.job_id);
          logger.info(`Auto-released payment ${payment.id} for job ${payment.job_id}`);
        } catch (err) {
          logger.error(`Failed to auto-release payment ${payment.id}: ${err.message}`);
        }
      }
    } catch (err) {
      logger.error(`Auto-release check failed: ${err.message}`);
    }
  }

  return { releaseEscrowForJob, retryFailedRelease, autoReleasePayments, resumeStuckReleases };
}

// Default instance wired to the real database and Stripe client, created on
// first use so tests can build their own with createEscrowService().
let defaultService;
const service = () =>
  (defaultService ||= createEscrowService({
    db: require('../config/db'),
    stripe: require('../config/stripe'),
    logger: require('../utils/logger'),
  }));

module.exports = {
  createEscrowService,
  PayoutUnavailableError,
  MAX_RELEASE_ATTEMPTS,
  captureKey,
  transferKey,
  releaseEscrowForJob: (jobId) => service().releaseEscrowForJob(jobId),
  retryFailedRelease: (paymentId) => service().retryFailedRelease(paymentId),
  autoReleasePayments: () => service().autoReleasePayments(),
};
