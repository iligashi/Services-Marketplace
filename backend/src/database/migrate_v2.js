require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/env');

// Idempotent ALTERs — ignore "already exists" errors (1060 dup column, 1061 dup key)
const statements = [
  `ALTER TABLE users ADD COLUMN push_token VARCHAR(255) NULL`,
  `ALTER TABLE jobs ADD COLUMN customer_confirmed_at DATETIME NULL`,
  `ALTER TABLE jobs ADD COLUMN provider_confirmed_at DATETIME NULL`,
  `ALTER TABLE jobs ADD FULLTEXT INDEX ft_jobs_search (title, description)`,
];

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
        console.log('OK:', sql);
      } catch (err) {
        if (err.errno === 1060 || err.errno === 1061) {
          console.log('SKIP (already exists):', sql);
        } else {
          throw err;
        }
      }
    }
    console.log('Migration v2 complete!');
  } catch (err) {
    console.error('Migration v2 failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
