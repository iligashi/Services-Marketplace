require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/env');

// Payment state machine and one-payment-per-job guarantee.
//
//   pending   -> PaymentIntent created, card not yet authorised
//   held      -> funds authorised (webhook or on-demand sync with Stripe)
//   releasing -> release claimed; capture/transfer in flight (retry-safe)
//   released  -> captured and paid out
//   failed    -> authorisation failed; customer may retry
//   refunded / disputed -> unchanged
const statements = [
  `ALTER TABLE payments
     MODIFY status ENUM('pending', 'held', 'releasing', 'released', 'failed', 'refunded', 'disputed') NOT NULL DEFAULT 'pending'`,
  `ALTER TABLE payments ADD COLUMN release_started_at TIMESTAMP NULL AFTER held_at`,
  `ALTER TABLE payments ADD UNIQUE KEY uniq_payments_job (job_id)`,
  `ALTER TABLE payments ADD UNIQUE KEY uniq_payments_intent (stripe_payment_intent_id)`,
];

// Errors that mean "already applied", so the migration can be re-run safely
const ALREADY_APPLIED = new Set(['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME']);

async function migrate() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  try {
    const [duplicates] = await connection.query(
      'SELECT job_id, COUNT(*) AS n FROM payments GROUP BY job_id HAVING n > 1'
    );
    if (duplicates.length > 0) {
      throw new Error(
        `Jobs with more than one payment row must be reconciled first: ${duplicates.map((d) => d.job_id).join(', ')}`
      );
    }

    for (const sql of statements) {
      try {
        await connection.query(sql);
        console.log('OK:', sql.slice(0, 70).replace(/\s+/g, ' '));
      } catch (err) {
        if (!ALREADY_APPLIED.has(err.code)) throw err;
        console.log('SKIP (already applied):', sql.slice(0, 70).replace(/\s+/g, ' '));
      }
    }
    console.log('Migration v4 complete!');
  } catch (err) {
    console.error('Migration v4 failed:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

migrate();
