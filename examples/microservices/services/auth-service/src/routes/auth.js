const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

module.exports = (pool, redis) => {
  const authController = new AuthController(pool, redis);

  // Public routes
  router.post('/register', (req, res) => authController.register(req, res));
  router.post('/login', (req, res) => authController.login(req, res));
  router.post('/refresh', (req, res) => authController.refresh(req, res));
  router.post('/validate', (req, res) => authController.validate(req, res));

  // Protected routes
  router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));
  router.get('/me', authenticateToken, (req, res) => authController.me(req, res));
  router.post('/change-password', authenticateToken, (req, res) => authController.changePassword(req, res));

  return router;
};
