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
let AgentStateMachine = class {
  constructor() {
    this.states = /* @__PURE__ */ new Map();
    this.transitions = /* @__PURE__ */ new Map();
    this.MAX_HISTORY_SIZE = 1e3;
    this.stateHistory = new Array(this.MAX_HISTORY_SIZE);
    this.historyIndex = 0;
    this.historyCount = 0;
  }
  async initialize() {
    this.transitions.set('idle', ['working', 'sleeping']);
    this.transitions.set('working', ['idle', 'error', 'paused']);
    this.transitions.set('paused', ['working', 'idle']);
    this.transitions.set('error', ['idle', 'working']);
    this.transitions.set('sleeping', ['idle']);
  }
  /**
   * Transition an agent to a new state
   */
  async transition(agentId, newState) {
    const currentState = this.states.get(agentId) || 'idle';
    if (!this.canTransition(currentState, newState)) {
      throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
    }
    const transitionRecord = {
      agentId,
      from: currentState,
      to: newState,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
    this.stateHistory[this.historyIndex] = transitionRecord;
    this.historyIndex = (this.historyIndex + 1) % this.MAX_HISTORY_SIZE;
    if (this.historyCount < this.MAX_HISTORY_SIZE) {
      this.historyCount++;
    }
    this.states.set(agentId, newState);
    return {
      agentId,
      from: currentState,
      to: newState,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
  }
  /**
   * Check if a state transition is valid
   */
  canTransition(fromState, toState) {
    const allowedTransitions = this.transitions.get(fromState);
    return allowedTransitions && allowedTransitions.includes(toState);
  }
  /**
   * Get current state of an agent
   */
  getState(agentId) {
    return this.states.get(agentId) || 'idle';
  }
  /**
   * Get state history for an agent (filtered from global ring buffer)
   */
  getHistory(agentId) {
    const result = [];
    let start, length;
    if (this.historyCount < this.MAX_HISTORY_SIZE) {
      start = 0;
      length = this.historyCount;
    } else {
      start = this.historyIndex;
      length = this.MAX_HISTORY_SIZE;
    }
    for (let i = 0; i < length; i++) {
      const index = (start + i) % this.MAX_HISTORY_SIZE;
      const record = this.stateHistory[index];
      if (record && record.agentId === agentId) {
        result.push(record);
      }
    }
    return result;
  }
  /**
   * Check if agent is in a specific state
   */
  isInState(agentId, state) {
    return this.getState(agentId) === state;
  }
  /**
   * Get all agents in a specific state
   */
  getAgentsInState(state) {
    const agents = [];
    for (const [agentId, agentState] of this.states) {
      if (agentState === state) {
        agents.push(agentId);
      }
    }
    return agents;
  }
  async shutdown() {}
};
AgentStateMachine = __decorateClass([singleton()], AgentStateMachine);
export { AgentStateMachine };
