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
function normalizeEnvelope(channel, raw, nodeId) {
  if (raw && typeof raw === "object" && raw.channel && raw.timestamp) {
    return raw;
  }
  return {
    id: randomUUID(),
    channel,
    message: raw,
    nodeId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
let RedisMessageBus = class extends MessageBus {
  constructor(config = {}) {
    super();
    this.config = config;
    this.nodeId = config.nodeId || `redis-node-${randomUUID().slice(0, 8)}`;
    this.publisher = config.publisher || null;
    this.subscriber = config.subscriber || null;
    this.streamClient = config.streamClient || null;
    this.connected = false;
    this.messageHandlers = /* @__PURE__ */ new Map();
    this.stats = {
      published: 0,
      delivered: 0,
      errors: 0
    };
  }
  async connect() {
    if (!this.publisher || !this.subscriber) {
      const { default: Redis } = await import("ioredis");
      const connection = this.config.url || this.config.redisUrl || "redis://127.0.0.1:6379";
      this.publisher = new Redis(connection, this.config.redisOptions || {});
      this.subscriber = new Redis(connection, this.config.redisOptions || {});
      this.streamClient = this.streamClient || this.publisher;
    }
    if (typeof this.publisher.connect === "function") {
      await this.publisher.connect();
    }
    if (typeof this.subscriber.connect === "function" && this.subscriber !== this.publisher) {
      await this.subscriber.connect();
    }
    if (typeof this.subscriber.on === "function") {
      this.subscriber.on("message", (channel, payload) => {
        const handler = this.messageHandlers.get(channel);
        if (!handler) {
          return;
        }
        const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
        handler(normalizeEnvelope(channel, parsed, this.nodeId)).catch(() => {
          this.stats.errors++;
        });
      });
    }
    this.connected = true;
  }
  async disconnect() {
    if (typeof this.publisher?.quit === "function") {
      await this.publisher.quit();
    }
    if (this.subscriber !== this.publisher && typeof this.subscriber?.quit === "function") {
      await this.subscriber.quit();
    }
    this.connected = false;
  }
  async publish(channel, message) {
    if (!this.connected) {
      throw new Error("Message bus is not connected");
    }
    const envelope = normalizeEnvelope(channel, message, this.nodeId);
    const serialized = JSON.stringify(envelope);
    if (typeof this.streamClient?.xadd === "function") {
      await this.streamClient.xadd(
        `stream:${channel}`,
        "*",
        "payload",
        serialized
      );
    }
    await this.publisher.publish(channel, serialized);
    this.stats.published++;
    return envelope;
  }
  async subscribe(channel, handler) {
    if (!this.connected) {
      throw new Error("Message bus is not connected");
    }
    this.messageHandlers.set(channel, async (envelope) => {
      this.stats.delivered++;
      await handler(envelope);
    });
    if (this.subscriber.subscribe.length >= 2) {
      await this.subscriber.subscribe(channel, async (payload) => {
        const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
        await handler(normalizeEnvelope(channel, parsed, this.nodeId));
      });
    } else {
      await this.subscriber.subscribe(channel);
    }
    return async () => {
      this.messageHandlers.delete(channel);
      if (typeof this.subscriber.unsubscribe === "function") {
        await this.subscriber.unsubscribe(channel);
      }
    };
  }
  async request(channel, message, timeout = 5e3) {
    const requestId = randomUUID();
    const replyChannel = `${channel}.reply.${requestId}`;
    return await new Promise(async (resolve, reject) => {
      const timer = setTimeout(async () => {
        await unsubscribe?.();
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);
      let unsubscribe = null;
      unsubscribe = await this.subscribe(replyChannel, async (envelope) => {
        clearTimeout(timer);
        await unsubscribe?.();
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
    return await this.publish(`broadcast:${event}`, { event, payload });
  }
  getStats() {
    return {
      type: "redis",
      connected: this.connected,
      nodeId: this.nodeId,
      published: this.stats.published,
      delivered: this.stats.delivered,
      errors: this.stats.errors
    };
  }
};
RedisMessageBus = __decorateClass([
  singleton()
], RedisMessageBus);
var redis_adapter_default = RedisMessageBus;
export {
  RedisMessageBus,
  redis_adapter_default as default
};
