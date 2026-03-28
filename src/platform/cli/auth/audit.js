// Copyright (c) 2026 Ultra-Dex

/**
 * Enterprise Audit Logging
 * Tracks all actions for compliance and security
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Audit Logger
 */
export class AuditLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(process.cwd(), '.ultra-dex', 'logs');
    this.retentionDays = options.retentionDays || 90;
    this.buffer = [];
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 5000; // 5 seconds

    this.init();
  }

  /**
   * Initialize the logger
   */
  async init() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      this.startFlushInterval();
    } catch (error) {
      logger.error(chalk.red('[Audit] Failed to initialize:', error.message));
    }
  }

  /**
   * Start automatic flush interval
   */
  startFlushInterval() {
    const timer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
    this.flushTimer = timer;
  }

  /**
   * Log an action
   */
  async log(action) {
    const entry = {
      timestamp: new Date().toISOString(),
      id: this.generateId(),
      action: action.type || 'unknown',
      user: action.user || null,
      userId: action.userId || null,
      resource: action.resource || null,
      resourceType: action.resourceType || null,
      method: action.method || null,
      status: action.status || 'success',
      details: action.details || {},
      ip: action.ip || null,
      userAgent: action.userAgent || null,
      duration: action.duration || null,
      error: action.error || null,
    };

    this.buffer.push(entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }

    return entry.id;
  }

  /**
   * Generate unique log ID
   */
  generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Flush buffer to disk
   */
  async flush() {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `audit-${date}.log`);

    try {
      const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
      await fs.appendFile(logFile, lines, 'utf8');
    } catch (error) {
      logger.error(chalk.red('[Audit] Failed to write logs:', error.message));
      // Put entries back in buffer
      this.buffer.unshift(...entries);
    }
  }

  /**
   * Query audit logs
   */
  async query(filters = {}) {
    const { startDate, endDate, user, action, resource, status, limit = 100, offset = 0 } = filters;

    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter((f) => f.startsWith('audit-') && f.endsWith('.log'))
        .sort()
        .reverse();

      const results = [];
      let skipped = 0;

      for (const file of logFiles) {
        if (results.length >= limit + offset) break;

        const content = await fs.readFile(path.join(this.logDir, file), 'utf8');
        const lines = content.split('\n').filter(Boolean);

        for (const line of lines.reverse()) {
          try {
            const entry = JSON.parse(line);

            // Apply filters
            if (startDate && new Date(entry.timestamp) < new Date(startDate)) continue;
            if (endDate && new Date(entry.timestamp) > new Date(endDate)) continue;
            if (user && entry.user !== user) continue;
            if (action && entry.action !== action) continue;
            if (resource && entry.resource !== resource) continue;
            if (status && entry.status !== status) continue;

            if (skipped < offset) {
              skipped++;
              continue;
            }

            results.push(entry);
            if (results.length >= limit) break;
          } catch {
            // Skip invalid lines
          }
        }
      }

      return results;
    } catch (error) {
      logger.error(chalk.red('[Audit] Query failed:', error.message));
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.query({
      startDate: startDate.toISOString(),
      limit: 10000,
    });

    const stats = {
      totalActions: logs.length,
      byAction: {},
      byUser: {},
      byStatus: {},
      byDay: {},
    };

    for (const log of logs) {
      // By action type
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // By user
      if (log.user) {
        stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1;
      }

      // By status
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;

      // By day
      const day = log.timestamp.split('T')[0];
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    }

    return stats;
  }

  /**
   * Clean old logs
   */
  async cleanup() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    try {
      const files = await fs.readdir(this.logDir);
      let deleted = 0;

      for (const file of files) {
        if (!file.startsWith('audit-') || !file.endsWith('.log')) continue;

        const fileDate = file.replace('audit-', '').replace('.log', '');
        if (new Date(fileDate) < cutoffDate) {
          await fs.unlink(path.join(this.logDir, file));
          deleted++;
        }
      }

      return { deleted };
    } catch (error) {
      logger.error(chalk.red('[Audit] Cleanup failed:', error.message));
      return { deleted: 0, error: error.message };
    }
  }

  /**
   * Export logs
   */
  async export(format = 'json', outputPath) {
    const logs = await this.query({ limit: 10000 });

    let content;
    switch (format) {
      case 'csv':
        content = this.toCSV(logs);
        break;
      case 'json':
      default:
        content = JSON.stringify(logs, null, 2);
    }

    if (outputPath) {
      await fs.writeFile(outputPath, content, 'utf8');
      return { exported: logs.length, path: outputPath };
    }

    return { exported: logs.length, content };
  }

  /**
   * Convert logs to CSV
   */
  toCSV(logs) {
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map((log) =>
      Object.values(log)
        .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
        .join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

/**
 * Middleware for Express applications
 */
export function auditMiddleware(logger) {
  return (req, res, next) => {
    const startTime = Date.now();

    // Capture response
    const originalEnd = res.end;
    res.end = function (...args) {
      const duration = Date.now() - startTime;

      logger.log({
        type: 'http_request',
        method: req.method,
        resource: req.originalUrl || req.url,
        resourceType: 'endpoint',
        user: req.user?.username || req.user?.email || null,
        userId: req.user?.id || null,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        status: res.statusCode >= 400 ? 'error' : 'success',
        details: {
          statusCode: res.statusCode,
          params: req.params,
          query: req.query,
        },
        duration,
      });

      originalEnd.apply(this, args);
    };

    next();
  };
}

// Export singleton
export const auditLogger = new AuditLogger();
