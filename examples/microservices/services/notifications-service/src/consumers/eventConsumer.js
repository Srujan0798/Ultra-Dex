/**
 * @fileoverview EventConsumer module
 * @module consumers/eventConsumer
 */

const logger = require('../utils/logger');
const MockEmailProvider = require('../providers/mockEmailProvider');
const MockSMSProvider = require('../providers/mockSMSProvider');

const emailProvider = new MockEmailProvider();
const smsProvider = new MockSMSProvider();

const consumeEvents = async (channel, pool) => {
  try {
    // Create queues for different events
    const orderQueue = await channel.assertQueue('notifications-orders', { durable: true });
    const paymentQueue = await channel.assertQueue('notifications-payments', { durable: true });

    // Bind to exchanges
    await channel.bindQueue(orderQueue.queue, 'orders', 'order.created');
    await channel.bindQueue(orderQueue.queue, 'orders', 'order.status_changed');
    await channel.bindQueue(paymentQueue.queue, 'payments', 'payment.processed');
    await channel.bindQueue(paymentQueue.queue, 'payments', 'payment.failed');

    logger.info('Started consuming events for notifications');

    // Consume order events
    channel.consume(orderQueue.queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await handleOrderEvent(content, pool);
        channel.ack(msg);
      } catch (error) {
        logger.error('Error processing order message:', error);
        channel.nack(msg, false, true);
      }
    });

    // Consume payment events
    channel.consume(paymentQueue.queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await handlePaymentEvent(content, pool);
        channel.ack(msg);
      } catch (error) {
        logger.error('Error processing payment message:', error);
        channel.nack(msg, false, true);
      }
    });
  } catch (error) {
    logger.error('Failed to setup consumer:', error);
    throw error;
  }
};

const handleOrderEvent = async (content, pool) => {
  const { event, data } = content;

  logger.info({ message: `Handling order event: ${event}`, data });

  if (event === 'order.created') {
    // Get user preferences
    const prefResult = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [data.userId]
    );

    const preferences = prefResult.rows[0] || {};

    if (preferences.email_enabled !== false) {
      // Send order confirmation email
      await createNotification(pool, {
        userId: data.userId,
        type: 'email',
        channel: 'order',
        title: `Order #${data.orderId} Confirmation`,
        content: `Thank you for your order! Your order #${data.orderId} for ${data.totalAmount} ${data.currency} has been received.`,
        metadata: { orderId: data.orderId, amount: data.totalAmount },
      });
    }
  }

  if (event === 'order.status_changed') {
    await createNotification(pool, {
      userId: data.userId,
      type: 'email',
      channel: 'order',
      title: `Order #${data.orderId} Status Update`,
      content: `Your order #${data.orderId} status has been updated to: ${data.status}`,
      metadata: { orderId: data.orderId, status: data.status },
    });
  }
};

const handlePaymentEvent = async (content, pool) => {
  const { event, data } = content;

  logger.info({ message: `Handling payment event: ${event}`, data });

  if (event === 'payment.processed') {
    await createNotification(pool, {
      userId: data.userId,
      type: 'email',
      channel: 'payment',
      title: 'Payment Successful',
      content: `Your payment of ${data.amount} ${data.currency} has been processed successfully.`,
      metadata: { paymentId: data.paymentId, amount: data.amount },
    });
  }

  if (event === 'payment.failed') {
    await createNotification(pool, {
      userId: data.userId,
      type: 'email',
      channel: 'payment',
      title: 'Payment Failed',
      content: `We were unable to process your payment of ${data.amount} ${data.currency}. Reason: ${data.reason}. Please try again.`,
      metadata: { paymentId: data.paymentId, amount: data.amount, reason: data.reason },
    });
  }
};

const createNotification = async (pool, notificationData) => {
  const { userId, type, channel, title, content, metadata = {} } = notificationData;

  try {
    // Create notification record
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, channel, title, content, status, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, type, channel, title, content, 'sent', JSON.stringify(metadata)]
    );

    const notification = result.rows[0];

    // Send notification based on type
    if (type === 'email') {
      await emailProvider.send({
        to: userId, // In real implementation, fetch email from users service
        subject: title,
        body: content,
      });
    } else if (type === 'sms') {
      await smsProvider.send({
        to: userId,
        message: content,
      });
    }

    // Update as sent
    await pool.query('UPDATE notifications SET status = $1, sent_at = NOW() WHERE id = $2', [
      'sent',
      notification.id,
    ]);

    logger.info({ message: 'Notification sent', notificationId: notification.id });
  } catch (error) {
    logger.error('Failed to send notification:', error);
    throw error;
  }
};

module.exports = { consumeEvents };
