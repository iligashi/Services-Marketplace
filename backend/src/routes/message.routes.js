const router = require('express').Router();
const messages = require('../controllers/message.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { sendMessageSchema } = require('../validators/schemas');

router.get('/unread', authenticate, messages.getUnreadCount);
router.get('/:jobId', authenticate, messages.getMessages);
router.post('/:jobId', authenticate, validate(sendMessageSchema), messages.send);

module.exports = router;
