const express = require('express');
const notificationsRepo = require('../repositories/notificationsRepo');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../lib/asyncHandler');
const { HttpError } = require('../lib/httpError');

const router = express.Router();
router.use(authMiddleware);

/** GET /api/notifications */
router.get('/', asyncHandler(async (req, res) => {
  const [notifications, unread] = await Promise.all([
    notificationsRepo.listForUser(req.userId, 50),
    notificationsRepo.unreadCount(req.userId),
  ]);
  res.json({ notifications, unread });
}));

/** POST /api/notifications/read-all */
router.post('/read-all', asyncHandler(async (req, res) => {
  await notificationsRepo.markAllRead(req.userId);
  res.json({ unread: 0 });
}));

/** POST /api/notifications/:id/read */
router.post('/:id/read', asyncHandler(async (req, res) => {
  if (!(await notificationsRepo.markRead(req.userId, req.params.id))) {
    throw new HttpError(404, 'Bildirishnoma topilmadi');
  }
  res.json({ unread: await notificationsRepo.unreadCount(req.userId) });
}));

module.exports = router;
