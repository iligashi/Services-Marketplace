const { Expo } = require('expo-server-sdk');
const db = require('../config/db');
const logger = require('../utils/logger');

const expo = new Expo();

async function sendPushNotification(userId, title, message, data = {}) {
  try {
    const [rows] = await db.query('SELECT push_token FROM users WHERE id = ?', [userId]);
    const token = rows[0]?.push_token;
    if (!token || !Expo.isExpoPushToken(token)) return;

    const tickets = await expo.sendPushNotificationsAsync([
      { to: token, sound: 'default', title, body: message, data },
    ]);

    const ticket = tickets[0];
    if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
      await db.query('UPDATE users SET push_token = NULL WHERE id = ?', [userId]);
    }
  } catch (err) {
    logger.error('Failed to send push notification:', err.message);
  }
}

async function createNotification(userId, type, title, message, data = {}) {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, JSON.stringify(data)]
    );
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }
  // Fire-and-forget push; in-app notification row above is the source of truth
  sendPushNotification(userId, title, message, data);
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

async function registerPushToken(userId, token) {
  if (!Expo.isExpoPushToken(token)) {
    throw new Error('Invalid Expo push token');
  }
  await db.query('UPDATE users SET push_token = ? WHERE id = ?', [token, userId]);
}

module.exports = { createNotification, getNotifications, markAsRead, registerPushToken };
