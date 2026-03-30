// Copyright (c) 2026 Ultra-Dex
// src/core/orchestration/agent-state.js

/**
 * Agent State Machine
 * Manages the state transitions of agents during execution
 */

export class AgentStateMachine {
  constructor() {
    this.states = new Map(); // agentId -> state
    this.transitions = new Map(); // state -> allowed transitions
    // Ring buffer for state transition history (last 1000 transitions)
    this.MAX_HISTORY_SIZE = 1000;
    this.stateHistory = new Array(this.MAX_HISTORY_SIZE);
    this.historyIndex = 0;
    this.historyCount = 0;
  }

  async initialize() {
    // Define state transitions
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

    // Record transition in history (ring buffer)
    const transitionRecord = {
      agentId,
      from: currentState,
      to: newState,
      timestamp: new Date().toISOString(),
    };

    this.stateHistory[this.historyIndex] = transitionRecord;
    this.historyIndex = (this.historyIndex + 1) % this.MAX_HISTORY_SIZE;
    if (this.historyCount < this.MAX_HISTORY_SIZE) {
      this.historyCount++;
    }

    // Update state
    this.states.set(agentId, newState);

    return {
      agentId,
      from: currentState,
      to: newState,
      timestamp: new Date().toISOString(),
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
    // Determine the start index and length of the used portion of the buffer
    let start, length;
    if (this.historyCount < this.MAX_HISTORY_SIZE) {
      start = 0;
      length = this.historyCount;
    } else {
      start = this.historyIndex;
      length = this.MAX_HISTORY_SIZE;
    }

    // Iterate over the buffer in chronological order (oldest first)
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

  async shutdown() {
    // Cleanup resources if needed
  }
}
