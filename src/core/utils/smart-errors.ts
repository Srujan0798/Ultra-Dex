export * from './smart-error.js';
import SmartError from './smart-error.js';
import { logger } from './logging.js';
var smart_errors_default = SmartError;
function _handleError(error) {
  try {
    logger.error("[smart-errors]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  smart_errors_default as default
};
