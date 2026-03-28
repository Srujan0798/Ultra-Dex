// Copyright (c) 2026 Ultra-Dex
// Structured Logger Service with JSON output

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

class StructuredLogger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    this.minLevel = this.levels[this.level] || this.levels.info;
    this.outputStream = options.stream || process.stdout;
    this.logToFile = options.file || null;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.includeTimestamp = options.includeTimestamp !== false;
    this.includeHostname = options.includeHostname !== false;
    this.hostname = this.includeHostname ? os.hostname() : undefined;
  }

  shouldLog(level) {
    return this.levels[level] <= this.minLevel;
  }

  async log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = {
      timestamp: this.includeTimestamp ? new Date().toISOString() : undefined,
      level,
      message,
      hostname: this.hostname,
      pid: process.pid,
      ...metadata
    };

    // Remove undefined values to keep JSON clean
    const cleanLogEntry = {};
    for (const [key, value] of Object.entries(logEntry)) {
      if (value !== undefined) {
        cleanLogEntry[key] = value;
      }
    }

    const jsonLog = JSON.stringify(cleanLogEntry) + '\n';

    // Write to stdout
    this.outputStream.write(jsonLog);

    // Optionally write to file
    if (this.logToFile) {
      await this.writeToFile(jsonLog);
    }
  }

  async writeToFile(logLine) {
    try {
      // Check if file exists and if it's too large
      try {
        const stats = await fs.stat(this.logToFile);
        if (stats.size > this.maxFileSize) {
          // Rotate the log file
          const rotatedFile = `${this.logToFile}.${Date.now()}.bak`;
          await fs.rename(this.logToFile, rotatedFile);
        }
      } catch (error) {
        // File doesn't exist, which is fine
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Append to log file
      await fs.appendFile(this.logToFile, logLine);
    } catch (error) {
      // Fallback to stderr if file writing fails
      process.stderr.write(`[StructuredLogger] Failed to write to log file: ${error.message}\n`);
      this.outputStream.write(logLine);
    }
  }

  error(message, metadata = {}) {
    return this.log('error', message, metadata);
  }

  warn(message, metadata = {}) {
    return this.log('warn', message, metadata);
  }

  info(message, metadata = {}) {
    return this.log('info', message, metadata);
  }

  debug(message, metadata = {}) {
    return this.log('debug', message, metadata);
  }

  trace(message, metadata = {}) {
    return this.log('trace', message, metadata);
  }

  // Method to change log level at runtime
  setLevel(level) {
    this.level = level;
    this.minLevel = this.levels[level] || this.levels.info;
  }

  // Child logger with additional metadata
  child(defaultMetadata = {}) {
    const childLogger = new StructuredLogger({
      level: this.level,
      stream: this.outputStream,
      file: this.logToFile,
      maxFileSize: this.maxFileSize,
      includeTimestamp: this.includeTimestamp,
      includeHostname: this.includeHostname
    });

    // Override the log method to include default metadata
    childLogger.originalLog = childLogger.log.bind(childLogger);
    childLogger.log = async (level, message, metadata = {}) => {
      const mergedMetadata = { ...defaultMetadata, ...metadata };
      return childLogger.originalLog(level, message, mergedMetadata);
    };

    return childLogger;
  }

  // Method to create a logger with correlation ID
  withCorrelationId(correlationId) {
    return this.child({ correlationId });
  }

  // Health check for the logger
  healthCheck() {
    try {
      const isWritable = this.outputStream.writable;
      const fileStatus = this.logToFile ? 'file_ok' : 'no_file';
      
      return {
        status: 'healthy',
        writable: isWritable,
        file: fileStatus,
        level: this.level
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Create a global instance for convenience
const logger = new StructuredLogger();

export default logger;
export { StructuredLogger };