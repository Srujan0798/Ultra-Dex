const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const Redis = require('ioredis');
require('dotenv').config();

const logger = require('./utils/logger');
const { registerService } = require('./utils/serviceDiscovery');
const userRoutes = require('./routes/users');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'users_db',
  user: process.env.DB_USER || 'users_user',
  password: process.env.DB_PASSWORD || 'users_pass123',
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

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
      service: 'users-service',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'users-service',
      error: error.message,
    });
  }
});

// Routes
app.use('/', userRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  logger.info(`Users service running on port ${PORT}`);

  try {
    await registerService('users-service', PORT);
  } catch (error) {
    logger.warn('Failed to register with service discovery:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  redis.disconnect();
  process.exit(0);
});
