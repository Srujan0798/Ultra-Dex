// Copyright (c) 2026 Ultra-Dex

import { AGENTS } from '../commands/agents.js';

export function listAgents() {
  return AGENTS.slice();
}

export function listAgentNames() {
  return AGENTS.map((agent) => agent.name);
}

export function getAgentByName(name) {
  if (!name) return null;
  return AGENTS.find((agent) => agent.name.toLowerCase() === name.toLowerCase()) || null;
}

export default {
  listAgents,
  listAgentNames,
  getAgentByName,
  AGENTS,
};
