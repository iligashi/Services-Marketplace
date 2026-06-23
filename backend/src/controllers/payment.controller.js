const db = require('../config/db');
const stripe = require('../config/stripe');
const config = require('../config/env');
const { AppError } = require('../middleware/error.middleware');
const { getFeeRate } = require('../services/reputation.service');
const { releaseEscrowForJob } = require('../services/escrow.service');
const { createNotification } = require('../services/notification.service');

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { job_id } = req.body;

    // Get job with accepted bid
    const [jobs] = await db.query(
      `SELECT j.*, b.id as bid_id, b.amount as bid_amount, b.provider_id
       FROM jobs j
       JOIN bids b ON j.id = b.job_id AND b.status = 'accepted'
       WHERE j.id = ? AND j.customer_id = ? AND j.status = 'assigned'`,
      [job_id, req.user.id]
    );

    if (jobs.length === 0) {
      throw new AppError('No assigned job with accepted bid found', 404);
    }

    const job = jobs[0];

    const [providerProfiles] = await db.query(
      'SELECT avg_rating, total_jobs_done, id_verified FROM provider_profiles WHERE user_id = ?',
      [job.provider_id]
    );
    const feeRate = getFeeRate(providerProfiles[0]);

    const amount = Math.round(job.bid_amount * 100); // cents
    const platformFee = Math.round(amount * (feeRate / 100));
    const providerPayout = amount - platformFee;

    if (!stripe) {
      throw new AppError('Payment service not configured', 503);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        job_id: job.id.toString(),
        provider_id: job.provider_id.toString(),
        customer_id: req.user.id.toString(),
      },
      capture_method: 'manual', // Hold funds, don't capture yet
    });

    // Record payment
    await db.query(
      `INSERT INTO payments (job_id, customer_id, provider_id, amount, platform_fee, provider_payout, stripe_payment_intent_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'held')`,
      [job.id, req.user.id, job.provider_id, job.bid_amount, platformFee / 100, providerPayout / 100, paymentIntent.id]
    );

    // Update job status
    await db.query('UPDATE jobs SET status = ? WHERE id = ?', ['in_progress', job.id]);

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: job.bid_amount,
      platform_fee: platformFee / 100,
      platform_fee_rate: feeRate,
      provider_payout: providerPayout / 100,
    });
  } catch (err) {
    next(err);
  }
};

exports.confirmCompletion = async (req, res, next) => {
  try {
    const { job_id } = req.body;

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

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment confirmed
        break;
      case 'payment_intent.payment_failed':
        const pi = event.data.object;
        await db.query(
          'UPDATE payments SET status = ? WHERE stripe_payment_intent_id = ?',
          ['refunded', pi.id]
        );
        break;
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
