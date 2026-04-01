const router = require('express').Router();
const payments = require('../controllers/payment.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.post('/create-intent', authenticate, authorize('customer'), payments.createPaymentIntent);
router.post('/confirm-completion', authenticate, authorize('customer'), payments.confirmCompletion);
router.get('/history', authenticate, payments.getPaymentHistory);

module.exports = router;
