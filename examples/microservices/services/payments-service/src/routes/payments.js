/**
 * @fileoverview Payments module
 * @module routes/payments
 */

const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

module.exports = (pool, redis, channel) => {
  const paymentController = new PaymentController(pool, redis, channel);

  // Admin routes
  router.get('/payments', authenticateToken, requireRole('admin'), (req, res) =>
    paymentController.listPayments(req, res)
  );

  // Payment routes
  router.get('/payments/:id', authenticateToken, (req, res) =>
    paymentController.getPayment(req, res)
  );

  router.post('/payments', authenticateToken, (req, res) =>
    paymentController.processPayment(req, res)
  );

  router.post('/payments/:id/refund', authenticateToken, requireRole('admin'), (req, res) =>
    paymentController.processRefund(req, res)
  );

  // Payment methods routes
  router.get('/payments/methods', authenticateToken, (req, res) =>
    paymentController.listPaymentMethods(req, res)
  );

  router.post('/payments/methods', authenticateToken, (req, res) =>
    paymentController.addPaymentMethod(req, res)
  );

  router.delete('/payments/methods/:id', authenticateToken, (req, res) =>
    paymentController.removePaymentMethod(req, res)
  );

  // Order payments
  router.get('/orders/:orderId/payments', authenticateToken, (req, res) =>
    paymentController.getOrderPayments(req, res)
  );

  return router;
};

/**
 * Error handler for payments
 * @param {Error} error - Error to handle
 */
function handlePaymentsError(error) {
  try {
    console.error('[payments]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
