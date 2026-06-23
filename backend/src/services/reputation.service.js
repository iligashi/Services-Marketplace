const config = require('../config/env');

// Lower platform fee for trusted, high-performing providers
function getFeeRate(profile) {
  if (!profile) return config.stripe.platformFeePercent;

  const rating = parseFloat(profile.avg_rating) || 0;
  const jobsDone = profile.total_jobs_done || 0;
  const verified = !!profile.id_verified;

  if (verified && rating >= 4.8 && jobsDone >= 20) return 8;
  if (verified && rating >= 4.5 && jobsDone >= 10) return 10;
  if (verified) return 11;
  return config.stripe.platformFeePercent;
}

// Badge tier shown on provider profiles / bid cards
function getBadge(profile) {
  if (!profile) return null;

  const rating = parseFloat(profile.avg_rating) || 0;
  const jobsDone = profile.total_jobs_done || 0;
  const verified = !!profile.id_verified;

  if (verified && rating >= 4.8 && jobsDone >= 20) {
    return { tier: 'elite_pro', label: 'Elite Pro' };
  }
  if (rating >= 4.5 && jobsDone >= 10) {
    return { tier: 'top_rated', label: 'Top Rated' };
  }
  if (verified) {
    return { tier: 'verified', label: 'Verified' };
  }
  return null;
}

module.exports = { getFeeRate, getBadge };
