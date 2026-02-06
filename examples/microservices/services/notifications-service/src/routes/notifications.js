const express = require('express');
const NotificationController = require('../controllers/notificationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

module.exports = (pool, redis) => {
  const notificationController = new NotificationController(pool, redis);

  // Admin routes
  router.post('/notifications', authenticateToken, requireRole('admin'), (req, res) =>
    notificationController.createNotification(req, res)
  );

  // User routes
  router.get('/notifications', authenticateToken, (req, res) =>
    notificationController.listNotifications(req, res)
  );

  router.get('/notifications/:id', authenticateToken, (req, res) =>
    notificationController.getNotification(req, res)
  );

  router.put('/notifications/:id/read', authenticateToken, (req, res) =>
    notificationController.markAsRead(req, res)
  );

  router.delete('/notifications/:id', authenticateToken, (req, res) =>
    notificationController.deleteNotification(req, res)
  );

  // Preferences routes
  router.get('/notifications/preferences', authenticateToken, (req, res) =>
    notificationController.getPreferences(req, res)
  );

  router.put('/notifications/preferences', authenticateToken, (req, res) =>
    notificationController.updatePreferences(req, res)
  );

  router.get('/notifications/unread-count', authenticateToken, (req, res) =>
    notificationController.getUnreadCount(req, res)
  );

  return router;
};
