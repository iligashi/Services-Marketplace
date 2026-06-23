const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/db');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notification.service');

function initSocket(io) {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`User ${socket.userId} connected via socket`);

    // Join a job's chat room
    socket.on('join_room', async (jobId) => {
      try {
        // Verify user is part of this job
        const [jobs] = await db.query(
          `SELECT j.customer_id, b.provider_id
           FROM jobs j
           LEFT JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
           WHERE j.id = ?`,
          [jobId]
        );

        if (jobs.length === 0) return;

        const job = jobs[0];
        if (
          job.customer_id !== socket.userId &&
          job.provider_id !== socket.userId &&
          socket.userRole !== 'admin'
        ) {
          return;
        }

        socket.join(`job_${jobId}`);
        logger.debug(`User ${socket.userId} joined room job_${jobId}`);
      } catch (err) {
        logger.error('Error joining room:', err.message);
      }
    });

    // Send message
    socket.on('send_message', async ({ jobId, content }) => {
      try {
        const [result] = await db.query(
          'INSERT INTO messages (job_id, sender_id, content) VALUES (?, ?, ?)',
          [jobId, socket.userId, content]
        );

        const [msg] = await db.query(
          `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
           FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
          [result.insertId]
        );

        io.to(`job_${jobId}`).emit('new_message', msg[0]);

        // Push notification to the other party in the job (fire-and-forget)
        const [jobRows] = await db.query(
          `SELECT j.customer_id, j.title, b.provider_id
           FROM jobs j LEFT JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
           WHERE j.id = ?`,
          [jobId]
        );
        if (jobRows.length > 0) {
          const { customer_id, provider_id, title } = jobRows[0];
          const recipientId = socket.userId === customer_id ? provider_id : customer_id;
          if (recipientId) {
            createNotification(
              recipientId,
              'new_message',
              'New message',
              `New message on "${title}": ${content.slice(0, 80)}`,
              { job_id: jobId }
            );
          }
        }
      } catch (err) {
        logger.error('Error sending message:', err.message);
      }
    });

    // Typing indicator
    socket.on('typing', ({ jobId }) => {
      socket.to(`job_${jobId}`).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', ({ jobId }) => {
      socket.to(`job_${jobId}`).emit('user_stop_typing', { userId: socket.userId });
    });

    // Read receipts — mark all messages from the other party as read, notify room
    socket.on('mark_read', async ({ jobId }) => {
      try {
        await db.query(
          'UPDATE messages SET is_read = TRUE WHERE job_id = ? AND sender_id != ? AND is_read = FALSE',
          [jobId, socket.userId]
        );
        socket.to(`job_${jobId}`).emit('messages_read', { jobId, readerId: socket.userId });
      } catch (err) {
        logger.error('Error marking messages read:', err.message);
      }
    });

    socket.on('leave_room', (jobId) => {
      socket.leave(`job_${jobId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`User ${socket.userId} disconnected`);
    });
  });
}

module.exports = initSocket;
