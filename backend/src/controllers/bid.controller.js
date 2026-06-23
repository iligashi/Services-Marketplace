const db = require('../config/db');
const { AppError } = require('../middleware/error.middleware');
const { getBadge } = require('../services/reputation.service');
const { createNotification } = require('../services/notification.service');

exports.create = async (req, res, next) => {
  try {
    const { job_id, amount, message, estimated_hours } = req.body;

    // Verify job exists and is open
    const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ? AND status = ?', [job_id, 'open']);
    if (jobs.length === 0) {
      throw new AppError('Job not found or not open for bids', 404);
    }

    // Provider cannot bid on own job
    if (jobs[0].customer_id === req.user.id) {
      throw new AppError('Cannot bid on your own job', 400);
    }

    // Check duplicate bid
    const [existing] = await db.query('SELECT id FROM bids WHERE job_id = ? AND provider_id = ?', [job_id, req.user.id]);
    if (existing.length > 0) {
      throw new AppError('You already bid on this job', 409);
    }

    const [result] = await db.query(
      'INSERT INTO bids (job_id, provider_id, amount, message, estimated_hours) VALUES (?, ?, ?, ?, ?)',
      [job_id, req.user.id, amount, message || null, estimated_hours || null]
    );

    await createNotification(
      jobs[0].customer_id,
      'new_bid',
      'New bid received',
      `You received a $${amount} bid on "${jobs[0].title}"`,
      { job_id, bid_id: result.insertId }
    );

    res.status(201).json({ message: 'Bid submitted', bid_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

exports.getForJob = async (req, res, next) => {
  try {
    const [bids] = await db.query(
      `SELECT b.*, u.name as provider_name, u.avatar_url as provider_avatar,
              pp.avg_rating, pp.total_jobs_done, pp.years_experience, pp.id_verified
       FROM bids b
       JOIN users u ON b.provider_id = u.id
       LEFT JOIN provider_profiles pp ON u.id = pp.user_id
       WHERE b.job_id = ?
       ORDER BY pp.avg_rating DESC, b.amount ASC`,
      [req.params.jobId]
    );

    const bidsWithBadges = bids.map((b) => ({ ...b, badge: getBadge(b) }));

    res.json({ bids: bidsWithBadges });
  } catch (err) {
    next(err);
  }
};

exports.accept = async (req, res, next) => {
  try {
    const bidId = req.params.id;

    // Get bid and job
    const [bids] = await db.query(
      `SELECT b.*, j.customer_id, j.status as job_status
       FROM bids b JOIN jobs j ON b.job_id = j.id
       WHERE b.id = ?`,
      [bidId]
    );

    if (bids.length === 0) {
      throw new AppError('Bid not found', 404);
    }

    const bid = bids[0];

    if (bid.customer_id !== req.user.id) {
      throw new AppError('Only the job owner can accept bids', 403);
    }
    if (bid.job_status !== 'open') {
      throw new AppError('Job is no longer open', 400);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Re-check job is still open inside the transaction
      const [jobCheck] = await conn.query('SELECT status FROM jobs WHERE id = ? FOR UPDATE', [bid.job_id]);
      if (jobCheck.length === 0 || jobCheck[0].status !== 'open') {
        await conn.rollback();
        throw new AppError('Job is no longer open', 400);
      }

      // Accept this bid
      const [acceptResult] = await conn.query('UPDATE bids SET status = ? WHERE id = ?', ['accepted', bidId]);
      if (acceptResult.affectedRows === 0) {
        await conn.rollback();
        throw new AppError('Failed to accept bid', 500);
      }

      // Reject all other bids for this job
      await conn.query('UPDATE bids SET status = ? WHERE job_id = ? AND id != ?', ['rejected', bid.job_id, bidId]);
      // Update job status and assigned provider
      await conn.query('UPDATE jobs SET status = ?, provider_id = ? WHERE id = ?', ['assigned', bid.provider_id, bid.job_id]);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [jobTitleRows] = await db.query('SELECT title FROM jobs WHERE id = ?', [bid.job_id]);
    await createNotification(
      bid.provider_id,
      'bid_accepted',
      'Your bid was accepted!',
      `Your bid on "${jobTitleRows[0]?.title || 'a job'}" was accepted.`,
      { job_id: bid.job_id, bid_id: bidId }
    );

    res.json({ message: 'Bid accepted, job assigned', provider_id: bid.provider_id });
  } catch (err) {
    next(err);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const [bids] = await db.query(
      `SELECT b.*, j.customer_id FROM bids b JOIN jobs j ON b.job_id = j.id WHERE b.id = ?`,
      [req.params.id]
    );

    if (bids.length === 0) {
      throw new AppError('Bid not found', 404);
    }
    if (bids[0].customer_id !== req.user.id) {
      throw new AppError('Only the job owner can reject bids', 403);
    }

    await db.query('UPDATE bids SET status = ? WHERE id = ?', ['rejected', req.params.id]);
    res.json({ message: 'Bid rejected' });
  } catch (err) {
    next(err);
  }
};

exports.getMyBids = async (req, res, next) => {
  try {
    const [bids] = await db.query(
      `SELECT b.*, j.title as job_title, j.status as job_status, j.budget,
              j.location_address, j.deadline, c.name as category_name
       FROM bids b
       JOIN jobs j ON b.job_id = j.id
       LEFT JOIN categories c ON j.category_id = c.id
       WHERE b.provider_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({ bids });
  } catch (err) {
    next(err);
  }
};
