require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/env');

// v5: settlement guarantees and account suspension.
//
//   payments.release_failed  -> payout could not be made (no connected account,
//                               retries exhausted); an admin retries it after
//                               fixing the cause. The job stays open meanwhile.
//   jobs.payment_mode        -> how the job is settled. Only 'cash' and
//                               'manual' jobs may complete without escrow.
//   users.status             -> 'suspended' accounts are refused on every
//                               request, token refresh and socket connection.
//
// Note: open jobs created before this migration default to 'online_escrow',
// so they must be paid through escrow before they can complete. An admin can
// switch an individual job to 'manual' if it was agreed to be settled offline.
const statements = [
  `ALTER TABLE payments
     MODIFY status ENUM('pending', 'held', 'releasing', 'release_failed', 'released', 'failed', 'refunded', 'disputed') NOT NULL DEFAULT 'pending'`,
  `ALTER TABLE payments ADD COLUMN release_attempts INT NOT NULL DEFAULT 0 AFTER release_started_at`,
  `ALTER TABLE payments ADD COLUMN release_error VARCHAR(500) NULL AFTER release_attempts`,
  `ALTER TABLE jobs ADD COLUMN payment_mode ENUM('online_escrow', 'cash', 'manual') NOT NULL DEFAULT 'online_escrow' AFTER status`,
  `ALTER TABLE users ADD COLUMN status ENUM('active', 'suspended') NOT NULL DEFAULT 'active' AFTER role`,
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
    for (const sql of statements) {
      try {
        await connection.query(sql);
        console.log('OK:', sql.slice(0, 70).replace(/\s+/g, ' '));
      } catch (err) {
        if (!ALREADY_APPLIED.has(err.code)) throw err;
        console.log('SKIP (already applied):', sql.slice(0, 70).replace(/\s+/g, ' '));
      }
    }
    console.log('Migration v5 complete!');
  } catch (err) {
    console.error('Migration v5 failed:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

migrate();
