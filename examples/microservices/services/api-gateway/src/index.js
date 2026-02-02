const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const logger = require('./utils/logger');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { createProxyMiddleware } = require('http-proxy-middleware');
const serviceRegistry = require('./utils/serviceRegistry');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  store: {
    incr: (key) => redis.incr(key),
    decrement: (key) => redis.decr(key),
    resetKey: (key) => redis.del(key),
  },
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Service routes
const services = {
  '/api/v1/auth': 'auth-service',
  '/api/v1/users': 'users-service',
  '/api/v1/orders': 'orders-service',
  '/api/v1/payments': 'payments-service',
  '/api/v1/notifications': 'notifications-service'
};

// Create proxy middleware for each service
Object.entries(services).forEach(([path, serviceName]) => {
  const serviceUrl = serviceRegistry.getServiceUrl(serviceName);
  
  const proxyOptions = {
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/v1/${path.split('/')[3]}`]: ''
    },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('x-request-id', req.id);
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    },
    onError: (err, req, res) => {
      logger.error({
        requestId: req.id,
        error: err.message,
        service: serviceName
      });
      res.status(503).json({
        error: 'Service temporarily unavailable',
        service: serviceName
      });
    }
  };

  // Apply authentication for protected routes
  if (path !== '/api/v1/auth') {
    app.use(path, authenticateToken, createProxyMiddleware(proxyOptions));
  } else {
    app.use(path, createProxyMiddleware(proxyOptions));
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  serviceRegistry.initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  redis.disconnect();
  process.exit(0);
});
