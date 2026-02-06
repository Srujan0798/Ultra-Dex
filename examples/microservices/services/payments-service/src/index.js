const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const Redis = require('ioredis');
const amqp = require('amqplib');
require('dotenv').config();

const logger = require('./utils/logger');
const { registerService } = require('./utils/serviceDiscovery');
const paymentRoutes = require('./routes/payments');
const { errorHandler } = require('./middleware/errorHandler');
const { consumeOrderEvents } = require('./consumers/orderConsumer');

const app = express();
const PORT = process.env.PORT || 3004;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5435,
  database: process.env.DB_NAME || 'payments_db',
  user: process.env.DB_USER || 'payments_user',
  password: process.env.DB_PASSWORD || 'payments_pass123',
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// RabbitMQ connection
let channel;
let connection;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange('orders', 'topic', { durable: true });
    await channel.assertExchange('payments', 'topic', { durable: true });

    logger.info('Connected to RabbitMQ');
    return { connection, channel };
  } catch (error) {
    logger.error('RabbitMQ connection error:', error);
    throw error;
  }
};

// Make connections available to routes
app.locals.db = pool;
app.locals.redis = redis;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({
      status: 'ok',
      service: 'payments-service',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'payments-service',
      error: error.message,
    });
  }
});

// Routes
app.use('/', paymentRoutes);

// Error handler
app.use(errorHandler);

// Initialize and start
const startServer = async () => {
  try {
    // Connect to RabbitMQ
    const { channel: rabbitChannel } = await connectRabbitMQ();
    app.locals.channel = rabbitChannel;

    // Start consuming events
    await consumeOrderEvents(rabbitChannel, pool);

    // Start server
    app.listen(PORT, async () => {
      logger.info(`Payments service running on port ${PORT}`);

      try {
        await registerService('payments-service', PORT);
      } catch (error) {
        logger.warn('Failed to register with service discovery:', error.message);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  redis.disconnect();
  if (channel) await channel.close();
  if (connection) await connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  redis.disconnect();
  if (channel) await channel.close();
  if (connection) await connection.close();
  process.exit(0);
});
