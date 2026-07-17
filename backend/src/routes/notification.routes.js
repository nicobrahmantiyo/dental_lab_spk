// backend/src/routes/notification.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/notificationController');
const auth   = require('../middlewares/auth');

router.get('/',              auth, ctrl.getMyNotifications);
router.get('/unread-count',  auth, ctrl.getUnreadCount);
router.put('/mark-all-read', auth, ctrl.markAllRead);
router.put('/:id/read',      auth, ctrl.markRead);

module.exports = router;