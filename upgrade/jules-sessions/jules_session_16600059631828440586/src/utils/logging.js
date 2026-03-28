// Copyright (c) 2026 Ultra-Dex
// src/utils/logging.js

import winston from 'winston';
import os from 'os';
import { sanitizePayload } from './privacy.js';

// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define redaction format
const redactPII = winston.format((info) => {
  const skipKeys = ['level', 'timestamp']; 
  
  // Sanitize message
  if (info.message) {
    info.message = sanitizePayload(info.message);
  }
  
  // Sanitize other properties
  for (const key of Object.keys(info)) {
    if (skipKeys.includes(key)) continue;
    info[key] = sanitizePayload(info[key]);
  }
  
  return info;
});

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  redactPII(),
  winston.format.json()
);

// Determine console log level
// Priority: LOG_LEVEL > DEBUG env var > NODE_ENV
let consoleLevel = 'info';
if (process.env.LOG_LEVEL) {
  consoleLevel = process.env.LOG_LEVEL;
} else if (process.env.DEBUG) {
  consoleLevel = 'debug';
} else if (process.env.NODE_ENV === 'test') {
  consoleLevel = 'error';
}

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
      level: consoleLevel
    }),

    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxSize: '20m',
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        redactPII(),
        winston.format.json()
      )
    }),

    // Combined file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxSize: '20m',
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        redactPII(),
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