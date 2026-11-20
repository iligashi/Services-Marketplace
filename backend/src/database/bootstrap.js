require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const categories = require('./categories');

// Production bootstrap, safe to run on every deploy:
//   - inserts the default service categories that are missing
//   - creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD, only when no
//     admin exists yet. Remove ADMIN_PASSWORD from the environment afterwards.
// Unlike seed.js it never creates demo accounts or demo jobs.
const MIN_ADMIN_PASSWORD = 12;

async function bootstrap() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    ssl: config.db.ssl,
    database: config.db.database,
  });

  try {
    for (const cat of categories) {
      await connection.query(
        'INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [cat.name, cat.slug, cat.description]
      );
    }
    console.log(`Categories ready (${categories.length})`);

    const [[{ admins }]] = await connection.query("SELECT COUNT(*) AS admins FROM users WHERE role = 'admin'");
    if (admins > 0) {
      console.log('Admin account already exists; skipping admin bootstrap');
      return;
    }

    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';
    if (!email || !password) {
      console.log('No admin yet: set ADMIN_EMAIL and ADMIN_PASSWORD and redeploy to create one');
      return;
    }
    if (password.length < MIN_ADMIN_PASSWORD) {
      throw new Error(`ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD} characters`);
    }

    const hash = await bcrypt.hash(password, 12);
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified) VALUES (?, ?, ?, 'admin', TRUE)`,
      [process.env.ADMIN_NAME || 'Admin', email, hash]
    );
    console.log(`Admin account created for ${email}; remove ADMIN_PASSWORD from the environment now`);
  } catch (err) {
    console.error('Bootstrap failed:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

bootstrap();
