// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Health check module with HTTP endpoint
 * @module commands/health
 */

import http from 'http';

import { getDefaultProvider } from '../providers/index.js';
import { logger } from '../utils/logger.js';
import { monitoring } from '../utils/monitoring.js';

// Health check HTTP server
export class HealthServer {
  constructor(options = {}) {
    this.port = options.port || 3002;
    this.server = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.info('[health] Server is already running');
      return;
    }

    this.server = http.createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/health') {
        this.handleHealthRequest(req, res);
      } else if (req.method === 'GET' && req.url === '/') {
        this.handleRootRequest(req, res);
      } else {
        this.handleNotFound(req, res);
      }
    });

    this.server.listen(this.port, () => {
      logger.info(`[health] Server running on port ${this.port}`);
    });

    this.isRunning = true;
    return this.server;
  }

  stop() {
    if (this.server && this.isRunning) {
      this.server.close(() => {
        logger.info('[health] Server stopped');
      });
      this.isRunning = false;
    }
  }

  handleHealthRequest(req, res) {
    const healthData = this.getHealthStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData, null, 2));
  }

  handleRootRequest(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Ultra-Dex Health Check\n');
  }

  handleNotFound(req, res) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found\n');
  }

  getHealthStatus() {
    const metrics = monitoring.getMetrics();
    let status = 'healthy';

    // Check for high error count
    if (metrics.errors > 50) {
      status = 'degraded';
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryPercent > 90) {
      status = 'unhealthy';
    } else if (memoryPercent > 80) {
      status = 'degraded';
    }

    return {
      status: status,
      uptime: process.uptime(),
      memory: {
        used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      },
      providers: this.getProviderStatus(),
      sessions: { active: Object.keys(metrics.agents).length },
      timestamp: new Date().toISOString(),
    };
  }

  getProviderStatus() {
    const providerId = getDefaultProvider();
    if (!providerId) {
      return { default: 'error' };
    }

    return { [providerId]: 'connected' };
  }
}

/**
 * Health command handler
 * @param {Object} options - Command options
 */
export async function healthCommand(options) {
  if (options.json || options.port) {
    const server = new HealthServer({ port: options.port || 3002 });
    if (options.json) {
      // Return JSON health status
      const healthData = server.getHealthStatus();
      logger.info(JSON.stringify(healthData, null, 2));
      process.exit(0);
    } else {
      // Start HTTP server
      server.start();

      // Keep process alive
      process.on('SIGINT', () => {
        server.stop();
        process.exit(0);
      });
    }
  } else {
    // Show basic health status
    const server = new HealthServer();
    const healthData = server.getHealthStatus();
    logger.info(`Status: ${healthData.status}`);
    logger.info(`Uptime: ${healthData.uptime}s`);
    logger.info(`Memory: ${healthData.memory.used}MB / ${healthData.memory.total}MB`);
    logger.info(`Providers: ${Object.keys(healthData.providers).join(', ')}`);
    logger.info(`Active sessions: ${healthData.sessions.active}`);
  }
}

/**
 * Register health command with the CLI
 * @param {Object} program - Commander program instance
 */
export function registerHealthCommand(program) {
  program
    .command('health')
    .description('Check system health and start HTTP health endpoint')
    .option('--json', 'Output health status as JSON')
    .option('--port <port>', 'Port for HTTP health endpoint', 3002)
    .action(healthCommand);
}

export default {
  HealthServer,
  healthCommand,
  registerHealthCommand,
};
