const Joi = require('joi');

exports.registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().max(20).allow('', null),
  role: Joi.string().valid('customer', 'provider').default('customer'),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

exports.updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().max(20).allow('', null),
  bio: Joi.string().max(2000),
  skills: Joi.array().items(Joi.string()),
  years_experience: Joi.number().integer().min(0).max(99),
  service_radius_km: Joi.number().integer().min(1).max(500),
  location_lat: Joi.number().min(-90).max(90),
  location_lng: Joi.number().min(-180).max(180),
  location_address: Joi.string().max(500),
});

exports.createJobSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(10).max(5000).required(),
  category_id: Joi.number().integer().positive(),
  budget: Joi.number().positive().max(999999),
  location_lat: Joi.number().min(-90).max(90),
  location_lng: Joi.number().min(-180).max(180),
  location_address: Joi.string().max(500),
  deadline: Joi.date().iso().greater('now'),
});

exports.updateJobSchema = Joi.object({
  title: Joi.string().min(5).max(255),
  description: Joi.string().min(10).max(5000),
  category_id: Joi.number().integer().positive(),
  budget: Joi.number().positive().max(999999),
  location_lat: Joi.number().min(-90).max(90),
  location_lng: Joi.number().min(-180).max(180),
  location_address: Joi.string().max(500),
  deadline: Joi.date().iso(),
});

exports.createBidSchema = Joi.object({
  job_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().max(999999).required(),
  message: Joi.string().max(2000),
  estimated_hours: Joi.number().integer().positive().max(9999),
});

exports.createReviewSchema = Joi.object({
  job_id: Joi.number().integer().positive().required(),
  reviewee_id: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(2000),
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
