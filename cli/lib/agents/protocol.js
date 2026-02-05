/**
 * Agent2Agent Protocol (JSON-RPC 2.0)
 */

import { EventEmitter } from 'events';

export const COMM_RULES = [
  'Sign work with agent name',
  'Update state.json after changes',
  'Comment WHY, not just WHAT',
  'Respect directory ownership'
];

export function createMessage(method, params = {}, id = null) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id: id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
}

export function validateMessage(message) {
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return { valid: false, error: 'Invalid JSON-RPC message' };
  }
  return { valid: true };
}

export function buildStateUpdate({ version, lastUpdated, activeAgents = [], completedTasks = [], pendingTasks = [] }) {
  return {
    version,
    lastUpdated: lastUpdated || new Date().toISOString(),
    activeAgents,
    completedTasks,
    pendingTasks
  };
}

export function detectConflicts(changesA = [], changesB = []) {
  const setA = new Set(changesA);
  const conflicts = changesB.filter(file => setA.has(file));
  return conflicts;
}

export class AgentProtocolBus extends EventEmitter {
  send(message) {
    const validation = validateMessage(message);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    this.emit('message', message);
  }
}

export default {
  createMessage,
  validateMessage,
  AgentProtocolBus
};
