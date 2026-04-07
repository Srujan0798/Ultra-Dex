// Copyright (c) 2026 Ultra-Dex

// Thin wrapper around the Project Mind engine
import { ProjectMind } from './mind.js';

export { ProjectMind };
export default ProjectMind;

/**
 * Error handler for project-mind
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[project-mind]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
