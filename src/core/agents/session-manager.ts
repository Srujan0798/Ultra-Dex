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
import { singleton } from "tsyringe";
import { EventEmitter } from "events";
let SessionManager = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.sessions = /* @__PURE__ */ new Map();
    this.config = {
      maxSessionDuration: options.maxSessionDuration || 36e5,
      // 1 hour
      inactivityTimeout: options.inactivityTimeout || 6e5,
      // 10 minutes
      autoPersist: options.autoPersist !== false,
      persistInterval: options.persistInterval || 3e4,
      ...options
    };
    this.state = "idle";
    this.persistenceTimer = null;
  }
  /**
   * Initialize session manager
   */
  async initialize() {
    this.state = "ready";
    if (this.config.autoPersist) {
      this.startPersistence();
    }
    this.emit("session-manager.ready");
    return this;
  }
  /**
   * Create a new session
   */
  createSession(sessionId, context = {}) {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: "active",
      context,
      data: {},
      history: [],
      agents: /* @__PURE__ */ new Map(),
      metadata: {}
    };
    this.sessions.set(sessionId, session);
    this.emit("session.created", { sessionId });
    return session;
  }
  /**
   * Get session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
  /**
   * Update session activity
   */
  recordActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session)
      return;
    session.lastActivity = Date.now();
  }
  /**
   * Store data in session
   */
  setSessionData(sessionId, key, value) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.data[key] = value;
    this.recordActivity(sessionId);
  }
  /**
   * Retrieve session data
   */
  getSessionData(sessionId, key) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    this.recordActivity(sessionId);
    return session.data[key];
  }
  /**
   * Add agent to session
   */
  addAgentToSession(sessionId, agent) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.agents.set(agent.id, agent);
    this.emit("session.agent-added", { sessionId, agentId: agent.id });
  }
  /**
   * Record session history
   */
  recordHistory(sessionId, event) {
    const session = this.sessions.get(sessionId);
    if (!session)
      return;
    session.history.push({
      timestamp: Date.now(),
      ...event
    });
    if (session.history.length > 1e3) {
      session.history.shift();
    }
    this.recordActivity(sessionId);
  }
  /**
   * Close session
   */
  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    this.emit("session.closing", { sessionId });
    try {
      for (const agent of session.agents.values()) {
        if (agent.shutdown) {
          await agent.shutdown();
        }
      }
      session.status = "closed";
      session.closedAt = Date.now();
      this.emit("session.closed", { sessionId });
      return true;
    } catch (error) {
      this.emit("session.close-failed", { sessionId, error });
      throw error;
    }
  }
  /**
   * Persist session
   */
  async persistSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session)
      return;
    try {
      const serialized = JSON.stringify({
        id: session.id,
        context: session.context,
        data: session.data,
        metadata: session.metadata,
        persistedAt: Date.now()
      });
      this.emit("session.persisted", { sessionId, size: serialized.length });
      return serialized;
    } catch (error) {
      this.emit("session.persist-failed", { sessionId, error });
      throw error;
    }
  }
  /**
   * Start persistence timer
   */
  startPersistence() {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    this.persistenceTimer = setInterval(() => {
      this.persistAllSessions();
    }, this.config.persistInterval);
  }
  /**
   * Persist all sessions
   */
  async persistAllSessions() {
    const promises = [];
    for (const sessionId of this.sessions.keys()) {
      promises.push(
        this.persistSession(sessionId).catch(() => null)
      );
    }
    await Promise.all(promises);
  }
  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions() {
    const now = Date.now();
    const toClose = [];
    for (const [sessionId, session] of this.sessions) {
      const age = now - session.createdAt;
      const inactivity = now - session.lastActivity;
      if (age > this.config.maxSessionDuration || inactivity > this.config.inactivityTimeout) {
        toClose.push(sessionId);
      }
    }
    for (const sessionId of toClose) {
      await this.closeSession(sessionId);
    }
    if (toClose.length > 0) {
      this.emit("sessions.cleaned", { count: toClose.length });
    }
  }
  /**
   * List all sessions
   */
  listSessions(filter = {}) {
    let sessions = Array.from(this.sessions.values());
    if (filter.status) {
      sessions = sessions.filter((s) => s.status === filter.status);
    }
    return sessions.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
      agentCount: s.agents.size,
      historyLength: s.history.length
    }));
  }
  /**
   * Get session statistics
   */
  getStats() {
    let activeSessions = 0;
    let closedSessions = 0;
    let totalAgents = 0;
    for (const session of this.sessions.values()) {
      if (session.status === "active") {
        activeSessions++;
      } else if (session.status === "closed") {
        closedSessions++;
      }
      totalAgents += session.agents.size;
    }
    return {
      totalSessions: this.sessions.size,
      activeSessions,
      closedSessions,
      totalAgents,
      managerUptime: Date.now() - this.startTime
    };
  }
  /**
   * Shutdown session manager
   */
  async shutdown() {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.closeSession(sessionId).catch(() => null);
    }
    this.state = "shutdown";
    this.emit("session-manager.shutdown");
  }
};
SessionManager = __decorateClass([
  singleton()
], SessionManager);
var session_manager_default = SessionManager;
export {
  SessionManager,
  session_manager_default as default
};
