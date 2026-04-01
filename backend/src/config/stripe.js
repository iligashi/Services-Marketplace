const Stripe = require('stripe');
const config = require('./env');

const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey)
  : null;

module.exports = stripe;
