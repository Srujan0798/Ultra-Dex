// Copyright (c) 2026 Ultra-Dex

import { AGENTS } from '../commands/agents.js';

/**
 * Get a copy of all registered agents
 * @returns {Array<Object>} Array of agent definitions
 */
export function listAgents() {
  return AGENTS.slice();
}

/**
 * Get names of all registered agents
 * @returns {Array<string>} Array of agent names
 */
export function listAgentNames() {
  return AGENTS.map((agent) => agent.name);
}

/**
 * Look up an agent by name (case-insensitive)
 * @param {string} name - Agent name to search for
 * @returns {Object|null} Agent definition or null if not found
 */
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

/**
 * Handle errors in registry module
 * @param {Error} error - The error to handle
 * @param {string} [context='registry'] - Error context
 */
function handleModuleError(error, context = 'registry') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
