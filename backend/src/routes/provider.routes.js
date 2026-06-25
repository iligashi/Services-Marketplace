const router = require('express').Router();
const db = require('../config/db');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { findNearbyJobs } = require('../services/geo.service');
const { getBadge, getFeeRate } = require('../services/reputation.service');
const jobs = require('../controllers/job.controller');

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
      profile: profile ? { ...profile, badge: getBadge(profile), fee_rate: getFeeRate(profile) } : profile,
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

// Recommended jobs — matched to the provider's skills and recent activity
router.get('/recommended-jobs', async (req, res, next) => {
  try {
    const [[profile]] = await db.query(
      'SELECT skills, location_lat, location_lng, service_radius_km FROM provider_profiles WHERE user_id = ?',
      [req.user.id]
    );

    let skills = [];
    if (profile?.skills) {
      try {
        skills = Array.isArray(profile.skills) ? profile.skills : JSON.parse(profile.skills);
      } catch { skills = []; }
    }

    // No skills configured → fall back to the most recent open jobs
    if (!skills.length) {
      const [jobs] = await db.query(
        `SELECT j.*, c.name as category_name, NULL as relevance
         FROM jobs j LEFT JOIN categories c ON j.category_id = c.id
         WHERE j.status = 'open'
         ORDER BY j.created_at DESC LIMIT 20`
      );
      return res.json({ jobs, matched: false });
    }

    // Boolean-mode fulltext over the skill keywords, plus category-name matching
    const cleaned = skills.map((s) => String(s).replace(/[+\-<>()~*"@]/g, '').trim()).filter(Boolean);
    const booleanQuery = cleaned.map((w) => `${w.split(/\s+/)[0]}*`).join(' ');
    const catConds = cleaned.map(() => 'c.name LIKE ?').join(' OR ');
    const catParams = cleaned.map((s) => `%${s}%`);

    const [jobs] = await db.query(
      `SELECT j.*, c.name as category_name,
              MATCH(j.title, j.description) AGAINST(? IN BOOLEAN MODE) as relevance
       FROM jobs j
       LEFT JOIN categories c ON j.category_id = c.id
       WHERE j.status = 'open'
         AND (MATCH(j.title, j.description) AGAINST(? IN BOOLEAN MODE) ${catConds ? 'OR ' + catConds : ''})
       ORDER BY relevance DESC, j.created_at DESC
       LIMIT 20`,
      [booleanQuery, booleanQuery, ...catParams]
    );

    res.json({ jobs, matched: true, skills: cleaned });
  } catch (err) {
    next(err);
  }
});

// Earnings history
router.get('/earnings', async (req, res, next) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, j.title as job_title, j.updated_at as job_completed_at
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

// Mark job as done (provider side) — alias for PATCH /jobs/:id/complete,
// kept for backwards compatibility with this route path
router.patch('/jobs/:id/mark-done', jobs.markComplete);

module.exports = router;
