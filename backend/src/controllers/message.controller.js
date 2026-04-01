const db = require('../config/db');
const { AppError } = require('../middleware/error.middleware');

exports.getMessages = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Verify user is part of this job
    const [jobs] = await db.query(
      `SELECT j.customer_id, b.provider_id
       FROM jobs j
       LEFT JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      throw new AppError('Job not found', 404);
    }

    const job = jobs[0];
    if (job.customer_id !== req.user.id && job.provider_id !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Unauthorized', 403);
    }

    const [messages] = await db.query(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.job_id = ?
       ORDER BY m.sent_at ASC`,
      [jobId]
    );

    // Mark as read
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE job_id = ? AND sender_id != ?',
      [jobId, req.user.id]
    );

    res.json({ messages });
  } catch (err) {
    next(err);
  }
};

exports.send = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { content } = req.body;

    // Verify user is part of this job
    const [jobs] = await db.query(
      `SELECT j.customer_id, b.provider_id
       FROM jobs j
       LEFT JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      throw new AppError('Job not found', 404);
    }

    const job = jobs[0];
    if (job.customer_id !== req.user.id && job.provider_id !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    const [result] = await db.query(
      'INSERT INTO messages (job_id, sender_id, content) VALUES (?, ?, ?)',
      [jobId, req.user.id, content]
    );

    const [msg] = await db.query(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: msg[0] });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const [result] = await db.query(
      `SELECT COUNT(*) as count FROM messages m
       JOIN jobs j ON m.job_id = j.id
       LEFT JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
       WHERE m.is_read = FALSE AND m.sender_id != ?
       AND (j.customer_id = ? OR b.provider_id = ?)`,
      [req.user.id, req.user.id, req.user.id]
    );

    res.json({ unread_count: result[0].count });
  } catch (err) {
    next(err);
  }
};
