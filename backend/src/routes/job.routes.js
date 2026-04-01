const router = require('express').Router();
const jobs = require('../controllers/job.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { createJobSchema, updateJobSchema } = require('../validators/schemas');

router.get('/categories', jobs.getCategories);
router.get('/', jobs.getAll);
router.get('/my', authenticate, authorize('customer'), jobs.getMyJobs);
router.get('/:id', jobs.getById);
router.post('/', authenticate, authorize('customer'), upload.array('photos', 5), validate(createJobSchema), jobs.create);
router.put('/:id', authenticate, authorize('customer'), validate(updateJobSchema), jobs.update);
router.patch('/:id/cancel', authenticate, authorize('customer'), jobs.cancel);

module.exports = router;
