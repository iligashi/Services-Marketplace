const router = require('express').Router();
const db = require('../config/db');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { AppError } = require('../middleware/error.middleware');
const { ACCOUNT_STATUSES } = require('../services/account-status');
const { retryFailedRelease } = require('../services/escrow.service');
const { userRoom } = require('../sockets/socket-auth');

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
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar_url, u.is_verified, u.created_at,
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

// Suspend or reactivate an account. Suspension takes effect immediately:
// the auth middleware re-reads the status on every request, the refresh
// token is revoked and any open sockets are disconnected.
router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;
    if (!Number.isInteger(userId) || userId <= 0) throw new AppError('Invalid user id', 400);
    if (!ACCOUNT_STATUSES.includes(status)) {
      throw new AppError(`status must be one of: ${ACCOUNT_STATUSES.join(', ')}`, 400);
    }
    if (userId === req.user.id) throw new AppError('You cannot change the status of your own account', 400);

    const [result] = await db.query(
      status === 'suspended'
        ? 'UPDATE users SET status = ?, refresh_token = NULL WHERE id = ?'
        : 'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });

    if (status === 'suspended') {
      req.app.get('io')?.in(userRoom(userId)).disconnectSockets(true);
    }
    res.json({ message: `User ${status === 'suspended' ? 'suspended' : 'reactivated'}`, status });
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

// Retry a payout that ended in 'release_failed' once its cause is fixed
// (e.g. the provider connected a Stripe account)
router.post('/payments/:id/retry-release', async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);
    if (!Number.isInteger(paymentId) || paymentId <= 0) throw new AppError('Invalid payment id', 400);
    res.json(await retryFailedRelease(paymentId));
  } catch (err) {
    next(err);
  }
});

// Mark a job as settled offline ('manual') or move it back to escrow.
// Not allowed once a live escrow payment exists for the job.
router.patch('/jobs/:id/payment-mode', async (req, res, next) => {
  try {
    const jobId = Number(req.params.id);
    const { payment_mode: mode } = req.body;
    if (!Number.isInteger(jobId) || jobId <= 0) throw new AppError('Invalid job id', 400);
    if (!['online_escrow', 'cash', 'manual'].includes(mode)) {
      throw new AppError('payment_mode must be one of: online_escrow, cash, manual', 400);
    }
    const [live] = await db.query(
      "SELECT id FROM payments WHERE job_id = ? AND status NOT IN ('failed', 'refunded')",
      [jobId]
    );
    if (live.length > 0) throw new AppError('This job already has an escrow payment', 409);

    const [result] = await db.query(
      "UPDATE jobs SET payment_mode = ? WHERE id = ? AND status <> 'completed'",
      [mode, jobId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Open job not found' });
    res.json({ message: 'Payment mode updated', payment_mode: mode });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
