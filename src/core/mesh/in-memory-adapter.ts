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
import { randomUUID } from "crypto";
import MessageBus from './bus-interface.js';
const HUBS = /* @__PURE__ */ new Map();
function getHub(namespace) {
  if (!HUBS.has(namespace)) {
    HUBS.set(namespace, {
      channels: /* @__PURE__ */ new Map(),
      history: [],
      maxHistory: 2e3,
      metrics: {
        published: 0,
        delivered: 0
      }
    });
  }
  return HUBS.get(namespace);
}
function makeEnvelope(channel, message, nodeId) {
  return {
    id: randomUUID(),
    channel,
    message,
    nodeId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
let InMemoryMessageBus = class extends MessageBus {
  constructor(config = {}) {
    super();
    this.namespace = config.namespace || "ultra-dex";
    this.nodeId = config.nodeId || `memory-node-${randomUUID().slice(0, 8)}`;
    this.connected = false;
    this.hub = getHub(this.namespace);
    this.subscriptions = /* @__PURE__ */ new Map();
    this.stats = {
      published: 0,
      delivered: 0,
      errors: 0,
      lastLatencyMs: 0
    };
  }
  async connect() {
    this.connected = true;
  }
  async disconnect() {
    for (const unsubscribe of this.subscriptions.values()) {
      unsubscribe();
    }
    this.subscriptions.clear();
    this.connected = false;
  }
  async publish(channel, message) {
    if (!this.connected) {
      throw new Error("Message bus is not connected");
    }
    const envelope = makeEnvelope(channel, message, this.nodeId);
    this.stats.published++;
    this.hub.metrics.published++;
    this.hub.history.push(envelope);
    if (this.hub.history.length > this.hub.maxHistory) {
      this.hub.history.shift();
    }
    const subscribers = this.hub.channels.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return envelope;
    }
    for (const handler of subscribers) {
      const startedAt = Date.now();
      try {
        await handler(envelope);
        const latencyMs = Date.now() - startedAt;
        this.stats.delivered++;
        this.stats.lastLatencyMs = latencyMs;
        this.hub.metrics.delivered++;
      } catch {
        this.stats.errors++;
      }
    }
    return envelope;
  }
  async subscribe(channel, handler) {
    if (!this.connected) {
      throw new Error("Message bus is not connected");
    }
    if (!this.hub.channels.has(channel)) {
      this.hub.channels.set(channel, /* @__PURE__ */ new Set());
    }
    const subscribers = this.hub.channels.get(channel);
    subscribers.add(handler);
    const unsubscribe = () => {
      subscribers.delete(handler);
      if (subscribers.size === 0) {
        this.hub.channels.delete(channel);
      }
    };
    this.subscriptions.set(`${channel}:${this.subscriptions.size + 1}`, unsubscribe);
    return unsubscribe;
  }
  async request(channel, message, timeout = 5e3) {
    const requestId = randomUUID();
    const replyChannel = `${channel}.reply.${requestId}`;
    return await new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        if (unsubscribe) {
          unsubscribe();
        }
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);
      let unsubscribe = null;
      unsubscribe = await this.subscribe(replyChannel, async (envelope) => {
        clearTimeout(timer);
        unsubscribe?.();
        resolve(envelope.message);
      });
      await this.publish(channel, {
        ...message,
        requestId,
        replyChannel
      });
    });
  }
  async broadcast(event, payload) {
    return await this.publish(`broadcast:${event}`, {
      event,
      payload
    });
  }
  getStats() {
    return {
      type: "memory",
      namespace: this.namespace,
      nodeId: this.nodeId,
      connected: this.connected,
      channels: this.hub.channels.size,
      historySize: this.hub.history.length,
      published: this.stats.published,
      delivered: this.stats.delivered,
      errors: this.stats.errors,
      lastLatencyMs: this.stats.lastLatencyMs
    };
  }
};
InMemoryMessageBus = __decorateClass([
  singleton()
], InMemoryMessageBus);
var in_memory_adapter_default = InMemoryMessageBus;
export {
  InMemoryMessageBus,
  in_memory_adapter_default as default
};
