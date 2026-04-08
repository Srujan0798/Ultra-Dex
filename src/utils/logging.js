// @ts-check
// Copyright (c) 2026 Ultra-Dex
// src/utils/logging.js

import fs from 'fs';
import os from 'os';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function createConsoleLogger(loadError = null) {
  const write = (level, message, metadata) => {
    const timestamp = new Date().toISOString();
    const suffix =
      metadata && Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
    const line = `[${timestamp}] ${level.toUpperCase()}: ${message}${suffix}`;

    if (level === 'error') {
      process.stderr.write(line + '\n');
      return;
    }

    if (level === 'warn') {
      process.stderr.write(line + '\n');
      return;
    }

    process.stdout.write(line + '\n');
  };

  if (loadError) {
    write('warn', 'Winston unavailable, using console logger fallback', {
      error: loadError.message,
    });
  }

  const logger = {
    transports: [],
    log(entry = {}) {
      const level = entry.level || 'info';
      const message = entry.message || '';
      const { level: _level, message: _message, ...metadata } = entry;
      write(level, message, metadata);
    },
    debug(message, metadata = {}) {
      write('debug', message, metadata);
    },
    info(message, metadata = {}) {
      write('info', message, metadata);
    },
    warn(message, metadata = {}) {
      write('warn', message, metadata);
    },
    warning(message, metadata = {}) {
      write('warn', message, metadata);
    },
    error(message, metadata = {}) {
      write('error', message, metadata);
    },
    success(message, metadata = {}) {
      write('info', message, metadata);
    },
    close() {},
  };

  logger.stream = {
    write(message) {
      logger.info(message.trim());
    },
  };

  logger.perf = (operation, duration, metadata = {}) => {
    logger.info('PERFORMANCE', {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  };

  logger.metric = (name, value, metadata = {}) => {
    logger.info('METRIC', {
      name,
      value,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  };

  logger.trace = (message, metadata = {}) => {
    logger.info('TRACE', {
      message,
      ...metadata,
    });
  };

  return logger;
}

async function createLogger() {
  try {
    const { default: winston } = await import('winston');

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    );

    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: {
        service: 'ultra-dex-meta-layer',
        hostname: os.hostname(),
        pid: process.pid,
        version: process.env.npm_package_version || 'unknown',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
          level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json()
          ),
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json()
          ),
        }),
      ],
    });

    logger.success = (message, metadata = {}) => logger.info(message, metadata);
    logger.warning = (message, metadata = {}) => logger.warn(message, metadata);
    logger.stream = {
      write(message) {
        logger.info(message.trim());
      },
    };
    logger.perf = (operation, duration, metadata = {}) => {
      logger.info('PERFORMANCE', {
        operation,
        duration: `${duration}ms`,
        ...metadata,
      });
    };
    logger.metric = (name, value, metadata = {}) => {
      logger.info('METRIC', {
        name,
        value,
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    };
    logger.trace = (message, metadata = {}) => {
      logger.info('TRACE', {
        message,
        ...metadata,
      });
    };

    return logger;
  } catch (error) {
    return createConsoleLogger(error);
  }
}

// Lazy logger initialization to avoid top-level await issues
let loggerInstance = null;
let loggerPromise = null;

async function getLogger() {
  if (loggerInstance) return loggerInstance;
  if (loggerPromise) return loggerPromise;
  
  // Create with fallback first for immediate use
  loggerInstance = createConsoleLogger();
  
  // Then try to upgrade to winston asynchronously
  loggerPromise = createLogger().then(winstonLogger => {
    loggerInstance = winstonLogger;
    return winstonLogger;
  }).catch(() => loggerInstance);
  
  return loggerInstance;
}

// Export a proxy object that delegates to the actual logger
const logger = new Proxy({}, {
  get(target, prop) {
    if (loggerInstance) {
      return loggerInstance[prop];
    }
    // Fallback during initialization
    const fallback = createConsoleLogger();
    return fallback[prop];
  }
});

export { logger, createLogger, getLogger };
export default logger;
