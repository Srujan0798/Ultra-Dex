import { readFileSync } from 'fs';
import { logger } from './logging.js';
const pkg = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
const VERSION = pkg.version;
const PACKAGE_NAME = pkg.name;
function getVersion() {
  return VERSION;
}
var version_default = VERSION;
function _handleModuleError(error, context = 'version') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {}
}
export { PACKAGE_NAME, VERSION, version_default as default, getVersion };
