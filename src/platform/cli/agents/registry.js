/**
 * Registry Re-export (Backward Compatibility)
 */

import { registry } from '../../../core/agents/unified-registry.js';
import { AGENTS } from '../commands/agents.js';

// Initialize with built-in agents
registry.initialize(AGENTS);

export const listAgents = () => registry.list();
export const listAgentNames = () => registry.listAgentNames();
export const getAgentByName = (name) => registry.get(name);
export { AGENTS };

export default {
  listAgents,
  listAgentNames,
  getAgentByName,
  AGENTS,
};
