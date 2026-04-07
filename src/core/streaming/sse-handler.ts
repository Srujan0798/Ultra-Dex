var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { EventEmitter } from "events";
import { singleton, inject } from "tsyringe";
import { DI_TOKENS } from '../di/tokens.js';
let SSEHandler = class extends EventEmitter {
  constructor(logger, config) {
    super();
    this.logger = logger;
    this.config = config;
    this.startHeartbeat();
  }
  clients = /* @__PURE__ */ new Map();
  sessionClients = /* @__PURE__ */ new Map();
  stats = {
    totalConnections: 0,
    activeSessions: 0,
    messagesSent: 0,
    bytesSent: 0
  };
  heartbeatInterval = null;
  /**
   * Express middleware for SSE endpoint
   */
  middleware() {
    return (req, res, next) => {
      const request = req;
      const response = res;
      const sessionId = request.query?.sessionId || this.extractSessionId(request.url || "");
      const userId = request.query?.userId;
      if (!sessionId) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.write(JSON.stringify({ error: "sessionId required" }));
        response.end();
        return;
      }
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
        // Disable nginx buffering
      });
      const clientId = this.generateClientId();
      const client = {
        id: clientId,
        sessionId,
        userId,
        subscriptions: /* @__PURE__ */ new Set([sessionId]),
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        write: (data) => {
          try {
            response.write(data);
            this.stats.bytesSent += Buffer.byteLength(data);
          } catch (error) {
            this.logger.error("SSE write error", error);
            this.removeClient(clientId);
          }
        },
        close: () => {
          response.end();
        }
      };
      this.clients.set(clientId, client);
      this.addSessionClient(sessionId, clientId);
      this.stats.totalConnections++;
      this.stats.activeSessions = this.sessionClients.size;
      this.logger.info("SSE client connected", { clientId, sessionId, userId });
      this.sendToClient(clientId, {
        event: "connected",
        data: {
          clientId,
          sessionId,
          timestamp: Date.now()
        }
      });
      response.on("close", () => {
        this.removeClient(clientId);
      });
      const keepAlive = setInterval(() => {
        if (this.clients.has(clientId)) {
          this.sendToClient(clientId, { event: "ping", data: { timestamp: Date.now() } });
        } else {
          clearInterval(keepAlive);
        }
      }, 3e4);
    };
  }
  /**
   * Broadcast agent event to all subscribed clients
   */
  broadcast(event) {
    const sseEvent = {
      id: this.generateEventId(),
      event: event.type,
      data: event
    };
    const message = this.formatEvent(sseEvent);
    const sessionClientIds = this.sessionClients.get(event.sessionId);
    if (sessionClientIds) {
      sessionClientIds.forEach((clientId) => {
        const client = this.clients.get(clientId);
        if (client) {
          client.write(message);
          client.lastActivity = Date.now();
          this.stats.messagesSent++;
        }
      });
    }
    this.clients.forEach((client) => {
      if (client.subscriptions.has("*")) {
        client.write(message);
        client.lastActivity = Date.now();
        this.stats.messagesSent++;
      }
    });
    this.emit("broadcast", event);
  }
  /**
   * Send event to specific client
   */
  sendToClient(clientId, event) {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    const message = this.formatEvent(event);
    client.write(message);
    client.lastActivity = Date.now();
    this.stats.messagesSent++;
    return true;
  }
  /**
   * Send event to specific session
   */
  sendToSession(sessionId, event) {
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds) {
      return 0;
    }
    let sent = 0;
    const message = this.formatEvent(event);
    clientIds.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client) {
        client.write(message);
        client.lastActivity = Date.now();
        sent++;
      }
    });
    this.stats.messagesSent += sent;
    return sent;
  }
  /**
   * Subscribe client to additional sessions
   */
  subscribeClient(clientId, sessionId) {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    client.subscriptions.add(sessionId);
    this.addSessionClient(sessionId, clientId);
    this.sendToClient(clientId, {
      event: "subscribed",
      data: { sessionId }
    });
    return true;
  }
  /**
   * Unsubscribe client from session
   */
  unsubscribeClient(clientId, sessionId) {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    client.subscriptions.delete(sessionId);
    this.removeSessionClient(sessionId, clientId);
    this.sendToClient(clientId, {
      event: "unsubscribed",
      data: { sessionId }
    });
    return true;
  }
  /**
   * Get current statistics
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Get clients for a session
   */
  getSessionClients(sessionId) {
    const clientIds = this.sessionClients.get(sessionId);
    return clientIds ? Array.from(clientIds) : [];
  }
  /**
   * Shutdown handler
   */
  async shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.clients.forEach((client) => {
      this.sendToClient(client.id, {
        event: "shutdown",
        data: { message: "Server shutting down" }
      });
      client.close();
    });
    this.clients.clear();
    this.sessionClients.clear();
    this.logger.info("SSEHandler shutdown complete");
  }
  formatEvent(event) {
    let message = "";
    if (event.id) {
      message += `id: ${event.id}
`;
    }
    if (event.event) {
      message += `event: ${event.event}
`;
    }
    if (event.retry) {
      message += `retry: ${event.retry}
`;
    }
    const data = typeof event.data === "string" ? event.data : JSON.stringify(event.data);
    message += `data: ${data}

`;
    return message;
  }
  addSessionClient(sessionId, clientId) {
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, /* @__PURE__ */ new Set());
    }
    this.sessionClients.get(sessionId).add(clientId);
    this.stats.activeSessions = this.sessionClients.size;
  }
  removeSessionClient(sessionId, clientId) {
    const clients = this.sessionClients.get(sessionId);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.sessionClients.delete(sessionId);
      }
      this.stats.activeSessions = this.sessionClients.size;
    }
  }
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }
    client.subscriptions.forEach((sessionId) => {
      this.removeSessionClient(sessionId, clientId);
    });
    this.clients.delete(clientId);
    this.logger.info("SSE client disconnected", { clientId, sessionId: client.sessionId });
  }
  startHeartbeat() {
    const interval = this.config.get("sse.heartbeatInterval", 3e4);
    this.heartbeatInterval = setInterval(() => {
      this.cleanupStaleClients();
    }, interval);
  }
  cleanupStaleClients() {
    const now = Date.now();
    const timeout = this.config.get("sse.clientTimeout", 12e4);
    this.clients.forEach((client) => {
      if (now - client.lastActivity > timeout) {
        this.logger.warn("Removing stale SSE client", { clientId: client.id });
        this.removeClient(client.id);
        client.close();
      }
    });
  }
  generateClientId() {
    return `sse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  generateEventId() {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  extractSessionId(url) {
    const match = url.match(/[?&]sessionId=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
};
SSEHandler = __decorateClass([
  singleton(),
  __decorateParam(0, inject(DI_TOKENS.Logger)),
  __decorateParam(1, inject(DI_TOKENS.ConfigService))
], SSEHandler);
export {
  SSEHandler
};
