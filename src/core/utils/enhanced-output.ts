import {
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatLoading,
  formatStatusCard
} from './status.js';
import { formatHelpSection } from './help.js';
import { logger } from './logging.js';
function printSuccess(message) {
  logger.log(formatSuccess(message));
}
function printError(message) {
  logger.error(formatError(message));
}
function printWarning(message) {
  logger.log(formatWarning(message));
}
function printInfo(message) {
  logger.log(formatInfo(message));
}
function printLoading(message) {
  logger.log(formatLoading(message));
}
function printStatusCard(title, message, type = "info") {
  logger.log(formatStatusCard(title, message, type));
}
function printHelpSection(title, content, options = {}) {
  logger.log(formatHelpSection(title, content, options));
}
var enhanced_output_default = {
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printLoading,
  printStatusCard,
  printHelpSection
};
function _handleModuleError(error, context = "enhanced-output") {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
  }
}
export {
  enhanced_output_default as default,
  printError,
  printHelpSection,
  printInfo,
  printLoading,
  printStatusCard,
  printSuccess,
  printWarning
};
