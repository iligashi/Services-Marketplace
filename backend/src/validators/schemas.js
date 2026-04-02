const Joi = require('joi');

exports.registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().max(20).allow('', null),
  role: Joi.string().valid('customer', 'provider').default('customer'),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().required(),
});

exports.updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().max(20).allow('', null),
  bio: Joi.string().max(2000).allow('', null),
  skills: Joi.array().items(Joi.string()),
  years_experience: Joi.number().integer().min(0).max(99).allow(null),
  service_radius_km: Joi.number().integer().min(1).max(500).allow(null),
  location_lat: Joi.number().min(-90).max(90).allow(null),
  location_lng: Joi.number().min(-180).max(180).allow(null),
  location_address: Joi.string().max(500).allow('', null),
});

exports.createJobSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(10).max(5000).required(),
  category_id: Joi.number().integer().positive().allow(null),
  budget: Joi.number().positive().max(999999).allow(null),
  location_lat: Joi.number().min(-90).max(90).allow(null),
  location_lng: Joi.number().min(-180).max(180).allow(null),
  location_address: Joi.string().max(500).allow('', null),
  deadline: Joi.date().iso().allow(null),
});

exports.updateJobSchema = Joi.object({
  title: Joi.string().min(5).max(255),
  description: Joi.string().min(10).max(5000),
  category_id: Joi.number().integer().positive().allow(null),
  budget: Joi.number().positive().max(999999).allow(null),
  location_lat: Joi.number().min(-90).max(90).allow(null),
  location_lng: Joi.number().min(-180).max(180).allow(null),
  location_address: Joi.string().max(500).allow('', null),
  deadline: Joi.date().iso().allow(null),
});

exports.createBidSchema = Joi.object({
  job_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().max(999999).required(),
  message: Joi.string().max(2000).allow('', null),
  estimated_hours: Joi.number().integer().positive().max(9999).allow(null),
});

exports.createReviewSchema = Joi.object({
  job_id: Joi.number().integer().positive().required(),
  reviewee_id: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(2000).allow('', null),
});

exports.createDisputeSchema = Joi.object({
  job_id: Joi.number().integer().positive().required(),
  reason: Joi.string().min(10).max(5000).required(),
  evidence_urls: Joi.array().items(Joi.string().uri()),
});

exports.resolveDisputeSchema = Joi.object({
  resolution: Joi.string().min(5).max(5000).required(),
  action: Joi.string().valid('refund', 'release').required(),
});

exports.sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
});
