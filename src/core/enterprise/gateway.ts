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
let EnterpriseGateway = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      rateLimit: options.rateLimit || 1e3,
      authentication: options.authentication || true,
      logging: options.logging || true,
      monitoring: options.monitoring || true,
      ...options,
    };
    this.routes = /* @__PURE__ */ new Map();
    this.middleware = [];
    this.rateLimiter = /* @__PURE__ */ new Map();
  }
  route(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      options: {
        method: 'POST',
        auth: true,
        rateLimit: true,
        ...options,
      },
    });
    return this;
  }
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }
  async handle(request) {
    const { path, method = 'POST', user, headers = {} } = request;
    try {
      for (const middleware of this.middleware) {
        const result = await middleware(request);
        if (result === false) {
          throw new Error('Request blocked by middleware');
        }
      }
      const route = this.routes.get(path);
      if (!route) {
        throw new Error(`Route not found: ${path}`);
      }
      if (route.options.method !== method) {
        throw new Error(`Method not allowed: ${method}`);
      }
      if (route.options.auth && !user) {
        throw new Error('Authentication required');
      }
      if (route.options.rateLimit) {
        const isAllowed = this.checkRateLimit(user?.id || 'anonymous', path);
        if (!isAllowed) {
          throw new Error('Rate limit exceeded');
        }
      }
      const response = await route.handler(request);
      this.emit('request.success', {
        path,
        user: user?.id,
        response,
        timestamp: /* @__PURE__ */ new Date(),
      });
      return {
        success: true,
        data: response,
        timestamp: /* @__PURE__ */ new Date(),
      };
    } catch (error) {
      this.emit('request.error', {
        path,
        user: user?.id,
        error: error.message,
        timestamp: /* @__PURE__ */ new Date(),
      });
      return {
        success: false,
        error: error.message,
        timestamp: /* @__PURE__ */ new Date(),
      };
    }
  }
  checkRateLimit(userId, path) {
    const key = `${userId}:${path}`;
    const now = Date.now();
    const window = 60 * 1e3;
    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, {
        count: 1,
        resetTime: now + window,
      });
      return true;
    }
    const limit = this.rateLimiter.get(key);
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + window;
      return true;
    }
    if (limit.count >= this.config.rateLimit) {
      return false;
    }
    limit.count++;
    return true;
  }
  getStats() {
    return {
      routes: this.routes.size,
      middleware: this.middleware.length,
      rateLimitEntries: this.rateLimiter.size,
      config: this.config,
    };
  }
};
EnterpriseGateway = __decorateClass([singleton()], EnterpriseGateway);
var gateway_default = EnterpriseGateway;
export { EnterpriseGateway, gateway_default as default };
