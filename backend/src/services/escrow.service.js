const stripe = require('../config/stripe');
const db = require('../config/db');
const config = require('../config/env');
const logger = require('../utils/logger');

// Auto-release payments after 72 hours if customer hasn't confirmed or disputed
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
        if (stripe && payment.stripe_payment_intent_id) {
          await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);
        }

        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();

          await conn.query(
            "UPDATE payments SET status = 'released', released_at = NOW() WHERE id = ?",
            [payment.id]
          );
          await conn.query("UPDATE jobs SET status = 'completed' WHERE id = ?", [payment.job_id]);
          await conn.query(
            'UPDATE provider_profiles SET total_jobs_done = total_jobs_done + 1 WHERE user_id = ?',
            [payment.provider_id]
          );

          await conn.commit();
        } catch (err) {
          await conn.rollback();
          throw err;
        } finally {
          conn.release();
        }

        logger.info(`Auto-released payment ${payment.id} for job ${payment.job_id}`);
      } catch (err) {
        logger.error(`Failed to auto-release payment ${payment.id}:`, err.message);
      }
    }
  } catch (err) {
    logger.error('Auto-release check failed:', err.message);
  }
}

module.exports = { autoReleasePayments };
