/**
 * Ultra-Dex WebSocket Server for Real-time Updates
 * Provides live updates for agent status, progress, and context changes
 */

import WebSocket from 'ws';
import http from 'http';
import { projectGraph } from './graph.js';
import { loadState } from '../commands/state.js';
import { monitoring } from '../utils/monitoring.js';

class UltraDexWebSocketServer {
  constructor(port = 3002) {
    this.port = port;
    this.clients = new Set();
    this.server = null;
    this.wss = null;
    this.interval = null;
    this.broadcastErrorCount = 0;
    this.maxBroadcastErrors = 10;
    
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
    const _port = options.port || this.port;

    // Create HTTP server to upgrade to WebSocket
    this.server = http.createServer();

    // Create WebSocket server
    this.wss = new WebSocket.Server({
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      // Track connection metadata for heartbeat
      this.clientMetadata.set(ws, {
        connectedAt: Date.now(),
        lastPing: Date.now(),
        messageCount: 0
      });
      
      console.log(`[WebSocket] Client connected. Total: ${this.clients.size}`);

      // Send welcome message with heartbeat config
      ws.send(JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Connected to Ultra-Dex WebSocket Server',
        config: {
          heartbeatInterval: this.heartbeatIntervalMs,
          timeout: this.connectionTimeout
        }
      }));

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
              ws.send(JSON.stringify({ 
                type: 'pong', 
                timestamp: Date.now(),
                serverTime: new Date().toISOString()
              }));
              break;
              
            case 'request_state':
              this.sendStateUpdate(ws);
              break;
              
            case 'request_graph':
              this.sendGraphUpdate(ws);
              break;
              
            default:
              console.log(`[WebSocket] Unknown message type: ${data.type}`);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error.message);
        }
      });

      ws.on('close', (code, reason) => {
        this.clients.delete(ws);
        this.clientMetadata.delete(ws);
        console.log(`[WebSocket] Client disconnected (code: ${code}). Total: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Connection error:', error.message);
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
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('[WebSocket] Connection timeout, terminating');
          this.clients.delete(ws);
          this.clientMetadata.delete(ws);
          ws.terminate();
        }
      }, 10000); // 10 second initial connection timeout
    });

    this.server.listen(this.port, () => {
      console.log(`[WebSocket] Ultra-Dex WebSocket server running on ws://localhost:${this.port}/ws`);
    });

    // Start broadcasting updates
    this.startBroadcasting();
    
    // Start connection cleanup (memory leak prevention)
    this.startCleanupInterval();
  }
  
  startCleanupInterval() {
    // Periodically check for and remove dead connections
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let removedCount = 0;
      
      for (const client of this.clients) {
        const metadata = this.clientMetadata.get(client);
        
        // Check if connection is dead (no ping for timeout duration)
        const isDead = metadata && (now - metadata.lastPing) > this.connectionTimeout;
        
        // Check if connection is not actually open
        const isNotOpen = client.readyState !== WebSocket.OPEN;
        
        if (isDead || isNotOpen) {
          this.clients.delete(client);
          this.clientMetadata.delete(client);
          removedCount++;
          
          // Force close dead connections
          try {
            if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
              client.terminate();
            }
          } catch (e) {
            // Ignore errors from already closed connections
          }
        }
      }
      
      if (removedCount > 0) {
        console.log(`[WebSocket] Cleanup: Removed ${removedCount} dead connections. Total: ${this.clients.size}`);
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
        console.error(`[WebSocket] Broadcast error (${this.broadcastErrorCount}/${this.maxBroadcastErrors}):`, error.message);

        // Stop broadcasting after too many consecutive errors
        if (this.broadcastErrorCount >= this.maxBroadcastErrors) {
          console.error('[WebSocket] Too many broadcast errors, stopping automatic updates');
          clearInterval(this.interval);
          this.interval = null;
        }
      }
    }, 5000);
  }

  async getSystemUpdate() {
    const state = await loadState().catch(() => null);
    const graphSummary = projectGraph.getSummary();
    const metrics = monitoring.getMetrics();

    return {
      type: 'system_update',
      timestamp: new Date().toISOString(),
      data: {
        state: state ? { 
          status: state.status, 
          progress: state.progress,
          lastUpdated: state.lastUpdated
        } : null,
        graph: {
          nodes: graphSummary.nodeCount,
          edges: graphSummary.edgeCount,
          files: graphSummary.files?.length || 0
        },
        metrics: {
          requests: metrics.requests,
          errors: metrics.errors,
          uptime: metrics.uptime
        },
        clients: this.clients.size
      }
    };
  }

  sendStateUpdate(ws) {
    loadState()
      .then(state => {
        ws.send(JSON.stringify({
          type: 'state_update',
          data: state,
          timestamp: new Date().toISOString()
        }));
      })
      .catch(error => {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to load state',
          error: error.message
        }));
      });
  }

  sendGraphUpdate(ws) {
    try {
      const summary = projectGraph.getSummary();
      ws.send(JSON.stringify({
        type: 'graph_update',
        data: summary,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to get graph summary',
        error: error.message
      }));
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async stop() {
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

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    this.clients.clear();
    this.clientMetadata = new WeakMap(); // Clear metadata
    this.broadcastErrorCount = 0;
    console.log('[WebSocket] Server stopped');
  }
}

// Singleton instance
export const webSocketServer = new UltraDexWebSocketServer();
export { UltraDexWebSocketServer };

export default webSocketServer;