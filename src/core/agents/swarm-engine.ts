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
let SwarmEngine = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.agents = /* @__PURE__ */ new Map();
    this.swarms = /* @__PURE__ */ new Map();
    this.metrics = /* @__PURE__ */ new Map();
    this.config = {
      maxSwarmSize: options.maxSwarmSize || 50,
      autoRebalance: options.autoRebalance !== false,
      healthCheckInterval: options.healthCheckInterval || 5e3,
      communicationTimeout: options.communicationTimeout || 1e4,
      ...options
    };
    this.state = "idle";
    this.loadBalancer = new LoadBalancer();
    this.healthChecker = null;
  }
  /**
   * Initialize swarm engine
   */
  async initialize() {
    this.state = "initializing";
    this.emit("swarm-engine.initializing");
    this.startHealthChecks();
    this.state = "ready";
    this.emit("swarm-engine.ready");
    return this;
  }
  /**
   * Create a new swarm
   */
  createSwarm(swarmId, agents = [], options = {}) {
    if (this.swarms.has(swarmId)) {
      throw new Error(`Swarm ${swarmId} already exists`);
    }
    if (agents.length > this.config.maxSwarmSize) {
      throw new Error(
        `Swarm size ${agents.length} exceeds maximum ${this.config.maxSwarmSize}`
      );
    }
    const swarm = {
      id: swarmId,
      agents: new Map(agents.map((a) => [a.id, a])),
      status: "created",
      createdAt: Date.now(),
      strategy: options.strategy || "consensus",
      metadata: options.metadata || {},
      taskQueue: [],
      executingTasks: /* @__PURE__ */ new Map(),
      metrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        averageLatency: 0,
        successRate: 0
      }
    };
    this.swarms.set(swarmId, swarm);
    agents.forEach((agent) => this.registerAgentToSwarm(agent, swarmId));
    this.emit("swarm.created", { swarmId, agentCount: agents.length });
    return swarm;
  }
  /**
   * Add agent to swarm
   */
  registerAgentToSwarm(agent, swarmId) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) {
      throw new Error(`Swarm ${swarmId} not found`);
    }
    if (swarm.agents.size >= this.config.maxSwarmSize) {
      throw new Error(`Swarm ${swarmId} is at maximum capacity`);
    }
    swarm.agents.set(agent.id, agent);
    this.agents.set(agent.id, { swarmId, agent, status: "active" });
    this.setupAgentListeners(agent, swarmId);
    this.emit("agent.registered-to-swarm", { agentId: agent.id, swarmId });
    return swarm;
  }
  /**
   * Setup event listeners for agent
   */
  setupAgentListeners(agent, swarmId) {
    agent.on("task-complete", (data) => {
      this.handleAgentTaskComplete(agent.id, swarmId, data);
    });
    agent.on("task-error", (data) => {
      this.handleAgentTaskError(agent.id, swarmId, data);
    });
    agent.on("state-change", (data) => {
      this.emit("agent.state-changed", { agentId: agent.id, swarmId, ...data });
    });
  }
  /**
   * Execute task in swarm using specified strategy
   */
  async executeInSwarm(swarmId, task, options = {}) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) {
      throw new Error(`Swarm ${swarmId} not found`);
    }
    const strategy = options.strategy || swarm.strategy;
    const executionId = this.generateId();
    this.emit("task.swarm-execution.started", { swarmId, taskId: executionId });
    try {
      let result;
      if (strategy === "consensus") {
        result = await this.executeWithConsensus(swarmId, task);
      } else if (strategy === "hierarchical") {
        result = await this.executeHierarchical(swarmId, task);
      } else if (strategy === "broadcast") {
        result = await this.executeBroadcast(swarmId, task);
      } else if (strategy === "tournament") {
        result = await this.executeTournament(swarmId, task);
      } else {
        throw new Error(`Unknown execution strategy: ${strategy}`);
      }
      swarm.metrics.tasksCompleted++;
      this.emit("task.swarm-execution.completed", { swarmId, taskId: executionId, result });
      return result;
    } catch (error) {
      swarm.metrics.tasksFailed++;
      this.emit("task.swarm-execution.error", { swarmId, taskId: executionId, error });
      throw error;
    }
  }
  /**
   * Consensus-based execution
   */
  async executeWithConsensus(swarmId, task) {
    const swarm = this.swarms.get(swarmId);
    const agents = Array.from(swarm.agents.values());
    const results = await Promise.allSettled(
      agents.map((agent) => this.executeWithTimeout(agent, task))
    );
    const successful = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    if (successful.length === 0) {
      throw new Error("All agents failed to execute task");
    }
    return this.aggregateResults(successful);
  }
  /**
   * Hierarchical execution (select best agent)
   */
  async executeHierarchical(swarmId, task) {
    const swarm = this.swarms.get(swarmId);
    const agents = Array.from(swarm.agents.values());
    const sortedAgents = this.loadBalancer.rankAgents(agents);
    const bestAgent = sortedAgents[0];
    if (!bestAgent) {
      throw new Error(`No available agents in swarm ${swarmId}`);
    }
    return await this.executeWithTimeout(bestAgent, task);
  }
  /**
   * Broadcast execution to all agents
   */
  async executeBroadcast(swarmId, task) {
    const swarm = this.swarms.get(swarmId);
    const agents = Array.from(swarm.agents.values());
    const results = await Promise.allSettled(
      agents.map((agent) => this.executeWithTimeout(agent, task))
    );
    return results.map((r, idx) => ({
      agent: agents[idx].id,
      success: r.status === "fulfilled",
      result: r.status === "fulfilled" ? r.value : r.reason
    }));
  }
  /**
   * Tournament-based execution (best n agents compete)
   */
  async executeTournament(swarmId, task) {
    const swarm = this.swarms.get(swarmId);
    const agents = Array.from(swarm.agents.values());
    const tournamentSize = Math.ceil(agents.length / 2);
    const results = await Promise.allSettled(
      agents.slice(0, tournamentSize).map((agent) => this.executeWithTimeout(agent, task))
    );
    const successful = results.map((r, idx) => ({
      agent: agents[idx],
      result: r.value,
      success: r.status === "fulfilled"
    })).filter((r) => r.success).sort((a, b) => (b.result?.score || 0) - (a.result?.score || 0));
    if (successful.length === 0) {
      throw new Error("No agents won the tournament");
    }
    return successful[0].result;
  }
  /**
   * Execute task with timeout
   */
  async executeWithTimeout(agent, task, timeout = this.config.communicationTimeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task execution timeout for agent ${agent.id}`));
      }, timeout);
      agent.execute(task).then((result) => {
        clearTimeout(timer);
        resolve(result);
      }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    this.healthChecker = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }
  /**
   * Perform health checks on all agents
   */
  async performHealthChecks() {
    const checkPromises = [];
    for (const [agentId, agentInfo] of this.agents) {
      checkPromises.push(
        this.checkAgentHealth(agentInfo.agent).then((healthy) => ({
          agentId,
          healthy,
          timestamp: Date.now()
        })).catch(() => ({
          agentId,
          healthy: false,
          timestamp: Date.now()
        }))
      );
    }
    const results = await Promise.all(checkPromises);
    results.forEach((result) => {
      if (!result.healthy) {
        this.handleUnhealthyAgent(result.agentId);
      }
    });
    if (this.config.autoRebalance) {
      this.rebalanceSwarms();
    }
  }
  /**
   * Check individual agent health
   */
  async checkAgentHealth(agent) {
    try {
      const response = await Promise.race([
        agent.execute({ type: "health-check", data: {} }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Health check timeout")), 2e3)
        )
      ]);
      return response && response.healthy !== false;
    } catch {
      return false;
    }
  }
  /**
   * Handle unhealthy agent
   */
  handleUnhealthyAgent(agentId) {
    const agentInfo = this.agents.get(agentId);
    if (agentInfo) {
      agentInfo.status = "unhealthy";
      this.emit("agent.unhealthy", { agentId, swarmId: agentInfo.swarmId });
      if (this.config.removeUnhealthy) {
        this.removeAgentFromSwarm(agentId);
      }
    }
  }
  /**
   * Rebalance tasks across healthy swarms
   */
  rebalanceSwarms() {
    for (const [swarmId, swarm] of this.swarms) {
      const healthyAgents = Array.from(swarm.agents.values()).filter(
        (a) => this.agents.get(a.id)?.status === "active"
      );
      if (healthyAgents.length === 0 && swarm.taskQueue.length > 0) {
        this.emit("swarm.no-healthy-agents", { swarmId });
      }
    }
  }
  /**
   * Remove agent from swarm
   */
  removeAgentFromSwarm(agentId) {
    const agentInfo = this.agents.get(agentId);
    if (!agentInfo)
      return;
    const swarm = this.swarms.get(agentInfo.swarmId);
    if (swarm) {
      swarm.agents.delete(agentId);
      this.emit("agent.removed-from-swarm", { agentId, swarmId: agentInfo.swarmId });
    }
    this.agents.delete(agentId);
  }
  /**
   * Aggregate results from multiple agents
   */
  aggregateResults(results) {
    if (results.length === 0)
      return null;
    if (results.length === 1)
      return results[0];
    if (Array.isArray(results[0])) {
      return results.flat();
    }
    if (typeof results[0] === "number") {
      return results.reduce((a, b) => a + b) / results.length;
    }
    return Object.assign({}, ...results);
  }
  /**
   * Handle agent task completion
   */
  handleAgentTaskComplete(agentId, swarmId, data) {
    this.emit("swarm.agent-task-complete", { agentId, swarmId, data });
  }
  /**
   * Handle agent task error
   */
  handleAgentTaskError(agentId, swarmId, data) {
    this.emit("swarm.agent-task-error", { agentId, swarmId, data });
  }
  /**
   * Get swarm statistics
   */
  getSwarmStats(swarmId) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm)
      return null;
    return {
      id: swarmId,
      agentCount: swarm.agents.size,
      healthyAgents: Array.from(swarm.agents.values()).filter(
        (a) => this.agents.get(a.id)?.status === "active"
      ).length,
      metrics: swarm.metrics,
      strategy: swarm.strategy,
      createdAt: swarm.createdAt
    };
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Shutdown swarm engine
   */
  async shutdown() {
    if (this.healthChecker) {
      clearInterval(this.healthChecker);
    }
    for (const [swarmId, swarm] of this.swarms) {
      for (const agent of swarm.agents.values()) {
        if (agent.shutdown) {
          await agent.shutdown();
        }
      }
    }
    this.state = "shutdown";
    this.emit("swarm-engine.shutdown");
  }
};
SwarmEngine = __decorateClass([
  singleton()
], SwarmEngine);
class LoadBalancer {
  constructor() {
    this.agentMetrics = /* @__PURE__ */ new Map();
  }
  rankAgents(agents) {
    return agents.sort((a, b) => {
      const scoreA = this.calculateAgentScore(a);
      const scoreB = this.calculateAgentScore(b);
      return scoreB - scoreA;
    });
  }
  calculateAgentScore(agent) {
    let score = 100;
    if (agent.state !== "ready")
      score -= 50;
    if (agent.capabilities && agent.capabilities.length > 0) {
      score += agent.capabilities.length * 5;
    }
    return score;
  }
}
var swarm_engine_default = SwarmEngine;
export {
  SwarmEngine,
  swarm_engine_default as default
};
