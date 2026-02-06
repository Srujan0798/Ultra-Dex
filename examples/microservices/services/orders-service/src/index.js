const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const Redis = require('ioredis');
const amqp = require('amqplib');
require('dotenv').config();

const logger = require('./utils/logger');
const { registerService } = require('./utils/serviceDiscovery');
const orderRoutes = require('./routes/orders');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || 'orders_db',
  user: process.env.DB_USER || 'orders_user',
  password: process.env.DB_PASSWORD || 'orders_pass123',
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// RabbitMQ connection
let channel;
const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
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
      service: 'orders-service',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'orders-service',
      error: error.message,
    });
  }
});

// Routes
app.use('/', orderRoutes);

// Error handler
app.use(errorHandler);

// Initialize and start
const startServer = async () => {
  try {
    // Connect to RabbitMQ
    const { channel: rabbitChannel } = await connectRabbitMQ();
    app.locals.channel = rabbitChannel;

    // Start server
    app.listen(PORT, async () => {
      logger.info(`Orders service running on port ${PORT}`);

      try {
        await registerService('orders-service', PORT);
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
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  redis.disconnect();
  if (channel) await channel.close();
  process.exit(0);
});
