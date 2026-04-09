import { logger } from './logging.js';
let isDoomsday = false;
function setDoomsdayMode(enabled) {
  isDoomsday = enabled;
}
function isDoomsdayMode() {
  return isDoomsday;
}
function _handleModuleError(error, context = 'theme-state') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {}
}
export { isDoomsday, isDoomsdayMode, setDoomsdayMode };
