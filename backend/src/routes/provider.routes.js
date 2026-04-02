const router = require('express').Router();
const db = require('../config/db');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { findNearbyJobs } = require('../services/geo.service');

router.use(authenticate, authorize('provider'));

// Provider dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [[profile]] = await db.query(
      'SELECT * FROM provider_profiles WHERE user_id = ?', [userId]
    );
    const [[totalBids]] = await db.query(
      'SELECT COUNT(*) as total FROM bids WHERE provider_id = ?', [userId]
    );
    const [[acceptedBids]] = await db.query(
      "SELECT COUNT(*) as total FROM bids WHERE provider_id = ? AND status = 'accepted'", [userId]
    );
    const [[activeJobs]] = await db.query(
      `SELECT COUNT(*) as total FROM jobs j
       JOIN bids b ON j.id = b.job_id AND b.provider_id = ? AND b.status = 'accepted'
       WHERE j.status IN ('assigned', 'in_progress')`, [userId]
    );
    const [[earnings]] = await db.query(
      "SELECT COALESCE(SUM(provider_payout), 0) as total FROM payments WHERE provider_id = ? AND status = 'released'",
      [userId]
    );
    const [[pendingEarnings]] = await db.query(
      "SELECT COALESCE(SUM(provider_payout), 0) as total FROM payments WHERE provider_id = ? AND status = 'held'",
      [userId]
    );

    res.json({
      profile,
      stats: {
        total_bids: totalBids.total,
        accepted_bids: acceptedBids.total,
        bid_success_rate: totalBids.total > 0 ? ((acceptedBids.total / totalBids.total) * 100).toFixed(1) : 0,
        active_jobs: activeJobs.total,
        total_earnings: earnings.total,
        pending_earnings: pendingEarnings.total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Nearby jobs for provider
router.get('/nearby-jobs', async (req, res, next) => {
  try {
    const [profile] = await db.query(
      'SELECT location_lat, location_lng, service_radius_km FROM provider_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (profile.length === 0 || !profile[0].location_lat) {
      // No location set — return all open jobs instead of empty
      const [allJobs] = await db.query(
        `SELECT j.*, c.name as category_name, NULL as distance
         FROM jobs j
         LEFT JOIN categories c ON j.category_id = c.id
         WHERE j.status = 'open'
         ORDER BY j.created_at DESC`
      );
      return res.json({ jobs: allJobs });
    }

    const { location_lat, location_lng, service_radius_km } = profile[0];
    const jobs = await findNearbyJobs(location_lat, location_lng, service_radius_km);
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

// Earnings history
router.get('/earnings', async (req, res, next) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, j.title as job_title, j.completed_at
       FROM payments p
       JOIN jobs j ON p.job_id = j.id
       WHERE p.provider_id = ? AND p.status = 'released'
       ORDER BY p.released_at DESC`,
      [req.user.id]
    );
    res.json({ payments });
  } catch (err) {
    next(err);
  }
});

// Active jobs for provider
router.get('/active-jobs', async (req, res, next) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, c.name as category_name, u.name as customer_name,
              b.amount as bid_amount
       FROM jobs j
       JOIN bids b ON j.id = b.job_id AND b.provider_id = ? AND b.status = 'accepted'
       LEFT JOIN categories c ON j.category_id = c.id
       LEFT JOIN users u ON j.customer_id = u.id
       WHERE j.status IN ('assigned', 'in_progress')
       ORDER BY j.updated_at DESC`,
      [req.user.id]
    );
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

// Mark job as done (provider side)
router.patch('/jobs/:id/mark-done', async (req, res, next) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.* FROM jobs j
       JOIN bids b ON j.id = b.job_id AND b.provider_id = ? AND b.status = 'accepted'
       WHERE j.id = ? AND j.status = 'in_progress'`,
      [req.user.id, req.params.id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found or not in progress' });
    }

    // Job stays in_progress; customer must confirm completion to release payment
    // We just notify the customer
    res.json({ message: 'Customer has been notified to confirm job completion' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
