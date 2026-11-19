const db = require('../config/db');
const stripe = require('../config/stripe');
const config = require('../config/env');
const { AppError } = require('../middleware/error.middleware');
const { getFeeRate } = require('../services/reputation.service');
const { releaseEscrowForJob } = require('../services/escrow.service');
const { createNotification } = require('../services/notification.service');

// Idempotent: repeating the request (double tap, network retry) returns the
// same PaymentIntent instead of creating a second charge. One payment row per
// job is enforced by a unique key on payments.job_id.
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const jobId = Number(req.body.job_id);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      throw new AppError('job_id is required', 400);
    }
    if (!stripe) {
      throw new AppError('Payment service not configured', 503);
    }

    const [jobs] = await db.query(
      `SELECT j.*, b.id as bid_id, b.amount as bid_amount, b.provider_id
       FROM jobs j
       JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
       WHERE j.id = ? AND j.customer_id = ? AND j.status IN ('assigned', 'in_progress')`,
      [jobId, req.user.id]
    );
    if (jobs.length === 0) {
      throw new AppError('No assigned job with accepted bid found', 404);
    }
    const job = jobs[0];

    const [existingRows] = await db.query('SELECT * FROM payments WHERE job_id = ?', [job.id]);
    const existing = existingRows[0];

    if (existing && existing.status !== 'failed') {
      if (existing.status !== 'pending') {
        throw new AppError('This job has already been paid', 409);
      }
      // Replay: hand back the PaymentIntent that already exists
      const intent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
      return res.json(paymentResponse(intent.client_secret, existing));
    }

    if (job.status !== 'assigned') {
      throw new AppError('Job is not awaiting payment', 409);
    }

    const [providerProfiles] = await db.query(
      'SELECT avg_rating, total_jobs_done, id_verified FROM provider_profiles WHERE user_id = ?',
      [job.provider_id]
    );
    const feeRate = getFeeRate(providerProfiles[0]);

    const amount = Math.round(Number(job.bid_amount) * 100); // cents
    const platformFee = Math.round(amount * (feeRate / 100));
    const providerPayout = amount - platformFee;

    // Same key for every retry of this attempt; a new key only after a failed attempt
    const idempotencyKey = `job-${job.id}-payment-${existing ? existing.stripe_payment_intent_id : 'initial'}`;
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'usd',
        metadata: {
          job_id: job.id.toString(),
          provider_id: job.provider_id.toString(),
          customer_id: req.user.id.toString(),
        },
        capture_method: 'manual', // Hold funds, don't capture yet
      },
      { idempotencyKey }
    );

    const conn = await db.getConnection();
    let payment;
    try {
      await conn.beginTransaction();
      if (existing) {
        await conn.query(
          `UPDATE payments SET amount = ?, platform_fee = ?, provider_payout = ?, stripe_payment_intent_id = ?, status = 'pending'
           WHERE id = ? AND status = 'failed'`,
          [job.bid_amount, platformFee / 100, providerPayout / 100, paymentIntent.id, existing.id]
        );
      } else {
        // A concurrent request may have inserted the row already: the unique
        // key turns that into a no-op instead of a duplicate payment
        await conn.query(
          `INSERT INTO payments (job_id, customer_id, provider_id, amount, platform_fee, provider_payout, stripe_payment_intent_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
           ON DUPLICATE KEY UPDATE id = id`,
          [job.id, req.user.id, job.provider_id, job.bid_amount, platformFee / 100, providerPayout / 100, paymentIntent.id]
        );
      }
      await conn.query("UPDATE jobs SET status = 'in_progress' WHERE id = ? AND status = 'assigned'", [job.id]);
      const [rows] = await conn.query('SELECT * FROM payments WHERE job_id = ?', [job.id]);
      payment = rows[0];
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    if (payment.stripe_payment_intent_id !== paymentIntent.id) {
      // Lost a race with a parallel request: return the winner's intent
      const winner = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
      return res.json(paymentResponse(winner.client_secret, payment, feeRate));
    }
    res.json(paymentResponse(paymentIntent.client_secret, payment, feeRate));
  } catch (err) {
    next(err);
  }
};

function paymentResponse(clientSecret, payment, feeRate) {
  const amount = Number(payment.amount);
  const fee = Number(payment.platform_fee);
  return {
    clientSecret,
    amount,
    platform_fee: fee,
    platform_fee_rate: feeRate ?? (amount > 0 ? Math.round((fee / amount) * 10000) / 100 : 0),
    provider_payout: Number(payment.provider_payout),
  };
}

exports.confirmCompletion = async (req, res, next) => {
  try {
    const job_id = Number(req.body.job_id);
    if (!Number.isInteger(job_id) || job_id <= 0) {
      throw new AppError('job_id is required', 400);
    }

    // Get job and verify ownership
    const [jobs] = await db.query(
      `SELECT j.*, b.provider_id
       FROM jobs j
       LEFT JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
       WHERE j.id = ? AND j.customer_id = ?`,
      [job_id, req.user.id]
    );

    if (jobs.length === 0) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    const job = jobs[0];
    if (!['assigned', 'in_progress'].includes(job.status)) {
      throw new AppError('Job must be assigned or in progress to complete', 400);
    }

    await db.query('UPDATE jobs SET customer_confirmed_at = NOW() WHERE id = ?', [job_id]);

    if (job.provider_confirmed_at) {
      // Both sides have confirmed — release escrow now
      await releaseEscrowForJob(job_id);
      if (job.provider_id) {
        await createNotification(job.provider_id, 'job_completed', 'Job completed', `Payment for "${job.title}" has been released.`, { job_id });
      }
      return res.json({ message: 'Both parties confirmed — job completed and payment released', status: 'completed' });
    }

    if (job.provider_id) {
      await createNotification(job.provider_id, 'completion_pending', 'Customer confirmed completion', `The customer confirmed "${job.title}" is done. Confirm on your end to release payment.`, { job_id });
    }
    res.json({ message: 'Confirmed — waiting for provider to confirm completion', status: 'awaiting_provider' });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, j.title as job_title
       FROM payments p
       JOIN jobs j ON p.job_id = j.id
       WHERE p.customer_id = ? OR p.provider_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id, req.user.id]
    );

    res.json({ payments });
  } catch (err) {
    next(err);
  }
};

exports.stripeWebhook = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Every update is conditional on the current state, so Stripe's retried
    // or out-of-order deliveries cannot move a payment backwards.
    const pi = event.data.object;
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated':
        // Funds are authorised and held on the customer's card
        await db.query(
          "UPDATE payments SET status = 'held', held_at = NOW() WHERE stripe_payment_intent_id = ? AND status = 'pending'",
          [pi.id]
        );
        break;
      case 'payment_intent.payment_failed':
        await db.query(
          "UPDATE payments SET status = 'failed' WHERE stripe_payment_intent_id = ? AND status = 'pending'",
          [pi.id]
        );
        break;
      case 'payment_intent.canceled':
        await db.query(
          "UPDATE payments SET status = 'refunded' WHERE stripe_payment_intent_id = ? AND status IN ('pending', 'held')",
          [pi.id]
        );
        break;
      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
