const mysql = require('mysql2/promise');
const config = require('./env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

pool.getConnection()
  .then((conn) => {
    logger.info('MySQL connected successfully');
    conn.release();
  })
  .catch((err) => {
    logger.error('MySQL connection failed:', err.message);
  });

module.exports = pool;
