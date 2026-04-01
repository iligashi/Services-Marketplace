const router = require('express').Router();
const bids = require('../controllers/bid.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createBidSchema } = require('../validators/schemas');

router.post('/', authenticate, authorize('provider'), validate(createBidSchema), bids.create);
router.get('/my', authenticate, authorize('provider'), bids.getMyBids);
router.get('/job/:jobId', authenticate, bids.getForJob);
router.patch('/:id/accept', authenticate, authorize('customer'), bids.accept);
router.patch('/:id/reject', authenticate, authorize('customer'), bids.reject);

module.exports = router;
