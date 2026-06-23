const db = require('../config/db');
const { AppError } = require('../middleware/error.middleware');
const { paginate, paginationMeta } = require('../utils/pagination');
const { releaseEscrowForJob } = require('../services/escrow.service');
const { createNotification } = require('../services/notification.service');

exports.create = async (req, res, next) => {
  try {
    const { title, description, category_id, budget, location_lat, location_lng, location_address, deadline } = req.body;

    const photos = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const [result] = await db.query(
      `INSERT INTO jobs (customer_id, category_id, title, description, budget, location_lat, location_lng, location_address, photos, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category_id || null, title, description, budget || null, location_lat || null, location_lng || null, location_address || null, JSON.stringify(photos), deadline || null]
    );

    res.status(201).json({ message: 'Job posted', job_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { category, status, lat, lng, radius, search, page, limit } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (category) {
      where += ' AND c.slug = ?';
      params.push(category);
    }
    if (status) {
      where += ' AND j.status = ?';
      params.push(status);
    }
    if (search) {
      // Boolean-mode fulltext search with prefix wildcards on each word, falls back
      // to LIKE for queries too short for the fulltext min word length (default 4 chars)
      const words = search.trim().split(/\s+/).filter(Boolean);
      const booleanQuery = words.map((w) => `+${w.replace(/[+\-<>()~*"@]/g, '')}*`).join(' ');
      if (booleanQuery) {
        where += ' AND (MATCH(j.title, j.description) AGAINST (? IN BOOLEAN MODE) OR j.title LIKE ? OR j.description LIKE ?)';
        params.push(booleanQuery, `%${search}%`, `%${search}%`);
      }
    }

    // Geolocation filter using Haversine formula
    let distanceSelect = '';
    let distanceOrder = '';
    if (lat && lng) {
      const r = parseFloat(radius) || 25;
      distanceSelect = `, (6371 * acos(cos(radians(?)) * cos(radians(j.location_lat)) * cos(radians(j.location_lng) - radians(?)) + sin(radians(?)) * sin(radians(j.location_lat)))) AS distance`;
      params.unshift(parseFloat(lat), parseFloat(lng), parseFloat(lat));
      where += ' AND j.location_lat IS NOT NULL AND j.location_lng IS NOT NULL';
      where += ` HAVING distance <= ?`;
      params.push(r);
      distanceOrder = 'distance ASC,';
    }

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM jobs j LEFT JOIN categories c ON j.category_id = c.id ${where}`;
    // If using HAVING, count is tricky — wrap in subquery
    let totalRows;
    if (lat && lng) {
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM (
          SELECT j.id ${distanceSelect}
          FROM jobs j LEFT JOIN categories c ON j.category_id = c.id ${where}
        ) AS sub`,
        params
      );
      totalRows = countResult[0].total;
    } else {
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM jobs j LEFT JOIN categories c ON j.category_id = c.id ${where}`,
        params
      );
      totalRows = countResult[0].total;
    }

    const baseQuery = `
      SELECT j.*, c.name as category_name, c.slug as category_slug,
             u.name as customer_name, u.avatar_url as customer_avatar
             ${distanceSelect}
      FROM jobs j
      LEFT JOIN categories c ON j.category_id = c.id
      LEFT JOIN users u ON j.customer_id = u.id
      ${where}
      ORDER BY ${distanceOrder} j.created_at DESC
    `;

    const pag = paginate(baseQuery, { page, limit });
    const allParams = [...params, ...pag.values];
    const [jobs] = await db.query(pag.query, allParams);

    res.json({
      jobs,
      pagination: paginationMeta(totalRows, pag.page, pag.limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT j.*, c.name as category_name, c.slug as category_slug,
              u.name as customer_name, u.avatar_url as customer_avatar, u.phone as customer_phone,
              ab.provider_id, pu.name as provider_name, pu.avatar_url as provider_avatar
       FROM jobs j
       LEFT JOIN categories c ON j.category_id = c.id
       LEFT JOIN users u ON j.customer_id = u.id
       LEFT JOIN bids ab ON j.id = ab.job_id AND ab.status = 'accepted'
       LEFT JOIN users pu ON ab.provider_id = pu.id
       WHERE j.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      throw new AppError('Job not found', 404);
    }

    // Get bid count
    const [bidCount] = await db.query('SELECT COUNT(*) as count FROM bids WHERE job_id = ?', [req.params.id]);

    const job = rows[0];
    job.bid_count = bidCount[0].count;

    res.json({ job });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM jobs WHERE id = ? AND customer_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) {
      throw new AppError('Job not found or unauthorized', 404);
    }
    if (rows[0].status !== 'open') {
      throw new AppError('Can only edit open jobs', 400);
    }

    const { title, description, category_id, budget, location_lat, location_lng, location_address, deadline } = req.body;

    await db.query(
      `UPDATE jobs SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category_id = COALESCE(?, category_id),
        budget = COALESCE(?, budget),
        location_lat = COALESCE(?, location_lat),
        location_lng = COALESCE(?, location_lng),
        location_address = COALESCE(?, location_address),
        deadline = COALESCE(?, deadline)
      WHERE id = ?`,
      [title, description, category_id, budget, location_lat, location_lng, location_address, deadline, req.params.id]
    );

    res.json({ message: 'Job updated' });
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM jobs WHERE id = ? AND customer_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) {
      throw new AppError('Job not found or unauthorized', 404);
    }
    if (!['open', 'assigned'].includes(rows[0].status)) {
      throw new AppError('Cannot cancel job in current status', 400);
    }

    await db.query('UPDATE jobs SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    res.json({ message: 'Job cancelled' });
  } catch (err) {
    next(err);
  }
};

exports.startWork = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT j.*, b.provider_id FROM jobs j
       JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
       WHERE j.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      throw new AppError('Job not found', 404);
    }
    if (rows[0].provider_id !== req.user.id) {
      throw new AppError('Only the assigned provider can start work', 403);
    }
    if (rows[0].status !== 'assigned') {
      throw new AppError('Job must be in assigned status to start work', 400);
    }

    await db.query('UPDATE jobs SET status = ? WHERE id = ?', ['in_progress', req.params.id]);
    res.json({ message: 'Work started' });
  } catch (err) {
    next(err);
  }
};

exports.markComplete = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT j.*, b.provider_id FROM jobs j
       JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
       WHERE j.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      throw new AppError('Job not found', 404);
    }
    const job = rows[0];
    if (job.provider_id !== req.user.id) {
      throw new AppError('Only the assigned provider can mark work as complete', 403);
    }
    if (!['assigned', 'in_progress'].includes(job.status)) {
      throw new AppError('Job must be assigned or in progress to mark complete', 400);
    }

    await db.query('UPDATE jobs SET provider_confirmed_at = NOW() WHERE id = ?', [req.params.id]);

    if (job.customer_confirmed_at) {
      // Both sides have confirmed — release escrow now
      await releaseEscrowForJob(req.params.id);
      await createNotification(job.customer_id, 'job_completed', 'Job completed', `"${job.title}" is complete and payment has been released.`, { job_id: req.params.id });
      return res.json({ message: 'Both parties confirmed — job completed and payment released', status: 'completed' });
    }

    await createNotification(job.customer_id, 'completion_pending', 'Provider marked job done', `The provider says "${job.title}" is complete. Please confirm to release payment.`, { job_id: req.params.id });
    res.json({ message: 'Marked done — waiting for customer to confirm completion', status: 'awaiting_customer' });
  } catch (err) {
    next(err);
  }
};

exports.getMyJobs = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    let where = 'WHERE j.customer_id = ?';
    const params = [req.user.id];

    if (status) {
      where += ' AND j.status = ?';
      params.push(status);
    }

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM jobs j ${where}`, params);
    const pag = paginate(
      `SELECT j.*, c.name as category_name,
              (SELECT COUNT(*) FROM bids WHERE job_id = j.id) as bid_count
       FROM jobs j LEFT JOIN categories c ON j.category_id = c.id ${where} ORDER BY j.created_at DESC`,
      { page, limit }
    );

    const [jobs] = await db.query(pag.query, [...params, ...pag.values]);

    res.json({
      jobs,
      pagination: paginationMeta(countResult[0].total, pag.page, pag.limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name');
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};
