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
import { BaseAgent } from './base-agent.js';
let Swarm = class extends BaseAgent {
  constructor(swarmId, options = {}) {
    super(`swarm-${swarmId}`, {
      ...options,
      capabilities: ['coordination', 'delegation', 'aggregation', ...(options.capabilities || [])],
    });
    this.swarmId = swarmId;
    this.members = /* @__PURE__ */ new Map();
    this.config = {
      maxMembers: options.maxMembers || 50,
      strategy: options.strategy || 'consensus',
      autoBalance: options.autoBalance !== false,
      ...options,
    };
  }
  /**
   * Add member to swarm
   */
  addMember(agent, role = 'worker') {
    if (this.members.size >= this.config.maxMembers) {
      throw new Error(`Swarm ${this.swarmId} is at maximum capacity`);
    }
    if (this.members.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already in swarm`);
    }
    this.members.set(agent.id, {
      agent,
      role,
      joinedAt: Date.now(),
      status: 'active',
      tasksCompleted: 0,
      tasksFailed: 0,
    });
    this.emit('member.joined', { agentId: agent.id, role });
    return this;
  }
  /**
   * Remove member from swarm
   */
  removeMember(agentId) {
    if (!this.members.has(agentId)) {
      return false;
    }
    this.members.delete(agentId);
    this.emit('member.left', { agentId });
    return true;
  }
  /**
   * Get swarm member
   */
  getMember(agentId) {
    return this.members.get(agentId);
  }
  /**
   * List all members
   */
  listMembers(filter = {}) {
    let members = Array.from(this.members.values());
    if (filter.role) {
      members = members.filter((m) => m.role === filter.role);
    }
    if (filter.status) {
      members = members.filter((m) => m.status === filter.status);
    }
    return members;
  }
  /**
   * Execute task using swarm strategy
   */
  async onExecute(task) {
    const strategy = task.strategy || this.config.strategy;
    if (strategy === 'consensus') {
      return await this.executeConsensus(task);
    } else if (strategy === 'hierarchical') {
      return await this.executeHierarchical(task);
    } else if (strategy === 'broadcast') {
      return await this.executeBroadcast(task);
    } else if (strategy === 'tournament') {
      return await this.executeTournament(task);
    } else {
      throw new Error(`Unknown swarm strategy: ${strategy}`);
    }
  }
  /**
   * Consensus-based execution
   */
  async executeConsensus(task) {
    const workers = Array.from(this.members.values())
      .filter((m) => m.status === 'active' && m.role === 'worker')
      .map((m) => m.agent);
    if (workers.length === 0) {
      throw new Error('No available workers in swarm');
    }
    const results = await Promise.allSettled(
      workers.map((agent) => this.executeWithTimeout(agent, task))
    );
    const successful = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    if (successful.length === 0) {
      throw new Error('Consensus failed: all workers failed');
    }
    return this.aggregateResults(successful);
  }
  /**
   * Hierarchical execution
   */
  async executeHierarchical(task) {
    const leaders = Array.from(this.members.values()).filter(
      (m) => m.role === 'leader' && m.status === 'active'
    );
    if (leaders.length === 0) {
      throw new Error('No leaders in swarm');
    }
    const leader = leaders[0];
    return await this.executeWithTimeout(leader.agent, task);
  }
  /**
   * Broadcast execution
   */
  async executeBroadcast(task) {
    const members = Array.from(this.members.values()).filter((m) => m.status === 'active');
    const results = await Promise.allSettled(
      members.map((m) => this.executeWithTimeout(m.agent, task))
    );
    return results.map((r, idx) => ({
      agent: Array.from(this.members.values())[idx].agent.id,
      success: r.status === 'fulfilled',
      result: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? r.reason.message : null,
    }));
  }
  /**
   * Tournament-based execution
   */
  async executeTournament(task) {
    const workers = Array.from(this.members.values()).filter(
      (m) => m.status === 'active' && m.role === 'worker'
    );
    if (workers.length === 0) {
      throw new Error('No workers for tournament');
    }
    const competitorCount = Math.min(Math.ceil(workers.length / 2), 5);
    const competitors = workers.slice(0, competitorCount);
    const results = await Promise.allSettled(
      competitors.map((m) => this.executeWithTimeout(m.agent, task))
    );
    const scored = results
      .map((r, idx) => ({
        agent: competitors[idx],
        result: r.value,
        success: r.status === 'fulfilled',
        score: r.status === 'fulfilled' ? r.value?.score || 0 : -1,
      }))
      .filter((r) => r.success)
      .sort((a, b) => b.score - a.score);
    if (scored.length === 0) {
      throw new Error('No successful tournament competitors');
    }
    const winner = scored[0].agent;
    winner.tasksCompleted++;
    return scored[0].result;
  }
  /**
   * Execute with timeout
   */
  async executeWithTimeout(agent, task, timeout = 3e4) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task execution timeout for agent ${agent.id}`));
      }, timeout);
      agent
        .execute(task)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
  /**
   * Aggregate multiple results
   */
  aggregateResults(results) {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];
    if (Array.isArray(results[0])) {
      return results.flat();
    }
    if (typeof results[0] === 'number') {
      return results.reduce((a, b) => a + b, 0) / results.length;
    }
    if (typeof results[0] === 'object') {
      return Object.assign({}, ...results);
    }
    return results[0];
  }
  /**
   * Get swarm status
   */
  getSwarmStatus() {
    const members = Array.from(this.members.values());
    const activeMembers = members.filter((m) => m.status === 'active');
    const leaders = members.filter((m) => m.role === 'leader');
    const workers = members.filter((m) => m.role === 'worker');
    return {
      swarmId: this.swarmId,
      state: this.state,
      members: members.length,
      activeMembers: activeMembers.length,
      leaders: leaders.length,
      workers: workers.length,
      strategy: this.config.strategy,
      taskStats: {
        completed: members.reduce((sum, m) => sum + m.tasksCompleted, 0),
        failed: members.reduce((sum, m) => sum + m.tasksFailed, 0),
      },
    };
  }
  /**
   * Rebalance swarm
   */
  async rebalance() {
    if (!this.config.autoBalance) return;
    const members = Array.from(this.members.values());
    for (const member of members) {
      try {
        const health = await this.checkMemberHealth(member.agent);
        if (!health) {
          member.status = 'unhealthy';
          this.emit('member.unhealthy', { agentId: member.agent.id });
        }
      } catch (_error) {
        member.status = 'unhealthy';
      }
    }
    this.emit('swarm.rebalanced');
  }
  /**
   * Check member health
   */
  async checkMemberHealth(agent) {
    try {
      const result = await Promise.race([
        agent.execute({ type: 'health-check' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2e3)),
      ]);
      return result && result.healthy !== false;
    } catch {
      return false;
    }
  }
  /**
   * Shutdown swarm
   */
  async onShutdown() {
    for (const member of this.members.values()) {
      if (member.agent.shutdown) {
        await member.agent.shutdown();
      }
    }
    this.members.clear();
    this.emit('swarm.shutdown', { swarmId: this.swarmId });
  }
};
Swarm = __decorateClass([singleton()], Swarm);
var swarm_default = Swarm;
export { Swarm, swarm_default as default };
