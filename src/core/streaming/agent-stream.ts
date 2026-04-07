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
import { singleton, inject } from "tsyringe";
import { EventEmitter } from "events";
import { WebSocketServer, WebSocket } from "ws";
import { DI_TOKENS } from '../di/tokens.js';
let AgentStreamingService = class extends EventEmitter {
  constructor(logger, config, pipeline) {
    super();
    this.logger = logger;
    this.config = config;
    this.pipeline = pipeline;
    this.port = this.config.get("streaming.port", 3002);
  }
  wss = null;
  clients = /* @__PURE__ */ new Map();
  pipeline;
  port;
  async initialize() {
    this.wss = new WebSocketServer({ port: this.port });
    this.wss.on("connection", (ws, req) => {
      const clientId = this.generateClientId();
      const sessionId = this.extractSessionId(req);
      this.logger.info("WebSocket client connected", { clientId, sessionId });
      const session = {
        ws,
        sessionId,
        subscriptions: /* @__PURE__ */ new Set()
      };
      this.clients.set(clientId, session);
      this.sendToClient(clientId, {
        type: "connection:established",
        clientId,
        sessionId,
        timestamp: Date.now()
      });
      ws.on("message", (data) => {
        this.handleClientMessage(clientId, data.toString());
      });
      ws.on("close", () => {
        this.logger.info("WebSocket client disconnected", { clientId });
        this.clients.delete(clientId);
      });
      ws.on("error", (error) => {
        this.logger.error("WebSocket error", error);
      });
    });
    this.pipeline.on("event:output", (event) => {
      this.broadcastAgentEvent(event.data);
    });
    this.logger.info(`AgentStreamingService listening on port ${this.port}`);
  }
  /**
   * Broadcast agent thought to subscribed clients
   */
  broadcastAgentEvent(event) {
    const message = JSON.stringify({
      type: event.type,
      data: event,
      timestamp: Date.now()
    });
    for (const [clientId, session] of this.clients) {
      if (session.subscriptions.has(event.sessionId) || session.subscriptions.has("*")) {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(message);
        }
      }
    }
  }
  /**
   * Send message to specific session
   */
  sendToSession(sessionId, message) {
    const payload = JSON.stringify({
      type: "session:message",
      data: message,
      timestamp: Date.now()
    });
    for (const [, session] of this.clients) {
      if (session.sessionId === sessionId && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(payload);
      }
    }
  }
  /**
   * Stream agent execution in real-time
   */
  async *streamAgentExecution(taskId, sessionId) {
    const eventQueue = [];
    let resolveNext = null;
    const handler = (event) => {
      if (event.taskId === taskId && event.sessionId === sessionId) {
        if (resolveNext) {
          resolveNext({ value: event, done: false });
          resolveNext = null;
        } else {
          eventQueue.push(event);
        }
      }
    };
    this.on("agent:event", handler);
    try {
      while (true) {
        while (eventQueue.length > 0) {
          yield eventQueue.shift();
        }
        const nextEvent = await new Promise((resolve) => {
          resolveNext = resolve;
          setTimeout(() => resolve({ value: void 0, done: true }), 1e3);
        });
        if (nextEvent.value) {
          yield nextEvent.value;
        }
      }
    } finally {
      this.off("agent:event", handler);
    }
  }
  handleClientMessage(clientId, message) {
    try {
      const data = JSON.parse(message);
      const session = this.clients.get(clientId);
      if (!session)
        return;
      switch (data.type) {
        case "subscribe":
          if (data.sessionId) {
            session.subscriptions.add(data.sessionId);
            this.sendToClient(clientId, {
              type: "subscribed",
              sessionId: data.sessionId
            });
          }
          break;
        case "unsubscribe":
          if (data.sessionId) {
            session.subscriptions.delete(data.sessionId);
            this.sendToClient(clientId, {
              type: "unsubscribed",
              sessionId: data.sessionId
            });
          }
          break;
        case "ping":
          this.sendToClient(clientId, { type: "pong", timestamp: Date.now() });
          break;
        default:
          this.logger.warn("Unknown client message type", { type: data.type });
      }
    } catch (error) {
      this.logger.error("Failed to parse client message", error);
    }
  }
  sendToClient(clientId, message) {
    const session = this.clients.get(clientId);
    if (session && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify(message));
    }
  }
  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  extractSessionId(req) {
    const url = req.url || "";
    const match = url.match(/sessionId=([^&]+)/);
    return match ? match[1] : "default";
  }
  getStats() {
    const sessions = /* @__PURE__ */ new Set();
    let subscriptions = 0;
    for (const session of this.clients.values()) {
      sessions.add(session.sessionId);
      subscriptions += session.subscriptions.size;
    }
    return {
      connectedClients: this.clients.size,
      activeSessions: sessions.size,
      totalSubscriptions: subscriptions
    };
  }
  async shutdown() {
    for (const [clientId, session] of this.clients) {
      session.ws.close();
      this.clients.delete(clientId);
    }
    if (this.wss) {
      this.wss.close();
    }
    this.logger.info("AgentStreamingService shutdown");
  }
};
AgentStreamingService = __decorateClass([
  singleton(),
  __decorateParam(0, inject(DI_TOKENS.Logger)),
  __decorateParam(1, inject(DI_TOKENS.ConfigService)),
  __decorateParam(2, inject(DI_TOKENS.StreamPipeline))
], AgentStreamingService);
export {
  AgentStreamingService
};
