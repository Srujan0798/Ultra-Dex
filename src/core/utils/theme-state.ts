import { logger } from './logging.js';
let isDoomsday = false;
function setDoomsdayMode(enabled: boolean): void {
  isDoomsday = enabled;
}
function isDoomsdayMode(): boolean {
  return isDoomsday;
}
function _handleModuleError(error: unknown, context: string = 'theme-state'): void {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {}
}
export { isDoomsday, isDoomsdayMode, setDoomsdayMode };
