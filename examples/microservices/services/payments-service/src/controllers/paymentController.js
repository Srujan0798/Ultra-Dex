const logger = require('../utils/logger');
const MockPaymentGateway = require('../gateways/mockPaymentGateway');

const paymentGateway = new MockPaymentGateway();

class PaymentController {
  constructor(pool, redis, channel) {
    this.pool = pool;
    this.redis = redis;
    this.channel = channel;
  }

  async publishEvent(eventType, data) {
    if (!this.channel) {
      logger.warn('RabbitMQ channel not available');
      return;
    }

    try {
      const message = JSON.stringify({
        event: eventType,
        data,
        timestamp: new Date().toISOString()
      });

      this.channel.publish('payments', eventType, Buffer.from(message), {
        persistent: true,
        messageId: data.id || data.paymentId,
        timestamp: Date.now()
      });

      logger.info({ message: `Published event: ${eventType}`, data });
    } catch (error) {
      logger.error(`Failed to publish event ${eventType}:`, error);
    }
  }

  async listPayments(req, res) {
    const { page = 1, limit = 10, status, userId } = req.query;
    const offset = (page - 1) * limit;

    try {
      let query = 'SELECT * FROM payments';
      let params = [];
      let conditions = [];

      if (status) {
        conditions.push(`status = $${conditions.length + 1}`);
        params.push(status);
      }

      if (userId) {
        conditions.push(`user_id = $${conditions.length + 1}`);
        params.push(userId);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY created_at DESC LIMIT $${conditions.length + 1} OFFSET $${conditions.length + 2}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await this.pool.query(query, params);

      res.json({
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('List payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPayment(req, res) {
    const { id } = req.params;

    try {
      const result = await this.pool.query(
        'SELECT * FROM payments WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Get refunds if any
      const refundsResult = await this.pool.query(
        'SELECT * FROM refunds WHERE payment_id = $1',
        [id]
      );

      res.json({
        payment: {
          ...result.rows[0],
          refunds: refundsResult.rows
        }
      });
    } catch (error) {
      logger.error('Get payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async processPayment(req, res) {
    const { orderId, amount, currency = 'USD', paymentMethod = 'credit_card' } = req.body;
    const userId = req.headers['x-user-id'] || req.user?.id;

    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Order ID and amount are required' });
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create payment record
      const paymentResult = await client.query(
        `INSERT INTO payments (order_id, user_id, amount, currency, status, payment_method) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [orderId, userId, amount, currency, 'processing', paymentMethod]
      );

      const payment = paymentResult.rows[0];

      // Process through gateway
      const gatewayResult = await paymentGateway.processPayment({
        amount,
        currency,
        paymentMethod
      });

      if (gatewayResult.success) {
        // Update as completed
        const updatedResult = await client.query(
          `UPDATE payments 
           SET status = $1, transaction_id = $2, gateway_response = $3, updated_at = NOW() 
           WHERE id = $4
           RETURNING *`,
          ['completed', gatewayResult.transactionId, JSON.stringify(gatewayResult.gatewayResponse), payment.id]
        );

        await client.query('COMMIT');

        // Publish event
        await this.publishEvent('payment.processed', {
          paymentId: payment.id,
          orderId,
          userId,
          amount,
          currency,
          transactionId: gatewayResult.transactionId
        });

        logger.info({ message: 'Payment processed successfully', paymentId: payment.id });

        res.status(201).json({ payment: updatedResult.rows[0] });
      } else {
        // Update as failed
        const updatedResult = await client.query(
          `UPDATE payments 
           SET status = $1, failure_reason = $2, updated_at = NOW() 
           WHERE id = $3
           RETURNING *`,
          ['failed', gatewayResult.error, payment.id]
        );

        await client.query('COMMIT');

        // Publish event
        await this.publishEvent('payment.failed', {
          paymentId: payment.id,
          orderId,
          userId,
          amount,
          currency,
          reason: gatewayResult.error
        });

        logger.warn({ message: 'Payment failed', paymentId: payment.id, error: gatewayResult.error });

        res.status(402).json({
          error: 'Payment failed',
          payment: updatedResult.rows[0]
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Process payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  async processRefund(req, res) {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get payment
      const paymentResult = await client.query(
        'SELECT * FROM payments WHERE id = $1',
        [id]
      );

      if (paymentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Payment not found' });
      }

      const payment = paymentResult.rows[0];

      if (payment.status !== 'completed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Can only refund completed payments' });
      }

      // Check total refunds
      const refundsResult = await client.query(
        'SELECT COALESCE(SUM(amount), 0) as total_refunded FROM refunds WHERE payment_id = $1 AND status = $2',
        [id, 'completed']
      );

      const totalRefunded = parseFloat(refundsResult.rows[0].total_refunded);
      const availableForRefund = parseFloat(payment.amount) - totalRefunded;

      if (amount > availableForRefund) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Refund amount exceeds available amount',
          availableForRefund
        });
      }

      // Create refund record
      const refundResult = await client.query(
        `INSERT INTO refunds (payment_id, amount, reason, status) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [id, amount, reason, 'processing']
      );

      const refund = refundResult.rows[0];

      // Process through gateway
      const gatewayResult = await paymentGateway.processRefund({
        amount,
        paymentId: id
      });

      if (gatewayResult.success) {
        // Update refund as completed
        const updatedRefund = await client.query(
          `UPDATE refunds 
           SET status = $1, updated_at = NOW() 
           WHERE id = $2
           RETURNING *`,
          ['completed', refund.id]
        );

        await client.query('COMMIT');

        // Publish event
        await this.publishEvent('refund.processed', {
          refundId: refund.id,
          paymentId: id,
          orderId: payment.order_id,
          userId: payment.user_id,
          amount
        });

        logger.info({ message: 'Refund processed successfully', refundId: refund.id });

        res.status(201).json({ refund: updatedRefund.rows[0] });
      } else {
        // Update refund as failed
        const updatedRefund = await client.query(
          `UPDATE refunds 
           SET status = $1, updated_at = NOW() 
           WHERE id = $2
           RETURNING *`,
          ['failed', refund.id]
        );

        await client.query('COMMIT');

        logger.warn({ message: 'Refund failed', refundId: refund.id });

        res.status(500).json({
          error: 'Refund failed',
          refund: updatedRefund.rows[0]
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Process refund error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  async listPaymentMethods(req, res) {
    const userId = req.headers['x-user-id'] || req.user?.id;

    try {
      const result = await this.pool.query(
        'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [userId]
      );

      res.json({ paymentMethods: result.rows });
    } catch (error) {
      logger.error('List payment methods error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addPaymentMethod(req, res) {
    const { type, lastFour, expiryMonth, expiryYear, isDefault = false } = req.body;
    const userId = req.headers['x-user-id'] || req.user?.id;

    // Validate payment method
    const validation = await paymentGateway.validatePaymentMethod({
      type,
      lastFour,
      expiryMonth,
      expiryYear
    });

    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid payment method', details: validation.errors });
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // If setting as default, unset other defaults
      if (isDefault) {
        await client.query(
          'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      // Add new payment method
      const result = await client.query(
        `INSERT INTO payment_methods (user_id, type, last_four, expiry_month, expiry_year, is_default) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [userId, type, lastFour, expiryMonth, expiryYear, isDefault]
      );

      await client.query('COMMIT');

      logger.info({ message: 'Payment method added', userId });

      res.status(201).json({ paymentMethod: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Add payment method error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  async removePaymentMethod(req, res) {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.user?.id;

    try {
      const result = await this.pool.query(
        'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment method not found' });
      }

      logger.info({ message: 'Payment method removed', userId, methodId: id });

      res.json({ message: 'Payment method removed successfully' });
    } catch (error) {
      logger.error('Remove payment method error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOrderPayments(req, res) {
    const { orderId } = req.params;

    try {
      const result = await this.pool.query(
        'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
        [orderId]
      );

      res.json({ payments: result.rows });
    } catch (error) {
      logger.error('Get order payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = PaymentController;
