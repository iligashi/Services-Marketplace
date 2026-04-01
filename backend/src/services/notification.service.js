const db = require('../config/db');
const logger = require('../utils/logger');

async function createNotification(userId, type, title, message, data = {}) {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, JSON.stringify(data)]
    );
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }
}

async function getNotifications(userId, unreadOnly = false) {
  const where = unreadOnly ? 'AND is_read = FALSE' : '';
  const [rows] = await db.query(
    `SELECT * FROM notifications WHERE user_id = ? ${where} ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

async function markAsRead(userId, notificationId) {
  if (notificationId) {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [notificationId, userId]);
  } else {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
  }
}

module.exports = { createNotification, getNotifications, markAsRead };
