const router = require('express').Router();
const disputes = require('../controllers/dispute.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createDisputeSchema, resolveDisputeSchema } = require('../validators/schemas');

router.post('/', authenticate, validate(createDisputeSchema), disputes.create);
router.get('/', authenticate, authorize('admin'), disputes.getAll);
router.patch('/:id/resolve', authenticate, authorize('admin'), validate(resolveDisputeSchema), disputes.resolve);

module.exports = router;
