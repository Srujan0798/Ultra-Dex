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
    this.stateHistory = new Map(); // agentId -> state transition history
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

    // Record transition in history
    if (!this.stateHistory.has(agentId)) {
      this.stateHistory.set(agentId, []);
    }
    this.stateHistory.get(agentId).push({
      from: currentState,
      to: newState,
      timestamp: new Date().toISOString()
    });

    // Update state
    this.states.set(agentId, newState);
    
    return {
      agentId,
      from: currentState,
      to: newState,
      timestamp: new Date().toISOString()
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
   * Get state history for an agent
   */
  getHistory(agentId) {
    return this.stateHistory.get(agentId) || [];
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