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
let ContextManager = class {
  constructor(options = {}) {
    this.maxContextSize = options.maxContextSize || 32e3;
    this.contexts = /* @__PURE__ */ new Map();
    this.compressionThreshold = options.compressionThreshold || 0.8;
  }
  async createContext(sessionId, initialData = {}) {
    const context = {
      id: sessionId,
      messages: [],
      variables: /* @__PURE__ */ new Map(),
      metadata: initialData,
      created: /* @__PURE__ */ new Date(),
      lastAccessed: /* @__PURE__ */ new Date(),
      tokenCount: 0
    };
    this.contexts.set(sessionId, context);
    return context;
  }
  async addMessage(sessionId, message) {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error(`Context not found: ${sessionId}`);
    }
    context.messages.push({
      ...message,
      timestamp: /* @__PURE__ */ new Date(),
      id: this.generateMessageId()
    });
    context.lastAccessed = /* @__PURE__ */ new Date();
    context.tokenCount += this.estimateTokens(message.content || "");
    if (context.tokenCount > this.maxContextSize * this.compressionThreshold) {
      await this.compressContext(sessionId);
    }
    return context;
  }
  async getContext(sessionId) {
    const context = this.contexts.get(sessionId);
    if (context) {
      context.lastAccessed = /* @__PURE__ */ new Date();
    }
    return context;
  }
  async compressContext(sessionId) {
    const context = this.contexts.get(sessionId);
    if (!context)
      return;
    const recentMessages = context.messages.slice(-10);
    const olderMessages = context.messages.slice(0, -10);
    if (olderMessages.length > 0) {
      const summary = {
        role: "system",
        content: `[Compressed ${olderMessages.length} previous messages from this conversation]`,
        timestamp: /* @__PURE__ */ new Date(),
        id: this.generateMessageId(),
        compressed: true
      };
      context.messages = [summary, ...recentMessages];
      context.tokenCount = this.estimateTokens(summary.content) + recentMessages.reduce((sum, msg) => sum + this.estimateTokens(msg.content || ""), 0);
    }
  }
  async setVariable(sessionId, key, value) {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error(`Context not found: ${sessionId}`);
    }
    context.variables.set(key, value);
    context.lastAccessed = /* @__PURE__ */ new Date();
    return context;
  }
  async getVariable(sessionId, key) {
    const context = this.contexts.get(sessionId);
    if (!context)
      return void 0;
    context.lastAccessed = /* @__PURE__ */ new Date();
    return context.variables.get(key);
  }
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  async cleanup(maxAge = 24 * 60 * 60 * 1e3) {
    const cutoff = new Date(Date.now() - maxAge);
    const toDelete = [];
    for (const [sessionId, context] of this.contexts) {
      if (context.lastAccessed < cutoff) {
        toDelete.push(sessionId);
      }
    }
    for (const sessionId of toDelete) {
      this.contexts.delete(sessionId);
    }
    return toDelete.length;
  }
  getStats() {
    return {
      totalContexts: this.contexts.size,
      totalTokens: Array.from(this.contexts.values()).reduce((sum, ctx) => sum + ctx.tokenCount, 0),
      averageContextSize: this.contexts.size > 0 ? Array.from(this.contexts.values()).reduce((sum, ctx) => sum + ctx.tokenCount, 0) / this.contexts.size : 0
    };
  }
};
ContextManager = __decorateClass([
  singleton()
], ContextManager);
var context_default = ContextManager;
export {
  ContextManager,
  context_default as default
};
