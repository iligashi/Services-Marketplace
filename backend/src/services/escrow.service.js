const { AppError } = require('../middleware/error.middleware');

/*
 * Escrow release is split into three steps so it is safe to retry after a
 * crash or a Stripe/network error at any point:
 *
 *   1. CLAIM    held -> releasing   (conditional UPDATE: only one worker wins)
 *   2. STRIPE   capture + transfer  (idempotency keys derived from payment id)
 *   3. FINALISE releasing -> released, job completed (one DB transaction)
 *
 * A database rollback cannot undo a Stripe call, so no Stripe call happens
 * inside a transaction. If step 2 or 3 fails the payment stays 'releasing'
 * and resumeStuckReleases() picks it up again; the idempotency keys make the
 * repeated Stripe calls return the original results instead of charging or
 * paying out twice.
 */

const RESUME_AFTER_MINUTES = 10;
const AUTO_RELEASE_AFTER_HOURS = 72;

const captureKey = (paymentId) => `escrow-capture-${paymentId}`;
const transferKey = (paymentId) => `escrow-transfer-${paymentId}`;

function createEscrowService({ db, stripe, logger }) {
  // A payment row is created as 'pending' and only becomes 'held' once Stripe
  // reports the funds as authorised. If the webhook has not arrived yet, ask
  // Stripe directly so a confirmed authorisation is never ignored.
  async function syncPendingPayment(payment) {
    if (payment.status !== 'pending' || !stripe || !payment.stripe_payment_intent_id) return payment;
    const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    if (intent.status === 'requires_capture' || intent.status === 'succeeded') {
      await db.query(
        "UPDATE payments SET status = 'held', held_at = NOW() WHERE id = ? AND status = 'pending'",
        [payment.id]
      );
      return { ...payment, status: 'held' };
    }
    return payment;
  }

  async function claimForRelease(paymentId) {
    const [result] = await db.query(
      "UPDATE payments SET status = 'releasing', release_started_at = NOW() WHERE id = ? AND status = 'held'",
      [paymentId]
    );
    return result.affectedRows === 1;
  }

  async function moveMoney(payment) {
    if (!stripe) return null;

    if (payment.stripe_payment_intent_id) {
      const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
      if (intent.status === 'requires_capture') {
        await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {}, { idempotencyKey: captureKey(payment.id) });
      } else if (intent.status !== 'succeeded') {
        throw new Error(`Payment intent ${intent.id} cannot be captured (status: ${intent.status})`);
      }
    }

    if (payment.stripe_transfer_id) return payment.stripe_transfer_id;

    const [profiles] = await db.query('SELECT stripe_account_id FROM provider_profiles WHERE user_id = ?', [payment.provider_id]);
    const destination = profiles[0]?.stripe_account_id;
    if (!destination) return null;

    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(Number(payment.provider_payout) * 100),
        currency: 'usd',
        destination,
        metadata: { job_id: String(payment.job_id), payment_id: String(payment.id) },
      },
      { idempotencyKey: transferKey(payment.id) }
    );
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

  async function finalise(payment, transferId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        "UPDATE payments SET status = 'released', released_at = NOW(), stripe_transfer_id = COALESCE(?, stripe_transfer_id) WHERE id = ? AND status = 'releasing'",
        [transferId, payment.id]
      );
      await completeJob(conn, payment.job_id);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async function runRelease(payment) {
    const transferId = await moveMoney(payment);
    await finalise(payment, transferId);
  }

  // Capture the held payment, pay the provider and mark the job completed.
  // Used by customer confirm, provider confirm and the 72h auto-release.
  async function releaseEscrowForJob(jobId) {
    const [payments] = await db.query(
      "SELECT * FROM payments WHERE job_id = ? AND status IN ('pending', 'held', 'releasing', 'released')",
      [jobId]
    );

    if (payments.length === 0) {
      // No escrow for this job: just complete it
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        await completeJob(conn, jobId);
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
      return { released: false };
    }

    const payment = await syncPendingPayment(payments[0]);

    if (payment.status === 'released') return { released: true };
    if (payment.status === 'pending') {
      throw new AppError('Payment has not been authorised yet, so it cannot be released', 409);
    }
    if (payment.status === 'releasing') {
      // Another request or a previous attempt is already releasing it
      return { released: false, inProgress: true };
    }

    if (!(await claimForRelease(payment.id))) {
      return { released: false, inProgress: true };
    }
    await runRelease({ ...payment, status: 'releasing' });
    return { released: true };
  }

  // Finish releases that were claimed but never finalised (crash, Stripe outage)
  async function resumeStuckReleases() {
    const [stuck] = await db.query(
      `SELECT * FROM payments
       WHERE status = 'releasing' AND release_started_at < DATE_SUB(NOW(), INTERVAL ${RESUME_AFTER_MINUTES} MINUTE)`
    );
    for (const payment of stuck) {
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

  return { releaseEscrowForJob, autoReleasePayments, resumeStuckReleases };
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
  captureKey,
  transferKey,
  releaseEscrowForJob: (jobId) => service().releaseEscrowForJob(jobId),
  autoReleasePayments: () => service().autoReleasePayments(),
};
