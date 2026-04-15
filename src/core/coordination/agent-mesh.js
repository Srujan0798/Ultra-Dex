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
let RoleRegistry = class {
  constructor() {
    this.roles = /* @__PURE__ */ new Map();
  }
  register(agentId, { role, capabilities = [], constraints = [], description = '' }) {
    this.roles.set(agentId, {
      agentId,
      role,
      capabilities,
      constraints,
      description,
      active: true,
      registeredAt: Date.now(),
    });
  }
  getRole(agentId) {
    return this.roles.get(agentId) || null;
  }
  /**
   * Verify an agent is acting within its designated role
   */
  verify(agentId, action) {
    const entry = this.roles.get(agentId);
    if (!entry) return { valid: false, reason: `Agent "${agentId}" not registered` };
    if (!entry.active) return { valid: false, reason: `Agent "${agentId}" is deactivated` };
    for (const constraint of entry.constraints) {
      if (typeof constraint === 'string' && action.includes(constraint)) {
        return { valid: false, reason: `Action "${action}" violates constraint: ${constraint}` };
      }
    }
    return { valid: true, role: entry.role };
  }
  /**
   * Find agents with a specific capability
   */
  findByCapability(capability) {
    return [...this.roles.values()].filter((r) => r.active && r.capabilities.includes(capability));
  }
  deactivate(agentId) {
    const entry = this.roles.get(agentId);
    if (entry) entry.active = false;
  }
  list() {
    return [...this.roles.values()];
  }
};
RoleRegistry = __decorateClass([singleton()], RoleRegistry);
let TaskQueue = class {
  constructor() {
    this.tasks = [];
    this.completed = [];
    this.assignments = /* @__PURE__ */ new Map();
  }
  add({
    id,
    description,
    priority = 5,
    dependencies = [],
    data = null,
    requiredCapability = null,
  }) {
    this.tasks.push({
      id,
      description,
      priority,
      dependencies,
      data,
      requiredCapability,
      status: 'pending',
      assignedTo: null,
      createdAt: Date.now(),
      completedAt: null,
    });
    this.tasks.sort((a, b) => b.priority - a.priority);
  }
  /**
   * Get next available task for an agent (respects dependencies)
   */
  next(agentId, capabilities = []) {
    const completedIds = new Set(this.completed.map((t) => t.id));
    for (const task of this.tasks) {
      if (task.status !== 'pending') continue;
      const depsReady = task.dependencies.every((dep) => completedIds.has(dep));
      if (!depsReady) continue;
      if (task.requiredCapability && !capabilities.includes(task.requiredCapability)) continue;
      task.status = 'assigned';
      task.assignedTo = agentId;
      this.assignments.set(task.id, agentId);
      return task;
    }
    return null;
  }
  complete(taskId, result = null) {
    const idx = this.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return false;
    const task = this.tasks.splice(idx, 1)[0];
    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;
    this.completed.push(task);
    return true;
  }
  fail(taskId, error) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = 'pending';
      task.assignedTo = null;
      task.lastError = error;
    }
  }
  getStats() {
    return {
      pending: this.tasks.filter((t) => t.status === 'pending').length,
      assigned: this.tasks.filter((t) => t.status === 'assigned').length,
      completed: this.completed.length,
      total: this.tasks.length + this.completed.length,
    };
  }
};
TaskQueue = __decorateClass([singleton()], TaskQueue);
let MessageBus = class {
  constructor() {
    this.subscribers = /* @__PURE__ */ new Map();
    this.messages = [];
    this.deliveryLog = [];
  }
  subscribe(agentId, topic, handler) {
    if (!this.subscribers.has(topic)) this.subscribers.set(topic, []);
    this.subscribers.get(topic).push({ agentId, handler });
  }
  /**
   * Send a message to a topic — all subscribers receive it
   * Returns delivery confirmation
   */
  async send(fromAgentId, topic, payload) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: fromAgentId,
      topic,
      payload,
      timestamp: Date.now(),
      deliveredTo: [],
    };
    this.messages.push(message);
    if (this.messages.length > 5e3) this.messages.shift();
    const subs = this.subscribers.get(topic) || [];
      for (const sub of subs) {
        try {
          await sub.handler(payload, { from: fromAgentId, topic, messageId: message.id });
          message.deliveredTo.push(sub.agentId);
        } catch (error) {
          // Handler failed - continue to next subscriber
          console.warn(`[AgentMesh] Handler failed for ${sub.agentId}:`, error);
        }
      }
    }
    this.deliveryLog.push({
      messageId: message.id,
      topic,
      from: fromAgentId,
      delivered: message.deliveredTo.length,
      total: subs.length,
    });
    return { messageId: message.id, delivered: message.deliveredTo.length, total: subs.length };
  }
  /**
   * Direct message to a specific agent
   */
  async sendDirect(fromAgentId, toAgentId, payload) {
    for (const [topic, subs] of this.subscribers) {
      const sub = subs.find((s) => s.agentId === toAgentId);
      if (sub) {
        await sub.handler(payload, { from: fromAgentId, topic, direct: true });
        return { delivered: true };
      }
    }
    return { delivered: false, reason: `Agent "${toAgentId}" not subscribed to any topic` };
  }
  getHistory(topic = null, limit = 50) {
    const msgs = topic ? this.messages.filter((m) => m.topic === topic) : this.messages;
    return msgs.slice(-limit);
  }
};
MessageBus = __decorateClass([singleton()], MessageBus);
let ConsensusProtocol = class {
  constructor({ requiredAgreement = 0.66 } = {}) {
    this.requiredAgreement = requiredAgreement;
  }
  /**
   * Run consensus check: ask N agents, require M agreement
   * @param {Array<Function>} agentFns - Each returns a result
   * @returns {{ consensus: boolean, result, agreement, responses }}
   */
  async check(agentFns) {
    const responses = [];
    for (const fn of agentFns) {
      try {
        const result = await fn();
        responses.push({ result, error: null });
      } catch (error) {
        responses.push({ result: null, error: error.message });
      }
    }
    const successResponses = responses.filter((r) => !r.error);
    if (successResponses.length === 0) {
      return {
        consensus: false,
        result: null,
        agreement: 0,
        responses,
        reason: 'All agents failed',
      };
    }
    const groups = this._groupByContent(successResponses.map((r) => r.result));
    const largest = groups[0];
    const agreement = largest.count / agentFns.length;
    const consensus = agreement >= this.requiredAgreement;
    return {
      consensus,
      result: consensus ? largest.representative : null,
      agreement: Math.round(agreement * 100) / 100,
      groupCount: groups.length,
      responses,
    };
  }
  _groupByContent(results) {
    const groups = [];
    for (const result of results) {
      const key =
        typeof result === 'string'
          ? result.trim().toLowerCase().slice(0, 200)
          : JSON.stringify(result);
      const existing = groups.find((g) => g.key === key);
      if (existing) {
        existing.count++;
      } else {
        groups.push({ key, representative: result, count: 1 });
      }
    }
    return groups.sort((a, b) => b.count - a.count);
  }
};
ConsensusProtocol = __decorateClass([singleton()], ConsensusProtocol);
let AgentMesh = class extends EventEmitter {
  constructor(config = {}) {
    super();
    this.roles = new RoleRegistry();
    this.taskQueue = new TaskQueue();
    this.messageBus = new MessageBus();
    this.consensus = new ConsensusProtocol({
      requiredAgreement: config.requiredAgreement || 0.66,
    });
  }
  /**
   * Register an agent with a role
   */
  registerAgent(agentId, roleConfig) {
    this.roles.register(agentId, roleConfig);
    this.messageBus.subscribe(agentId, 'coordination', async (payload, meta) => {
      this.emit('coordination:message', { agentId, payload, meta });
    });
    this.emit('agent:registered', { agentId, role: roleConfig.role });
  }
  /**
   * Submit a task to the mesh for distribution
   */
  submitTask(task) {
    this.taskQueue.add(task);
    this.emit('task:submitted', task);
    const capable = this.roles.findByCapability(task.requiredCapability);
    if (capable.length > 0) {
      this.emit('task:assignable', { taskId: task.id, candidates: capable.map((c) => c.agentId) });
    }
  }
  /**
   * Agent claims next available task
   */
  claimTask(agentId) {
    const role = this.roles.getRole(agentId);
    if (!role) return null;
    return this.taskQueue.next(agentId, role.capabilities);
  }
  /**
   * Complete a task with result
   */
  completeTask(taskId, result) {
    this.taskQueue.complete(taskId, result);
    this.emit('task:completed', { taskId, result });
  }
  /**
   * Run a consensus check across agents
   */
  async runConsensus(agentFns) {
    const result = await this.consensus.check(agentFns);
    this.emit('consensus:result', result);
    return result;
  }
  /**
   * Send a message through the mesh
   */
  async broadcast(fromAgentId, topic, payload) {
    return this.messageBus.send(fromAgentId, topic, payload);
  }
  /**
   * Get mesh dashboard
   */
  getDashboard() {
    return {
      agents: this.roles.list(),
      tasks: this.taskQueue.getStats(),
      messages: {
        total: this.messageBus.messages.length,
        recent: this.messageBus.getHistory(null, 10),
      },
    };
  }
};
AgentMesh = __decorateClass([singleton()], AgentMesh);
var agent_mesh_default = AgentMesh;
export {
  AgentMesh,
  ConsensusProtocol,
  MessageBus,
  RoleRegistry,
  TaskQueue,
  agent_mesh_default as default,
};
