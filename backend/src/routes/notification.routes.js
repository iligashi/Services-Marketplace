const router = require('express').Router();
const authenticate = require('../middleware/auth.middleware');
const { getNotifications, markAsRead } = require('../services/notification.service');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await getNotifications(req.user.id, unreadOnly);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.patch('/read', authenticate, async (req, res, next) => {
  try {
    await markAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await markAsRead(req.user.id, req.params.id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
