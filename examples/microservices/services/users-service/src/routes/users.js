const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

module.exports = (pool, redis) => {
  const userController = new UserController(pool, redis);

  // Admin routes
  router.get('/users', authenticateToken, requireRole('admin'), (req, res) =>
    userController.listUsers(req, res)
  );

  // User routes (admin can access any, users can access their own)
  router.get('/users/:id', authenticateToken, (req, res) => userController.getUser(req, res));

  router.get('/users/by-userid/:userId', authenticateToken, (req, res) =>
    userController.getUserByUserId(req, res)
  );

  router.post('/users', authenticateToken, (req, res) => userController.createUser(req, res));

  router.put('/users/:id', authenticateToken, (req, res) => userController.updateUser(req, res));

  router.delete('/users/:id', authenticateToken, (req, res) => userController.deleteUser(req, res));

  // Settings routes
  router.get('/users/:userId/settings', authenticateToken, (req, res) =>
    userController.getSettings(req, res)
  );

  router.put('/users/:userId/settings', authenticateToken, (req, res) =>
    userController.updateSettings(req, res)
  );

  return router;
};
