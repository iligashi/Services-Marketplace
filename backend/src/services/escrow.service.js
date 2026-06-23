const stripe = require('../config/stripe');
const db = require('../config/db');
const logger = require('../utils/logger');

// Captures the held Stripe payment, transfers payout to the provider, and marks
// the job completed. Used by: customer confirm, provider confirm (when both sides
// have already confirmed), and the 72h auto-release safety net.
async function releaseEscrowForJob(jobId) {
  const [payments] = await db.query(
    "SELECT * FROM payments WHERE job_id = ? AND status = 'held'",
    [jobId]
  );

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    if (payments.length > 0) {
      const payment = payments[0];

      if (stripe && payment.stripe_payment_intent_id) {
        await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);
      }

      let transferId = null;
      if (stripe) {
        const [profiles] = await conn.query(
          'SELECT stripe_account_id FROM provider_profiles WHERE user_id = ?',
          [payment.provider_id]
        );
        if (profiles.length > 0 && profiles[0].stripe_account_id) {
          const transfer = await stripe.transfers.create({
            amount: Math.round(payment.provider_payout * 100),
            currency: 'usd',
            destination: profiles[0].stripe_account_id,
            metadata: { job_id: jobId.toString() },
          });
          transferId = transfer.id;
        }
      }

      await conn.query(
        'UPDATE payments SET status = ?, released_at = NOW(), stripe_transfer_id = ? WHERE id = ?',
        ['released', transferId, payment.id]
      );
    }

    const [jobRows] = await conn.query('SELECT provider_id FROM jobs WHERE id = ?', [jobId]);
    await conn.query("UPDATE jobs SET status = 'completed' WHERE id = ?", [jobId]);

    if (jobRows.length > 0 && jobRows[0].provider_id) {
      await conn.query(
        'UPDATE provider_profiles SET total_jobs_done = total_jobs_done + 1 WHERE user_id = ?',
        [jobRows[0].provider_id]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Auto-release payments after 72 hours if neither side has confirmed or disputed —
// safety net so funds never get stuck if a party goes silent.
async function autoReleasePayments() {
  try {
    const [payments] = await db.query(
      `SELECT p.*, j.status as job_status
       FROM payments p
       JOIN jobs j ON p.job_id = j.id
       WHERE p.status = 'held'
         AND j.status = 'in_progress'
         AND p.held_at < DATE_SUB(NOW(), INTERVAL 72 HOUR)`
    );

    for (const payment of payments) {
      try {
        await releaseEscrowForJob(payment.job_id);
        logger.info(`Auto-released payment ${payment.id} for job ${payment.job_id}`);
      } catch (err) {
        logger.error(`Failed to auto-release payment ${payment.id}:`, err.message);
      }
    }
  } catch (err) {
    logger.error('Auto-release check failed:', err.message);
  }
}

module.exports = { autoReleasePayments, releaseEscrowForJob };
