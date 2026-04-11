// Copyright (c) 2026 Ultra-Dex

/**
 * Agent System Index
 * Exports all agent-related functionality
 */

export * from './base-agent.js';
export * from './planner.js';
export * from './registry.js';
export * from './session-manager.js';
export * from './daemon.js';
export * from './queue.js';
export * from './checkpoint.js';
export * from './swarm.js';
export * from './protocol.js';
export * from './handshake.js';
export * from './architect-graph.js';
export * from './debugger-graph.js';
export * from './executor-graph.js';
export * from './planner-graph.js';
export * from './reviewer-graph.js';
export * from './vision-agent.js';
export * from './vision.js';
export * from './computer-use-agent.js';
export * from './meta-orchestrator.js';
export * from './negotiation.js';
export * from './workflow-rules.js';
export * from './graph-utils.js';
export * from './ralph-loop.js';

console.log('[AGENTS] Agent system initialized with all components');

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
