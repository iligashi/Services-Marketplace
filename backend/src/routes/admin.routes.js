const router = require('express').Router();
const db = require('../config/db');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// Dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const [[users]] = await db.query('SELECT COUNT(*) as total FROM users');
    const [[providers]] = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'provider'");
    const [[jobs]] = await db.query('SELECT COUNT(*) as total FROM jobs');
    const [[activeJobs]] = await db.query("SELECT COUNT(*) as total FROM jobs WHERE status IN ('open', 'assigned', 'in_progress')");
    const [[completedJobs]] = await db.query("SELECT COUNT(*) as total FROM jobs WHERE status = 'completed'");
    const [[openDisputes]] = await db.query("SELECT COUNT(*) as total FROM disputes WHERE status = 'open'");
    const [[revenue]] = await db.query("SELECT COALESCE(SUM(platform_fee), 0) as total FROM payments WHERE status = 'released'");

    res.json({
      users: users.total,
      providers: providers.total,
      jobs: jobs.total,
      activeJobs: activeJobs.total,
      completedJobs: completedJobs.total,
      openDisputes: openDisputes.total,
      totalRevenue: revenue.total,
    });
  } catch (err) {
    next(err);
  }
});

// List users
router.get('/users', async (req, res, next) => {
  try {
    const { role, search } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (role) { where += ' AND u.role = ?'; params.push(role); }
    if (search) { where += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.is_verified, u.created_at,
              pp.avg_rating, pp.total_jobs_done
       FROM users u
       LEFT JOIN provider_profiles pp ON u.id = pp.user_id
       ${where}
       ORDER BY u.created_at DESC`,
      params
    );

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// Toggle user verification
router.patch('/users/:id/verify', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT is_verified FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    await db.query('UPDATE users SET is_verified = ? WHERE id = ?', [!rows[0].is_verified, req.params.id]);

    // Also update provider profile id_verified
    await db.query('UPDATE provider_profiles SET id_verified = ? WHERE user_id = ?', [!rows[0].is_verified, req.params.id]);

    res.json({ message: 'User verification toggled' });
  } catch (err) {
    next(err);
  }
});

// Manage categories
router.post('/categories', async (req, res, next) => {
  try {
    const { name, slug, icon_url, description } = req.body;
    const [result] = await db.query(
      'INSERT INTO categories (name, slug, icon_url, description) VALUES (?, ?, ?, ?)',
      [name, slug, icon_url || null, description || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created' });
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const { name, slug, icon_url, description, is_active } = req.body;
    await db.query(
      `UPDATE categories SET
        name = COALESCE(?, name), slug = COALESCE(?, slug),
        icon_url = COALESCE(?, icon_url), description = COALESCE(?, description),
        is_active = COALESCE(?, is_active)
      WHERE id = ?`,
      [name, slug, icon_url, description, is_active, req.params.id]
    );
    res.json({ message: 'Category updated' });
  } catch (err) {
    next(err);
  }
});

// Recent payments / revenue
router.get('/payments', async (req, res, next) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, j.title as job_title,
              cu.name as customer_name, pu.name as provider_name
       FROM payments p
       JOIN jobs j ON p.job_id = j.id
       JOIN users cu ON p.customer_id = cu.id
       JOIN users pu ON p.provider_id = pu.id
       ORDER BY p.created_at DESC
       LIMIT 50`
    );
    res.json({ payments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
