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
import { randomUUID } from 'crypto';
import MessageBus from './bus-interface.js';
function makeEnvelope(channel, message, nodeId) {
  if (message && typeof message === 'object' && message.channel && message.timestamp) {
    return message;
  }
  return {
    id: randomUUID(),
    channel,
    message,
    nodeId,
    timestamp: /* @__PURE__ */ new Date().toISOString(),
  };
}
let KafkaMessageBus = class extends MessageBus {
  constructor(config = {}) {
    super();
    this.config = config;
    this.nodeId = config.nodeId || `kafka-node-${randomUUID().slice(0, 8)}`;
    this.kafka = config.kafka || null;
    this.producer = config.producer || null;
    this.consumerFactory = config.consumerFactory || null;
    this.consumers = /* @__PURE__ */ new Map();
    this.connected = false;
    this.stats = {
      published: 0,
      delivered: 0,
      errors: 0,
    };
  }
  async connect() {
    if (!this.producer || !this.consumerFactory) {
      const { Kafka } = await import('kafkajs');
      this.kafka =
        this.kafka ||
        new Kafka({
          clientId: this.config.clientId || 'ultra-dex',
          brokers: this.config.brokers || ['127.0.0.1:9092'],
        });
      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.consumerFactory = (groupId) => this.kafka.consumer({ groupId });
    } else if (typeof this.producer.connect === 'function') {
      await this.producer.connect();
    }
    this.connected = true;
  }
  async disconnect() {
    for (const consumer of this.consumers.values()) {
      if (typeof consumer.disconnect === 'function') {
        await consumer.disconnect();
      }
    }
    this.consumers.clear();
    if (typeof this.producer?.disconnect === 'function') {
      await this.producer.disconnect();
    }
    this.connected = false;
  }
  async publish(channel, message) {
    if (!this.connected) {
      throw new Error('Message bus is not connected');
    }
    const envelope = makeEnvelope(channel, message, this.nodeId);
    await this.producer.send({
      topic: channel,
      messages: [{ key: envelope.id, value: JSON.stringify(envelope) }],
    });
    this.stats.published++;
    return envelope;
  }
  async subscribe(channel, handler) {
    if (!this.connected) {
      throw new Error('Message bus is not connected');
    }
    const consumer = this.consumerFactory(
      `${this.config.groupIdPrefix || 'ultra-dex'}-${channel}-${this.nodeId}`
    );
    if (typeof consumer.connect === 'function') {
      await consumer.connect();
    }
    if (typeof consumer.subscribe === 'function') {
      await consumer.subscribe({ topic: channel, fromBeginning: false });
    }
    if (typeof consumer.run === 'function') {
      await consumer.run({
        eachMessage: async ({ message }) => {
          const parsed = JSON.parse(String(message.value));
          this.stats.delivered++;
          await handler(makeEnvelope(channel, parsed, this.nodeId));
        },
      });
    }
    this.consumers.set(channel, consumer);
    return async () => {
      if (typeof consumer.disconnect === 'function') {
        await consumer.disconnect();
      }
      this.consumers.delete(channel);
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
        replyChannel,
      });
    });
  }
  async broadcast(event, payload) {
    return await this.publish(`broadcast:${event}`, { event, payload });
  }
  getStats() {
    return {
      type: 'kafka',
      connected: this.connected,
      nodeId: this.nodeId,
      published: this.stats.published,
      delivered: this.stats.delivered,
      errors: this.stats.errors,
      consumers: this.consumers.size,
    };
  }
};
KafkaMessageBus = __decorateClass([singleton()], KafkaMessageBus);
var kafka_adapter_default = KafkaMessageBus;
export { KafkaMessageBus, kafka_adapter_default as default };
