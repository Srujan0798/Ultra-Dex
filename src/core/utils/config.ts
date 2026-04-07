import { logger } from './logging.js';
function getProjectRoot() {
  return process.cwd();
}
function _handleModuleError(error, context = "config") {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
  }
}
export {
  getProjectRoot
};
