/**
 * Registry Re-export (Backward Compatibility)
 */

import { registry } from '../../../../src/core/agents/unified-registry.js';
import { AGENTS as BUILTIN_AGENTS } from '../commands/agents.js';

// Initialize with built-in agents
registry.initialize(BUILTIN_AGENTS);

export const listAgents = () => registry.list();
export const listAgentNames = () => registry.listAgentNames();
export const getAgentByName = (name) => registry.get(name);
export const AGENTS = BUILTIN_AGENTS;

export default {
  listAgents,
  listAgentNames,
  getAgentByName,
  AGENTS,
};
