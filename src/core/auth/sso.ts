var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
let SSO = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.providers = /* @__PURE__ */ new Map();
    this.sessions = /* @__PURE__ */ new Map();
    this.config = options;
  }
  registerProvider(name, provider) {
    this.providers.set(name, provider);
    this.emit('provider.registered', { name, provider: provider.name });
  }
  async authenticate(provider, credentials) {
    const ssoProvider = this.providers.get(provider);
    if (!ssoProvider) {
      throw new Error(`SSO provider not found: ${provider}`);
    }
    try {
      const user = await ssoProvider.authenticate(credentials);
      const sessionId = this.createSession(user, provider);
      this.emit('authentication.success', {
        user: user.id,
        provider,
        sessionId,
      });
      return { user, sessionId };
    } catch (error) {
      this.emit('authentication.failed', {
        provider,
        error: error.message,
      });
      throw error;
    }
  }
  createSession(user, provider) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userId: user.id,
      provider,
      created: /* @__PURE__ */ new Date(),
      lastAccessed: /* @__PURE__ */ new Date(),
      user,
    };
    this.sessions.set(sessionId, session);
    return sessionId;
  }
  async validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.lastAccessed = /* @__PURE__ */ new Date();
    return session;
  }
  async logout(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.emit('logout', {
        user: session.userId,
        provider: session.provider,
        sessionId,
      });
    }
  }
  generateSessionId() {
    return `sso_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
  middleware() {
    return async (req, res, next) => {
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ error: 'Session ID required' });
      }
      const session = await this.validateSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      req.user = session.user;
      req.session = session;
      next();
    };
  }
  getStats() {
    return {
      providers: this.providers.size,
      activeSessions: this.sessions.size,
      providerNames: Array.from(this.providers.keys()),
    };
  }
};
SSO = __decorateClass([singleton()], SSO);
var sso_default = SSO;
export { SSO, sso_default as default };
