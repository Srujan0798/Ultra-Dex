/**
 * Ultra-Dex WebSocket Server
 *
 * Real-time event broadcasting for dashboard and monitoring.
 * Emits workflow events, metrics, and status updates.
 */

import { EventEmitter } from './eventEmitter.js';
import { getGlobalLogger } from './logger.js';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface WebSocketClient {
  id: string;
  socket: any; // WebSocket instance
  subscriptions: Set<string>;
  connectedAt: string;
}

export interface DashboardEvent {
  type: 'workflow.started' | 'workflow.completed' | 'workflow.failed' | 
        'task.started' | 'task.completed' | 'task.failed' |
        'metrics.update' | 'system.status';
  timestamp: string;
  workflowId?: string;
  taskId?: string;
  data: Record<string, unknown>;
}

export interface WebSocketServerConfig {
  port?: number;
  host?: string;
  heartbeatInterval?: number;
  maxClients?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// WebSocket Server
// ──────────────────────────────────────────────────────────────────────────────

export class DashboardWebSocketServer {
  private config: Required<WebSocketServerConfig>;
  private clients = new Map<string, WebSocketClient>();
  private server: any;
  private wss: any;
  private eventEmitter: EventEmitter;
  private logger = getGlobalLogger();
  private heartbeatTimer?: NodeJS.Timeout;
  private clientCounter = 0;

  constructor(config?: WebSocketServerConfig) {
    this.config = {
      port: 8080,
      host: 'localhost',
      heartbeatInterval: 30000,
      maxClients: 100,
      ...config,
    };
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const { WebSocketServer } = await import('ws');
      
      this.wss = new WebSocketServer({
        port: this.config.port,
        host: this.config.host,
      });

      this.wss.on('connection', (socket: any, req: any) => {
        this.handleConnection(socket, req);
      });

      this.wss.on('error', (error: Error) => {
        this.logger.error('WebSocket server error', error);
      });

      // Start heartbeat
      this.startHeartbeat();

      this.logger.info(`WebSocket server started on ws://${this.config.host}:${this.config.port}`);

    } catch (error) {
      this.logger.error('Failed to start WebSocket server', error as Error);
      throw error;
    }
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.close();
    }
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
    }

    this.logger.info('WebSocket server stopped');
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: DashboardEvent): void {
    const message = JSON.stringify(event);
    let sentCount = 0;

    for (const client of this.clients.values()) {
      if (client.socket.readyState === 1) { // WebSocket.OPEN
        // Check if client is subscribed to this event type
        if (this.shouldReceiveEvent(client, event)) {
          client.socket.send(message);
          sentCount++;
        }
      }
    }

    this.logger.debug(`Broadcasted ${event.type} to ${sentCount} clients`, {
      eventType: event.type,
      recipientCount: sentCount,
    });
  }

  /**
   * Broadcast to specific workflow subscribers only
   */
  broadcastToWorkflow(workflowId: string, event: DashboardEvent): void {
    const message = JSON.stringify(event);

    for (const client of this.clients.values()) {
      if (client.socket.readyState === 1) {
        // Check if client subscribed to this workflow
        if (client.subscriptions.has(`workflow:${workflowId}`) ||
            client.subscriptions.has('all')) {
          client.socket.send(message);
        }
      }
    }
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get server statistics
   */
  getStats(): {
    connectedClients: number;
    maxClients: number;
    uptime: number;
    messagesSent: number;
  } {
    return {
      connectedClients: this.clients.size,
      maxClients: this.config.maxClients,
      uptime: Date.now(), // Simplified - should track actual start time
      messagesSent: 0, // Would need to track
    };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ──────────────────────────────────────────────────────────────────────────────

  private handleConnection(socket: any, req: any): void {
    // Check max clients
    if (this.clients.size >= this.config.maxClients) {
      socket.close(1013, 'Maximum clients reached');
      return;
    }

    const clientId = `client-${++this.clientCounter}`;
    const client: WebSocketClient = {
      id: clientId,
      socket,
      subscriptions: new Set(['all']), // Default subscribe to all
      connectedAt: new Date().toISOString(),
    };

    this.clients.set(clientId, client);

    this.logger.info(`Client connected: ${clientId}`, {
      clientId,
      ip: req.socket?.remoteAddress,
      totalClients: this.clients.size,
    });

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'system.connected',
      timestamp: new Date().toISOString(),
      data: { clientId, serverTime: Date.now() },
    }));

    // Handle messages from client
    socket.on('message', (data: Buffer) => {
      this.handleClientMessage(client, data);
    });

    // Handle disconnect
    socket.on('close', () => {
      this.handleDisconnect(client);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      this.logger.error(`Client ${clientId} error`, error);
    });

    // Setup pong for heartbeat
    socket.on('pong', () => {
      // Client is alive
      (socket as any).isAlive = true;
    });
  }

  private handleClientMessage(client: WebSocketClient, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          if (message.workflowId) {
            client.subscriptions.add(`workflow:${message.workflowId}`);
            this.logger.debug(`Client ${client.id} subscribed to workflow ${message.workflowId}`);
          }
          break;

        case 'unsubscribe':
          if (message.workflowId) {
            client.subscriptions.delete(`workflow:${message.workflowId}`);
          }
          break;

        case 'ping':
          client.socket.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          }));
          break;

        default:
          this.logger.warn(`Unknown message type from client ${client.id}: ${message.type}`);
      }
    } catch (error) {
      this.logger.error(`Invalid message from client ${client.id}`, error as Error);
    }
  }

  private handleDisconnect(client: WebSocketClient): void {
    this.clients.delete(client.id);
    this.logger.info(`Client disconnected: ${client.id}`, {
      clientId: client.id,
      duration: Date.now() - new Date(client.connectedAt).getTime(),
      totalClients: this.clients.size,
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      for (const client of this.clients.values()) {
        if (client.socket.readyState === 1) {
          // Check if client responded to last ping
          if ((client.socket as any).isAlive === false) {
            this.logger.warn(`Client ${client.id} timed out`);
            client.socket.terminate();
            this.clients.delete(client.id);
            continue;
          }

          (client.socket as any).isAlive = false;
          client.socket.ping();
        }
      }
    }, this.config.heartbeatInterval);
  }

  private shouldReceiveEvent(client: WebSocketClient, event: DashboardEvent): boolean {
    // If subscribed to all, receive everything
    if (client.subscriptions.has('all')) {
      return true;
    }

    // If event has workflowId, check specific subscription
    if (event.workflowId) {
      return client.subscriptions.has(`workflow:${event.workflowId}`);
    }

    // System events go to all
    return true;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Singleton Instance
// ──────────────────────────────────────────────────────────────────────────────

let globalWebSocketServer: DashboardWebSocketServer | undefined;

export function getGlobalWebSocketServer(): DashboardWebSocketServer {
  if (!globalWebSocketServer) {
    globalWebSocketServer = new DashboardWebSocketServer();
  }
  return globalWebSocketServer;
}

export async function startDashboardServer(config?: WebSocketServerConfig): Promise<DashboardWebSocketServer> {
  const server = new DashboardWebSocketServer(config);
  await server.start();
  return server;
}
