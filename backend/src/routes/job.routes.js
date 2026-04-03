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
// Accept both JSON and multipart/form-data (for photo uploads)
const optionalUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return upload.array('photos', 5)(req, res, next);
  }
  next();
};
router.post('/', authenticate, authorize('customer'), optionalUpload, validate(createJobSchema), jobs.create);
router.put('/:id', authenticate, authorize('customer'), validate(updateJobSchema), jobs.update);
router.patch('/:id/cancel', authenticate, authorize('customer'), jobs.cancel);
router.patch('/:id/start', authenticate, authorize('provider'), jobs.startWork);
router.patch('/:id/complete', authenticate, authorize('provider'), jobs.markComplete);

module.exports = router;
