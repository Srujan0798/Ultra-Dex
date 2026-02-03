const logger = require('../utils/logger');

class OrderController {
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

      this.channel.publish('orders', eventType, Buffer.from(message), {
        persistent: true,
        messageId: data.id || data.orderId,
        timestamp: Date.now()
      });

      logger.info({ message: `Published event: ${eventType}`, data });
    } catch (error) {
      logger.error(`Failed to publish event ${eventType}:`, error);
    }
  }

  async listOrders(req, res) {
    const { page = 1, limit = 10, status, userId } = req.query;
    const offset = (page - 1) * limit;

    try {
      let query = 'SELECT * FROM orders';
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

      // Get items for each order
      const orders = await Promise.all(
        result.rows.map(async (order) => {
          const itemsResult = await this.pool.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [order.id]
          );
          return { ...order, items: itemsResult.rows };
        })
      );

      res.json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('List orders error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOrder(req, res) {
    const { id } = req.params;

    try {
      const orderResult = await this.pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [id]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult.rows[0];

      // Get items
      const itemsResult = await this.pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [id]
      );

      // Get status history
      const historyResult = await this.pool.query(
        'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC',
        [id]
      );

      res.json({
        order: {
          ...order,
          items: itemsResult.rows,
          statusHistory: historyResult.rows
        }
      });
    } catch (error) {
      logger.error('Get order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createOrder(req, res) {
    const { items, shippingAddress, billingAddress, currency = 'USD', metadata = {} } = req.body;
    const userId = req.headers['x-user-id'] || req.user?.id;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    if (!shippingAddress || !billingAddress) {
      return res.status(400).json({ error: 'Shipping and billing addresses are required' });
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Calculate totals
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, currency, shipping_address, billing_address, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [userId, totalAmount, currency, JSON.stringify(shippingAddress), JSON.stringify(billingAddress), JSON.stringify(metadata)]
      );

      const order = orderResult.rows[0];

      // Create order items
      const orderItems = [];
      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [
            order.id,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.quantity * item.unitPrice
          ]
        );
        orderItems.push(itemResult.rows[0]);
      }

      // Add status history
      await client.query(
        'INSERT INTO order_status_history (order_id, status, notes) VALUES ($1, $2, $3)',
        [order.id, 'pending', 'Order created']
      );

      await client.query('COMMIT');

      // Publish event
      await this.publishEvent('order.created', {
        orderId: order.id,
        userId,
        totalAmount,
        currency,
        items: orderItems
      });

      logger.info({ message: 'Order created', orderId: order.id, userId });

      res.status(201).json({
        order: {
          ...order,
          items: orderItems
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Create order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  async updateOrder(req, res) {
    const { id } = req.params;
    const { shippingAddress, billingAddress, metadata } = req.body;

    try {
      const result = await this.pool.query(
        `UPDATE orders 
         SET shipping_address = COALESCE($1, shipping_address),
             billing_address = COALESCE($2, billing_address),
             metadata = COALESCE($3, metadata),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [
          shippingAddress ? JSON.stringify(shippingAddress) : null,
          billingAddress ? JSON.stringify(billingAddress) : null,
          metadata ? JSON.stringify(metadata) : null,
          id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = result.rows[0];

      // Publish event
      await this.publishEvent('order.updated', { orderId: id, updates: req.body });

      logger.info({ message: 'Order updated', orderId: id });

      res.json({ order });
    } catch (error) {
      logger.error('Update order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateStatus(req, res) {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Update order status
      const orderResult = await client.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }

      // Add status history
      await client.query(
        'INSERT INTO order_status_history (order_id, status, notes) VALUES ($1, $2, $3)',
        [id, status, notes || `Status changed to ${status}`]
      );

      await client.query('COMMIT');

      const order = orderResult.rows[0];

      // Publish event
      await this.publishEvent('order.status_changed', {
        orderId: id,
        status,
        notes
      });

      logger.info({ message: 'Order status updated', orderId: id, status });

      res.json({ order });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  async cancelOrder(req, res) {
    const { id } = req.params;
    const { reason } = req.body;

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if order can be cancelled
      const orderResult = await client.query(
        'SELECT status FROM orders WHERE id = $1',
        [id]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }

      const currentStatus = orderResult.rows[0].status;
      if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Cannot cancel order with status: ${currentStatus}` });
      }

      // Update order status to cancelled
      await client.query(
        "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        [id]
      );

      // Add status history
      await client.query(
        'INSERT INTO order_status_history (order_id, status, notes) VALUES ($1, $2, $3)',
        [id, 'cancelled', reason || 'Order cancelled']
      );

      await client.query('COMMIT');

      // Publish event
      await this.publishEvent('order.cancelled', {
        orderId: id,
        reason
      });

      logger.info({ message: 'Order cancelled', orderId: id });

      res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Cancel order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  async getUserOrders(req, res) {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
      const result = await this.pool.query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, parseInt(limit), parseInt(offset)]
      );

      res.json({
        orders: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get user orders error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = OrderController;
