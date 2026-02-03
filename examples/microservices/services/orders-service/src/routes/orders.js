const express = require('express');
const OrderController = require('../controllers/orderController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

module.exports = (pool, redis, channel) => {
  const orderController = new OrderController(pool, redis, channel);

  // Admin routes
  router.get('/orders', authenticateToken, requireRole('admin'), (req, res) => 
    orderController.listOrders(req, res)
  );

  // Order routes
  router.get('/orders/:id', authenticateToken, (req, res) => 
    orderController.getOrder(req, res)
  );

  router.post('/orders', authenticateToken, (req, res) => 
    orderController.createOrder(req, res)
  );

  router.put('/orders/:id', authenticateToken, (req, res) => 
    orderController.updateOrder(req, res)
  );

  router.put('/orders/:id/status', authenticateToken, requireRole('admin'), (req, res) => 
    orderController.updateStatus(req, res)
  );

  router.delete('/orders/:id', authenticateToken, (req, res) => 
    orderController.cancelOrder(req, res)
  );

  // User orders
  router.get('/users/:userId/orders', authenticateToken, (req, res) => 
    orderController.getUserOrders(req, res)
  );

  return router;
};
