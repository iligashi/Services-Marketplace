const db = require('../config/db');
const { AppError } = require('../middleware/error.middleware');

exports.create = async (req, res, next) => {
  try {
    const { job_id, reviewee_id, rating, comment } = req.body;

    // Verify job is completed
    const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ? AND status = ?', [job_id, 'completed']);
    if (jobs.length === 0) {
      throw new AppError('Job not found or not completed', 404);
    }

    const job = jobs[0];

    // Verify reviewer is part of this job
    const [bids] = await db.query(
      "SELECT provider_id FROM bids WHERE job_id = ? AND status = 'accepted'",
      [job_id]
    );
    const providerId = bids.length > 0 ? bids[0].provider_id : null;

    const isCustomer = job.customer_id === req.user.id;
    const isProvider = providerId === req.user.id;

    if (!isCustomer && !isProvider) {
      throw new AppError('You are not part of this job', 403);
    }

    // Verify reviewee is the other party
    if (isCustomer && reviewee_id !== providerId) {
      throw new AppError('Invalid reviewee', 400);
    }
    if (isProvider && reviewee_id !== job.customer_id) {
      throw new AppError('Invalid reviewee', 400);
    }

    // Check for existing review
    const [existing] = await db.query(
      'SELECT id FROM reviews WHERE job_id = ? AND reviewer_id = ?',
      [job_id, req.user.id]
    );
    if (existing.length > 0) {
      throw new AppError('You already reviewed this job', 409);
    }

    await db.query(
      'INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [job_id, req.user.id, reviewee_id, rating, comment || null]
    );

    // Update provider's avg_rating if the reviewee is a provider
    const [revieweeUser] = await db.query('SELECT role FROM users WHERE id = ?', [reviewee_id]);
    if (revieweeUser.length > 0 && revieweeUser[0].role === 'provider') {
      const [avgResult] = await db.query(
        'SELECT AVG(rating) as avg_rating FROM reviews WHERE reviewee_id = ?',
        [reviewee_id]
      );
      await db.query(
        'UPDATE provider_profiles SET avg_rating = ? WHERE user_id = ?',
        [avgResult[0].avg_rating || 0, reviewee_id]
      );
    }

    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    next(err);
  }
};

exports.getForUser = async (req, res, next) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar,
              j.title as job_title
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN jobs j ON r.job_id = j.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );

    const [avgResult] = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewee_id = ?',
      [req.params.userId]
    );

    res.json({
      reviews,
      summary: {
        avg_rating: parseFloat(avgResult[0].avg_rating) || 0,
        total_reviews: avgResult[0].total,
      },
    });
  } catch (err) {
    next(err);
  }
};
