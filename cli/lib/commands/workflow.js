// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Workflow module
 * @module commands/workflow
 */

import { registerWorkflowCommand } from './workflows.js';

export { registerWorkflowCommand };

export default {
  registerWorkflowCommand,
};

/**
 * Error handler for workflow
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[workflow]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
