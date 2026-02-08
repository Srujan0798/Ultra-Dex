// Copyright (c) 2026 Ultra-Dex

import { WebSocketServer, WebSocket } from 'ws';
import chalk from 'chalk';
import http from 'http';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';

import { projectGraph } from './graph.js';
import { loadState } from '../commands/plan.js';

class UltraDexWebSocketServer {
  constructor(port = 3002) {
    this.port = port;
    this.wss = null;
    this.server = null;
    this.clients = new Set();
    this.interval = null;
    this.broadcastErrorCount = 0;
    this.maxBroadcastErrors = 10;
    this.started = false;

    // Memory leak prevention
    this.heartbeatInterval = null;
    this.heartbeatIntervalMs = 30000; // 30 seconds
    this.connectionTimeout = 60000; // 60 seconds without ping = dead
    this.clientMetadata = new WeakMap(); // Store last ping time per client

    // Cleanup interval for dead connections
    this.cleanupInterval = null;
    this.cleanupIntervalMs = 60000; // Check every minute
  }

  async start(options = {}) {
    if (this.started) return;

    const port = options.port || 3002;

    try {
      // Ensure graph is scanned
      projectGraph.scan().catch(() => {});

      // Create HTTP server to upgrade to WebSocket
      this.server = http.createServer();

      // Create WebSocket server
      this.wss = new WebSocketServer({
        server: this.server,
        path: '/ws',
      });

      this.wss.on('connection', (ws) => {
        this.clients.add(ws);

        // Track connection metadata for heartbeat
        this.clientMetadata.set(ws, {
          connectedAt: Date.now(),
          lastPing: Date.now(),
          messageCount: 0,
        });

        logger.debug(`[WebSocket] Client connected. Total: ${this.clients.size}`);

        // Send welcome message with heartbeat config
        ws.send(
          JSON.stringify({
            type: 'connected',
            timestamp: new Date().toISOString(),
            message: 'Connected to Ultra-dex WebSocket Server',
            config: {
              heartbeatInterval: this.heartbeatIntervalMs,
              timeout: this.connectionTimeout,
            },
          })
        );

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());

            // Update last activity
            const metadata = this.clientMetadata.get(ws);
            if (metadata) {
              metadata.messageCount++;
            }

            // Handle different message types
            switch (data.type) {
              case 'ping':
                // Update last ping time and respond with pong
                if (metadata) {
                  metadata.lastPing = Date.now();
                }
                ws.send(
                  JSON.stringify({
                    type: 'pong',
                    timestamp: Date.now(),
                    serverTime: new Date().toISOString(),
                  })
                );
                break;

              case 'request_state':
                this.sendStateUpdate(ws);
                break;

              case 'request_graph':
                this.sendGraphUpdate(ws);
                break;

              default:
                logger.debug(`[WebSocket] Unknown message type: ${data.type}`);
            }
          } catch (error) {
            logger.error('[WebSocket] Error parsing message', error);
          }
        });

        ws.on('close', (code, _reason) => {
          this.clients.delete(ws);
          this.clientMetadata.delete(ws);
          logger.debug(
            `[WebSocket] Client disconnected (code: ${code}). Total: ${this.clients.size}`
          );
        });

        ws.on('close', (code, _reason) => {
          this.clients.delete(ws);
          this.clientMetadata.delete(ws);
          logger.debug(
            `[WebSocket] Client disconnected (code: ${code}). Total: ${this.clients.size}`
          );
        });

        ws.on('error', (error) => {
          logger.error('[WebSocket] Connection error', error);
          this.clients.delete(ws);
          this.clientMetadata.delete(ws);

          // Ensure socket is closed
          try {
            ws.terminate();
          } catch (e) {
            // Socket may already be closed
          }
        });

