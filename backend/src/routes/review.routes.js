const router = require('express').Router();
const reviews = require('../controllers/review.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createReviewSchema } = require('../validators/schemas');

router.post('/', authenticate, validate(createReviewSchema), reviews.create);
router.get('/user/:userId', reviews.getForUser);

module.exports = router;
