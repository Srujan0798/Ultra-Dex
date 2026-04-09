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
let BaseAgent = class extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.id = options.id || `${name}-${Date.now()}`;
    this.state = 'idle';
    this.capabilities = options.capabilities || [];
    this.config = options.config || {};
    this.metadata = options.metadata || {};
  }
  /**
   * Initialize the agent
   */
  async initialize() {
    this.state = 'initializing';
    this.emit('state-change', { from: 'idle', to: 'initializing' });
    await this.onInitialize();
    this.state = 'ready';
    this.emit('state-change', { from: 'initializing', to: 'ready' });
    this.emit('ready');
  }
  /**
   * Execute a task
   */
  async execute(task) {
    if (this.state !== 'ready') {
      throw new Error(`Agent ${this.name} is not ready (current state: ${this.state})`);
    }
    this.state = 'executing';
    this.emit('state-change', { from: 'ready', to: 'executing' });
    this.emit('task-start', { task });
    try {
      const result = await this.onExecute(task);
      this.state = 'ready';
      this.emit('state-change', { from: 'executing', to: 'ready' });
      this.emit('task-complete', { task, result });
      return result;
    } catch (error) {
      this.state = 'error';
      this.emit('state-change', { from: 'executing', to: 'error' });
      this.emit('task-error', { task, error });
      throw error;
    }
  }
  /**
   * Check if agent can handle a task type
   */
  canHandle(taskType) {
    return this.capabilities.includes(taskType);
  }
  /**
   * Get agent status
   */
  get status() {
    return this.state;
  }
  /**
   * Get agent status
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      capabilities: this.capabilities,
      metadata: this.metadata,
    };
  }
  /**
   * Override in subclasses for initialization logic
   */
  async onInitialize() {}
  /**
   * Override in subclasses for task execution logic
   */
  async onExecute(task) {
    throw new Error(`Agent ${this.name} does not implement onExecute`);
  }
  /**
   * Shutdown the agent
   */
  async shutdown() {
    this.state = 'shutdown';
    this.emit('state-change', { from: this.state, to: 'shutdown' });
    this.emit('shutdown');
  }
};
BaseAgent = __decorateClass([singleton()], BaseAgent);
export { BaseAgent };
