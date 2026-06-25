require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/env');

const statements = [
  `CREATE TABLE IF NOT EXISTS saved_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved (user_id, job_id),
    INDEX idx_saved_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
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
      await connection.query(sql);
      console.log('OK:', sql.slice(0, 60).replace(/\s+/g, ' '));
    }
    console.log('Migration v3 complete!');
  } catch (err) {
    console.error('Migration v3 failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
