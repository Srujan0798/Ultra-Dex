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
import { DI_TOKENS } from '../di/tokens.js';
let DistributedAgentMesh = class extends EventEmitter {
  constructor(logger, config, bus) {
    super();
    this.logger = logger;
    this.config = config;
    this.bus = bus;
    this.localNodeId = this.config.get("mesh.nodeId", `node-${process.pid}`);
  }
  nodes = /* @__PURE__ */ new Map();
  localNodeId;
  heartbeatInterval = null;
  bus;
  async initialize() {
    this.logger.info("Initializing DistributedAgentMesh", { nodeId: this.localNodeId });
    this.bus.subscribe("mesh.node.heartbeat", this.handleHeartbeat.bind(this));
    this.bus.subscribe("mesh.node.offline", this.handleNodeOffline.bind(this));
    this.bus.subscribe("mesh.task.route", this.handleTaskRoute.bind(this));
    const interval = this.config.get("mesh.heartbeatInterval", 5e3);
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), interval);
    await this.sendHeartbeat();
    this.logger.info("DistributedAgentMesh initialized");
  }
  /**
   * Route task to best available node
   */
  async routeTask(task) {
    const candidates = this.findCapableNodes(task.requiredCapabilities);
    if (candidates.length === 0) {
      this.logger.warn("No capable nodes found for task", {
        taskId: task.id,
        requiredCapabilities: task.requiredCapabilities
      });
      return { nodeId: "", accepted: false };
    }
    const bestNode = candidates.sort((a, b) => {
      const scoreA = a.load * a.latency;
      const scoreB = b.load * b.latency;
      return scoreA - scoreB;
    })[0];
    await this.bus.publish("mesh.task.route", {
      ...task,
      targetNode: bestNode.id
    });
    this.logger.debug("Task routed to node", {
      taskId: task.id,
      nodeId: bestNode.id,
      region: bestNode.region
    });
    return { nodeId: bestNode.id, accepted: true };
  }
  /**
   * Find nodes with required capabilities
   */
  findCapableNodes(requiredCapabilities) {
    return Array.from(this.nodes.values()).filter((node) => {
      if (!node.healthy)
        return false;
      return node.load < 0.9;
    });
  }
  /**
   * Get nearest node by region
   */
  getNearestNode(region) {
    const candidates = Array.from(this.nodes.values()).filter((n) => n.healthy);
    if (region) {
      const regional = candidates.filter((n) => n.region === region);
      if (regional.length > 0) {
        return regional.sort((a, b) => a.latency - b.latency)[0];
      }
    }
    return candidates.sort((a, b) => a.latency - b.latency)[0] || null;
  }
  /**
   * Get mesh statistics
   */
  getStats() {
    const nodes = Array.from(this.nodes.values());
    const healthy = nodes.filter((n) => n.healthy);
    return {
      totalNodes: nodes.length,
      healthyNodes: healthy.length,
      totalAgents: nodes.reduce((sum, n) => sum + n.agents.length, 0),
      averageLoad: healthy.reduce((sum, n) => sum + n.load, 0) / (healthy.length || 1),
      averageLatency: healthy.reduce((sum, n) => sum + n.latency, 0) / (healthy.length || 1)
    };
  }
  async sendHeartbeat() {
    const heartbeat = {
      nodeId: this.localNodeId,
      region: this.config.get("mesh.region", "default"),
      agents: [],
      // Would be populated from local registry
      load: process.memoryUsage().heapUsed / (1024 * 1024 * 1024),
      // GB
      latency: 0,
      // Local latency is 0
      timestamp: /* @__PURE__ */ new Date()
    };
    await this.bus.publish("mesh.node.heartbeat", heartbeat);
  }
  handleHeartbeat(envelope) {
    const node = envelope.message;
    this.nodes.set(node.id, {
      ...node,
      lastHeartbeat: /* @__PURE__ */ new Date(),
      healthy: true
    });
    this.emit("node:online", node);
  }
  handleNodeOffline(envelope) {
    const { nodeId } = envelope.message;
    const node = this.nodes.get(nodeId);
    if (node) {
      node.healthy = false;
      this.nodes.set(nodeId, node);
      this.emit("node:offline", node);
      this.logger.warn(`Node ${nodeId} marked as offline`);
    }
  }
  handleTaskRoute(envelope) {
    const task = envelope.message;
    if (task.targetNode === this.localNodeId) {
      this.emit("task:received", task);
    }
  }
  /**
   * Prune stale nodes
   */
  pruneStaleNodes() {
    const now = Date.now();
    const timeout = this.config.get("mesh.nodeTimeout", 3e4);
    for (const [nodeId, node] of this.nodes) {
      if (now - node.lastHeartbeat.getTime() > timeout) {
        node.healthy = false;
        this.nodes.set(nodeId, node);
        this.logger.warn(`Node ${nodeId} timed out`);
      }
    }
  }
  async shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    await this.bus.publish("mesh.node.offline", { nodeId: this.localNodeId });
    this.logger.info("DistributedAgentMesh shutdown");
  }
};
DistributedAgentMesh = __decorateClass([
  singleton(),
  __decorateParam(0, inject(DI_TOKENS.Logger)),
  __decorateParam(1, inject(DI_TOKENS.ConfigService)),
  __decorateParam(2, inject(DI_TOKENS.MessageBus))
], DistributedAgentMesh);
export {
  DistributedAgentMesh
};