        // Set a timeout for initial connection
        ws._connectionTimeout = setTimeout(() => {
          if (ws.readyState !== 1) {
            // 1 = OPEN
            logger.debug('[WebSocket] Connection timeout, terminating');
            this.clients.delete(ws);
            this.clientMetadata.delete(ws);
            ws.terminate();
          }
        }, 10000); // 10 second initial connection timeout
      });

      return new Promise((resolve, reject) => {
        this.server.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            reject(new AppError(`WebSocket port ${port} already in use`, { code: 'PORT_IN_USE' }));
          } else {
            reject(new AppError(`WebSocket server error: ${err.message}`, { cause: err }));
          }
        });

        this.server.listen(port, () => {
          this.started = true;
          logger.info(
            `[WebSocket] Ultra-Dex WebSocket server running on ws://localhost:${port}/ws`
          );

          // Start broadcasting updates
          this.startBroadcasting();

          // Start connection cleanup (memory leak prevention)
          this.startCleanupInterval();
          resolve();
        });
      });
    } catch (err) {
      logger.error('Failed to start WebSocket server', err);
      throw err;
    }
  }

  startCleanupInterval() {
    // Periodically check for and remove dead connections
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let removedCount = 0;

      for (const client of this.clients) {
        const metadata = this.clientMetadata.get(client);

        // Check if connection is dead (no ping for timeout duration)
        const isDead = metadata && now - metadata.lastPing > this.connectionTimeout;

        // Check if connection is not actually open
        const isNotOpen = client.readyState !== WebSocket.OPEN;

        if (isDead || isNotOpen) {
          this.clients.delete(client);
          this.clientMetadata.delete(client);
          removedCount++;

          // Force close dead connections
          try {
            if (
              client.readyState === WebSocket.OPEN ||
              client.readyState === WebSocket.CONNECTING
            ) {
              client.terminate();
            }
          } catch (e) {
            // Ignore errors from already closed connections
          }
        }
      }

      if (removedCount > 0) {
        logger.debug(
          `[WebSocket] Cleanup: Removed ${removedCount} dead connections. Total: ${this.clients.size}`
        );
      }
    }, this.cleanupIntervalMs);
  }

  startBroadcasting() {
    // Broadcast updates every 5 seconds
    this.interval = setInterval(async () => {
      try {
        const update = await this.getSystemUpdate();
        this.broadcast(update);
        this.broadcastErrorCount = 0; // Reset on success
      } catch (error) {
        this.broadcastErrorCount++;
        logger.error(
          `[WebSocket] Broadcast error (${this.broadcastErrorCount}/${this.maxBroadcastErrors})`,
          error
        );

        // Stop broadcasting after too many consecutive errors
        if (this.broadcastErrorCount >= this.maxBroadcastErrors) {
          logger.error('[WebSocket] Too many broadcast errors, stopping automatic updates');
          clearInterval(this.interval);
          this.interval = null;
        }
      }
    }, 5000);
  }

  async getSystemUpdate() {
    const state = await loadState();
    const summary = projectGraph.getSummary();

    return {
      type: 'system_update',
      timestamp: new Date().toISOString(),
      data: {
        state: state || { status: 'initializing' },
        graph: {
          nodes: summary.nodeCount,
          edges: summary.edgeCount,
          files: summary.files.length,
        },
        metrics: {
          clients: this.clients.size,
          memory: process.memoryUsage().heapUsed,
          uptime: process.uptime(),
        },
      },
    };
  }

  async sendStateUpdate(ws) {
    const state = await loadState();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'state_update',
          data: state || { status: 'no_state' },
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  async sendGraphUpdate(ws) {
    const summary = projectGraph.getSummary();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'graph_update',
          data: {
            nodes: Array.from(projectGraph.nodes.entries()).map(([path, node]) => ({
              id: path,
              type: node.type,
              size: node.size,
            })),
            edges: projectGraph.edges,
          },
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  broadcast(data) {
    if (!this.wss) return;

    const message = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  async stop() {
    if (!this.started) return;

    // Stop all intervals
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all client connections gracefully
    for (const client of this.clients) {
      try {
        // Clear connection timeout if exists
        if (client._connectionTimeout) {
          clearTimeout(client._connectionTimeout);
        }

        // Close connection gracefully
        if (client.readyState === WebSocket.OPEN) {
          client.close(1000, 'Server shutting down');
        } else if (client.readyState === WebSocket.CONNECTING) {
          client.terminate();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.server = null;
          this.wss = null;
          this.started = false;
          this.clients.clear();
          this.clientMetadata = new WeakMap();
          this.broadcastErrorCount = 0;
          logger.info('[WebSocket] Server stopped');
          resolve();
        });
      });
    } else {
      this.started = false;
      this.clients.clear();
      this.clientMetadata = new WeakMap();
      this.broadcastErrorCount = 0;
    }
  }
}

export const webSocketServer = new UltraDexWebSocketServer();
export { UltraDexWebSocketServer };
