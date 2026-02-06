const logger = require('../utils/logger');
const MockPaymentGateway = require('../gateways/mockPaymentGateway');

const paymentGateway = new MockPaymentGateway();

const consumeOrderEvents = async (channel, pool) => {
  try {
    // Create queue and bind to orders exchange
    const queue = await channel.assertQueue('payments-service-orders', { durable: true });
    await channel.bindQueue(queue.queue, 'orders', 'order.created');

    logger.info('Started consuming order events');

    channel.consume(queue.queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        const { event, data } = content;

        logger.info({ message: `Received event: ${event}`, data });

        if (event === 'order.created') {
          await handleOrderCreated(data, pool, channel);
        }

        // Acknowledge message
        channel.ack(msg);
      } catch (error) {
        logger.error('Error processing message:', error);
        // Reject and requeue message
        channel.nack(msg, false, true);
      }
    });
  } catch (error) {
    logger.error('Failed to setup consumer:', error);
    throw error;
  }
};

const handleOrderCreated = async (data, pool, channel) => {
  const { orderId, userId, totalAmount, currency } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create pending payment record
    const result = await client.query(
      `INSERT INTO payments (order_id, user_id, amount, currency, status, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [orderId, userId, totalAmount, currency, 'pending', 'credit_card']
    );

    const payment = result.rows[0];

    // Process payment through gateway
    const gatewayResult = await paymentGateway.processPayment({
      amount: totalAmount,
      currency,
      paymentMethod: 'credit_card',
    });

    if (gatewayResult.success) {
      // Update payment as completed
      await client.query(
        `UPDATE payments 
         SET status = $1, transaction_id = $2, gateway_response = $3, updated_at = NOW() 
         WHERE id = $4`,
        [
          'completed',
          gatewayResult.transactionId,
          JSON.stringify(gatewayResult.gatewayResponse),
          payment.id,
        ]
      );

      // Publish payment processed event
      const message = JSON.stringify({
        event: 'payment.processed',
        data: {
          paymentId: payment.id,
          orderId,
          userId,
          amount: totalAmount,
          currency,
          transactionId: gatewayResult.transactionId,
        },
        timestamp: new Date().toISOString(),
      });

      channel.publish('payments', 'payment.processed', Buffer.from(message), {
        persistent: true,
      });

      logger.info({ message: 'Payment processed successfully', paymentId: payment.id });
    } else {
      // Update payment as failed
      await client.query(
        `UPDATE payments 
         SET status = $1, failure_reason = $2, updated_at = NOW() 
         WHERE id = $3`,
        ['failed', gatewayResult.error, payment.id]
      );

      // Publish payment failed event
      const message = JSON.stringify({
        event: 'payment.failed',
        data: {
          paymentId: payment.id,
          orderId,
          userId,
          amount: totalAmount,
          currency,
          reason: gatewayResult.error,
        },
        timestamp: new Date().toISOString(),
      });

      channel.publish('payments', 'payment.failed', Buffer.from(message), {
        persistent: true,
      });

      logger.warn({ message: 'Payment failed', paymentId: payment.id, error: gatewayResult.error });
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error handling order created event:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { consumeOrderEvents };
