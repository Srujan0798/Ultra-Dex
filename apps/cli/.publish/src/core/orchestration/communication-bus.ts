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
import { createBus, getBusHealth } from '../mesh/index.js';
let AgentCommunicationBus = class {
  constructor(config = {}) {
    this.config = {
      mesh: config.mesh !== false,
      busType: config.mesh === false ? 'memory' : config.busType || 'memory',
      namespace: config.namespace || 'ultra-dex-agent-mesh',
      maxHistory: config.maxHistory || 1e3,
      nodeId: config.nodeId || `mesh-node-${randomUUID().slice(0, 8)}`,
      ...config,
    };
    this.localSubscribers = /* @__PURE__ */ new Map();
    this.channelBindings = /* @__PURE__ */ new Map();
    this.messages = [];
    this.maxHistory = this.config.maxHistory;
    this.isConnected = false;
    this.messageBus = config.messageBus || null;
    this.meshAgents = /* @__PURE__ */ new Map();
    this.pendingChannelSubscriptions = /* @__PURE__ */ new Map();
    this.stats = {
      published: 0,
      delivered: 0,
      errors: 0,
      lastLatencyMs: 0,
    };
  }
  async initialize() {
    if (!this.messageBus) {
      this.messageBus = createBus(this.config.busType, this.config);
    }
    await this.messageBus.connect();
    this.isConnected = true;
    await this.ensureChannelSubscription('agent.online');
    await this.ensureChannelSubscription('agent.offline');
    await this.ensureChannelSubscription('mesh.agents.snapshot');
    process.stdout.write(
      `\u{1F4E1} Agent Communication Bus initialized (${this.config.busType}${this.config.mesh === false ? ', local' : ', mesh'})
`
    );
  }
  async ensureChannelSubscription(channel) {
    if (!this.isConnected || this.channelBindings.has(channel)) {
      return;
    }
    if (this.pendingChannelSubscriptions.has(channel)) {
      await this.pendingChannelSubscriptions.get(channel);
      return;
    }
    const subscriptionPromise = this.messageBus.subscribe(channel, async (transportEnvelope) => {
      const startedAt = Date.now();
      const envelope =
        transportEnvelope?.message?.channel && transportEnvelope?.message?.id
          ? transportEnvelope.message
          : {
              id: transportEnvelope?.id || randomUUID(),
              channel,
              message: transportEnvelope?.message ?? transportEnvelope,
              metadata: transportEnvelope?.metadata || {},
              timestamp: transportEnvelope?.timestamp || /* @__PURE__ */ new Date().toISOString(),
              originNode: transportEnvelope?.nodeId || null,
            };
      this.messages.push(envelope);
      if (this.messages.length > this.maxHistory) {
        this.messages.shift();
      }
      if (channel === 'agent.online') {
        this.recordAgentOnline(envelope.message);
      } else if (channel === 'agent.offline') {
        this.recordAgentOffline(envelope.message);
      } else if (channel === 'mesh.agents.snapshot') {
        this.recordAgentSnapshot(envelope.message);
      }
      const subscribers = this.localSubscribers.get(channel);
      if (!subscribers) {
        return;
      }
      for (const handler of subscribers) {
        try {
          await handler(envelope);
          this.stats.delivered++;
          this.stats.lastLatencyMs = Date.now() - startedAt;
        } catch (error) {
          this.stats.errors++;
          process.stderr.write(
            `Error in subscriber handler for channel ${channel}: ${error.message}
`
          );
        }
      }
    });
    this.pendingChannelSubscriptions.set(channel, subscriptionPromise);
    try {
      const unsubscribe = await subscriptionPromise;
      this.channelBindings.set(channel, unsubscribe);
    } finally {
      this.pendingChannelSubscriptions.delete(channel);
    }
  }
  recordAgentOnline(agent) {
    if (!agent?.id) {
      return;
    }
    this.meshAgents.set(agent.id, {
      ...agent,
      status: agent.status || 'online',
      lastSeenAt: agent.timestamp || /* @__PURE__ */ new Date().toISOString(),
    });
  }
  recordAgentOffline(agent) {
    if (!agent?.id) {
      return;
    }
    const existing = this.meshAgents.get(agent.id) || { id: agent.id };
    this.meshAgents.set(agent.id, {
      ...existing,
      ...agent,
      status: 'offline',
      lastSeenAt: agent.timestamp || /* @__PURE__ */ new Date().toISOString(),
    });
  }
  recordAgentSnapshot(snapshot) {
    if (!Array.isArray(snapshot?.agents)) {
      return;
    }
    for (const agent of snapshot.agents) {
      this.recordAgentOnline({
        ...agent,
        nodeId: snapshot.nodeId || agent.nodeId,
      });
    }
  }
  /**
   * Subscribe to a channel
   */
  subscribe(channel, handler) {
    if (!this.localSubscribers.has(channel)) {
      this.localSubscribers.set(channel, /* @__PURE__ */ new Set());
    }
    this.localSubscribers.get(channel).add(handler);
    void this.ensureChannelSubscription(channel);
    return () => this.unsubscribe(channel, handler);
  }
  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel, handler) {
    const subscribers = this.localSubscribers.get(channel);
    if (subscribers) {
      subscribers.delete(handler);
      if (subscribers.size === 0) {
        this.localSubscribers.delete(channel);
      }
    }
  }
  /**
   * Publish a message to a channel
   */
  async publish(channel, message, metadata = {}) {
    if (!this.isConnected) {
      throw new Error('Communication bus is not connected');
    }
    await this.ensureChannelSubscription(channel);
    const envelope = {
      id: randomUUID(),
      channel,
      message,
      metadata,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      originNode: this.config.nodeId,
    };
    const startedAt = Date.now();
    await this.messageBus.publish(channel, envelope);
    this.stats.published++;
    this.stats.lastLatencyMs = Date.now() - startedAt;
    return envelope.id;
  }
  async routeTask(task, agentId, metadata = {}) {
    const taskEnvelope = {
      agentId,
      task,
      metadata,
      routedAt: /* @__PURE__ */ new Date().toISOString(),
    };
    const messageId = await this.publish(`agent.${agentId}.task`, taskEnvelope, {
      route: 'direct',
      agentId,
      ...metadata,
    });
    return {
      messageId,
      channel: `agent.${agentId}.task`,
      agentId,
    };
  }
  discoverAgents() {
    return Array.from(this.meshAgents.values());
  }
  /**
   * Get message history for a channel
   */
  getChannelHistory(channel, limit = 50) {
    return this.messages.filter((msg) => msg.channel === channel).slice(-limit);
  }
  /**
   * Get all channels
   */
  getChannels() {
    return Array.from(
      /* @__PURE__ */ new Set([...this.localSubscribers.keys(), ...this.channelBindings.keys()])
    );
  }
  /**
   * Get subscriber count for a channel
   */
  getSubscriberCount(channel) {
    const subscribers = this.localSubscribers.get(channel);
    return subscribers ? subscribers.size : 0;
  }
  getMeshStats() {
    return {
      knownAgents: this.meshAgents.size,
      messageLatencyMs: this.stats.lastLatencyMs,
      localChannels: this.getChannels().length,
      ...getBusHealth(this.messageBus),
    };
  }
  async shutdown() {
    this.isConnected = false;
    for (const unsubscribe of this.channelBindings.values()) {
      await unsubscribe?.();
    }
    this.channelBindings.clear();
    this.localSubscribers.clear();
    this.messages = [];
    this.meshAgents.clear();
    await this.messageBus?.disconnect?.();
  }
};
AgentCommunicationBus = __decorateClass([singleton()], AgentCommunicationBus);
export { AgentCommunicationBus };
