// Copyright (c) 2026 Ultra-Dex

/**
 * Agent negotiation utilities
 */

import { createMessage } from './protocol.js';

export function requestTaskAssignment({ from, to, task, priority = 'medium', deadline = null }) {
  return createMessage('agent.request', {
    from,
    to,
    type: 'task_assignment',
    payload: {
      task,
      priority,
      deadline,
    },
  });
}

export function respondToAssignment({ from, to, accepted, reason = null }) {
  return createMessage('agent.response', {
    from,
    to,
    accepted,
    reason,
  });
}

export function resolveConflict({ from, to, conflict, resolution }) {
  return createMessage('agent.conflict.resolve', {
    from,
    to,
    conflict,
    resolution,
  });
}

export default {
  requestTaskAssignment,
  respondToAssignment,
  resolveConflict,
};

/**
 * Handle errors in negotiation module
 * @param {Error} error - The error to handle
 * @param {string} [context='negotiation'] - Error context
 */
function handleModuleError(error, context = 'negotiation') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
