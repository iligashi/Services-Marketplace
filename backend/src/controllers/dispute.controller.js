const db = require('../config/db');
const { AppError } = require('../middleware/error.middleware');

exports.create = async (req, res, next) => {
  try {
    const { job_id, reason, evidence_urls } = req.body;

    // Verify job is in progress or completed
    const [jobs] = await db.query(
      "SELECT * FROM jobs WHERE id = ? AND status IN ('in_progress', 'completed')",
      [job_id]
    );

    if (jobs.length === 0) {
      throw new AppError('Job not found or not eligible for dispute', 404);
    }

    const job = jobs[0];
    const [bids] = await db.query(
      "SELECT provider_id FROM bids WHERE job_id = ? AND status = 'accepted'",
      [job_id]
    );
    const providerId = bids.length > 0 ? bids[0].provider_id : null;

    if (job.customer_id !== req.user.id && providerId !== req.user.id) {
      throw new AppError('You are not part of this job', 403);
    }

    // Check for existing open dispute
    const [existing] = await db.query(
      "SELECT id FROM disputes WHERE job_id = ? AND status = 'open'",
      [job_id]
    );
    if (existing.length > 0) {
      throw new AppError('An open dispute already exists for this job', 409);
    }

    const [result] = await db.query(
      'INSERT INTO disputes (job_id, raised_by, reason, evidence_urls) VALUES (?, ?, ?, ?)',
      [job_id, req.user.id, reason, JSON.stringify(evidence_urls || [])]
    );

    await db.query('UPDATE jobs SET status = ? WHERE id = ?', ['disputed', job_id]);
    await db.query(
      "UPDATE payments SET status = 'disputed' WHERE job_id = ? AND status = 'held'",
      [job_id]
    );

    res.status(201).json({ message: 'Dispute raised', dispute_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

exports.resolve = async (req, res, next) => {
  try {
    const { resolution, action } = req.body; // action: 'refund' or 'release'

    const [disputes] = await db.query('SELECT * FROM disputes WHERE id = ?', [req.params.id]);
    if (disputes.length === 0) {
      throw new AppError('Dispute not found', 404);
    }
    if (disputes[0].status !== 'open') {
      throw new AppError('Dispute already resolved', 400);
    }

    const dispute = disputes[0];

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        'UPDATE disputes SET status = ?, resolution = ?, admin_id = ? WHERE id = ?',
        ['resolved', resolution, req.user.id, dispute.id]
      );

      if (action === 'refund') {
        await conn.query(
          "UPDATE payments SET status = 'refunded' WHERE job_id = ? AND status = 'disputed'",
          [dispute.job_id]
        );
        await conn.query('UPDATE jobs SET status = ? WHERE id = ?', ['cancelled', dispute.job_id]);
      } else {
        await conn.query(
          "UPDATE payments SET status = 'released', released_at = NOW() WHERE job_id = ? AND status = 'disputed'",
          [dispute.job_id]
        );
        await conn.query('UPDATE jobs SET status = ? WHERE id = ?', ['completed', dispute.job_id]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    res.json({ message: `Dispute resolved with ${action}` });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = '';
    const params = [];

    if (status) {
      where = 'WHERE d.status = ?';
      params.push(status);
    }

    const [disputes] = await db.query(
      `SELECT d.*, j.title as job_title, u.name as raised_by_name,
              j.customer_id, j.status as job_status
       FROM disputes d
       JOIN jobs j ON d.job_id = j.id
       JOIN users u ON d.raised_by = u.id
       ${where}
       ORDER BY d.created_at DESC`,
      params
    );

    res.json({ disputes });
  } catch (err) {
    next(err);
  }
};
