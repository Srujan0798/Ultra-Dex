// Copyright (c) 2026 Ultra-Dex
// src/utils/logging.js

import winston from 'winston';
import os from 'os';

// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'ultra-dex-meta-layer',
    hostname: os.hostname(),
    pid: process.pid,
    version: process.env.npm_package_version || 'unknown'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info'
    }),

    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      )
    }),

    // Combined file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      )
    })
  ]
});

// Add a stream function for morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Performance logging function
logger.perf = (operation, duration, metadata = {}) => {
  logger.info('PERFORMANCE', {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Metric logging function
logger.metric = (name, value, metadata = {}) => {
  logger.info('METRIC', {
    name,
    value,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Trace logging function
logger.trace = (message, metadata = {}) => {
  logger.info('TRACE', {
    message,
    ...metadata
  });
};

// Export logger
export { logger };

// Export for ES6 import compatibility
export default logger;