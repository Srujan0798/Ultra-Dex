import { logger } from './logging.js';
export * from './token-forecast.js';
import { default as default2 } from './token-forecast.js';
function _handleError(error) {
  try {
    logger.error("[token-budget]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  default2 as default
};
