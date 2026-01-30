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
      console.log(`[WebSocket] Client connected. Total: ${this.clients.size}`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Connected to Ultra-Dex WebSocket Server'
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle different message types
          switch (data.type) {
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
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

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Total: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Connection error:', error.message);
        this.clients.delete(ws);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`[WebSocket] Ultra-Dex WebSocket server running on ws://localhost:${this.port}/ws`);
    });

    // Start broadcasting updates
    this.startBroadcasting();
  }

  startBroadcasting() {
    // Broadcast updates every 5 seconds
    this.interval = setInterval(async () => {
      try {
        const update = await this.getSystemUpdate();
        this.broadcast(update);
      } catch (error) {
        console.error('[WebSocket] Broadcast error:', error.message);
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
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    this.clients.clear();
    console.log('[WebSocket] Server stopped');
  }
}

// Singleton instance
export const webSocketServer = new UltraDexWebSocketServer();
export { UltraDexWebSocketServer };

export default webSocketServer;