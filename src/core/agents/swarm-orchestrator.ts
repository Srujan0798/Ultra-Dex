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
let SwarmOrchestrator = class extends EventEmitter {
  /**
   * Create a new swarm orchestrator
   * @param {Array<Object>} [agents=[]] - Initial agents (can be objects or class instances)
   */
  constructor(agents = []) {
    super();
    this.agents = agents;
    this.results = /* @__PURE__ */ new Map();
    this.errors = [];
  }
  /**
   * Add an agent to the swarm
   * @param {Object} agent - Agent to add
   * @returns {SwarmOrchestrator} this (for chaining)
   */
  addAgent(agent) {
    this.agents.push(agent);
    return this;
  }
  /**
   * Run all agents in parallel on the same task
   * @param {Object} task - Task to execute
   * @returns {Promise<Array<Object>>} Results from all agents
   */
  async runParallel(task) {
    this.emit("start", { mode: "parallel", agentCount: this.agents.length });
    const promises = this.agents.map(async (agent) => {
      const agentName = agent.name || agent.id || "unknown-agent";
      try {
        const result = await this._executeAgent(agent, task);
        this.results.set(agentName, result);
        this.emit("agent:complete", { agent: agentName, result });
        return { agent: agentName, success: true, result };
      } catch (error) {
        this.errors.push({ agent: agentName, error });
        this.emit("agent:error", { agent: agentName, error: error.message });
        return { agent: agentName, success: false, error: error.message };
      }
    });
    const results = await Promise.all(promises);
    this.emit("complete", { results: Array.from(this.results.entries()), errors: this.errors });
    return results;
  }
  /**
   * Run agents sequentially, stopping on error or shouldStop signal
   * @param {Object} task - Task to execute
   * @returns {Promise<Array<Object>>} Ordered results
   */
  async runSequential(task) {
    this.emit("start", { mode: "sequential", agentCount: this.agents.length });
    const results = [];
    for (const agent of this.agents) {
      const agentName = agent.name || agent.id || "unknown-agent";
      try {
        const result = await this._executeAgent(agent, task);
        results.push({ agent: agentName, success: true, result });
        this.emit("agent:complete", { agent: agentName, result });
        if (result?.shouldStop) {
          this.emit("stopped", { agent: agentName, reason: result.stopReason });
          break;
        }
      } catch (error) {
        results.push({ agent: agentName, success: false, error: error.message });
        this.emit("agent:error", { agent: agentName, error: error.message });
        break;
      }
    }
    this.emit("complete", { results, errors: this.errors });
    return results;
  }
  /**
   * Run agents in waterfall mode — each agent receives previous output as input
   * @param {*} initialContext - Initial context passed to the first agent
   * @returns {Promise<*>} Final context after all agents
   */
  async runWaterfall(initialContext) {
    this.emit("start", { mode: "waterfall", agentCount: this.agents.length });
    let context = initialContext;
    for (const agent of this.agents) {
      const agentName = agent.name || agent.id || "unknown-agent";
      try {
        context = await this._executeAgent(agent, context);
        this.emit("agent:complete", { agent: agentName, context });
      } catch (error) {
        this.emit("agent:error", { agent: agentName, error: error.message });
        throw error;
      }
    }
    this.emit("complete", { finalResult: context });
    return context;
  }
  /**
   * Run agents competitively and select the best result
   * @param {Object} task - Task to execute
   * @param {Function} selectBest - Selector function to pick the best result
   * @returns {Promise<Object>} Best result
   */
  async runCompetitive(task, selectBest) {
    this.emit("start", { mode: "competitive", agentCount: this.agents.length });
    const results = await this.runParallel(task);
    const successful = results.filter((r) => r.success);
    if (successful.length === 0) {
      throw new Error("No agents succeeded in competitive mode");
    }
    const best = typeof selectBest === "function" ? selectBest(successful) : successful[0];
    this.emit("complete", { bestResult: best });
    return best;
  }
  /**
   * Internal helper to execute an agent regardless of its implementation
   * @private
   */
  async _executeAgent(agent, input) {
    if (typeof agent.execute === "function") {
      return await agent.execute(input);
    } else if (typeof agent.handler === "function") {
      return await agent.handler(input);
    } else if (typeof agent === "function") {
      return await agent(input);
    } else {
      throw new Error(`Invalid agent format: ${agent.name || agent.id || "unknown"}`);
    }
  }
};
SwarmOrchestrator = __decorateClass([
  singleton()
], SwarmOrchestrator);
var swarm_orchestrator_default = SwarmOrchestrator;
export {
  SwarmOrchestrator,
  swarm_orchestrator_default as default
};
