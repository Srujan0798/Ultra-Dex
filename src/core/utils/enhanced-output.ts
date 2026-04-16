import {
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatLoading,
  formatStatusCard,
} from './status.js';
import { formatHelpSection } from './help.js';
import { logger } from './logging.js';
type StatusCardType = Parameters<typeof formatStatusCard>[2];
type HelpSectionOptions = Parameters<typeof formatHelpSection>[2];
function printSuccess(message: string): void {
  logger.log(formatSuccess(message));
}
function printError(message: string): void {
  logger.error(formatError(message));
}
function printWarning(message: string): void {
  logger.log(formatWarning(message));
}
function printInfo(message: string): void {
  logger.log(formatInfo(message));
}
function printLoading(message: string): void {
  logger.log(formatLoading(message));
}
function printStatusCard(title: string, message: string, type: StatusCardType = 'info'): void {
  logger.log(formatStatusCard(title, message, type));
}
function printHelpSection(
  title: string,
  content: string,
  options: HelpSectionOptions = {}
): void {
  logger.log(formatHelpSection(title, content, options));
}
var enhanced_output_default = {
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printLoading,
  printStatusCard,
  printHelpSection,
};
function _handleModuleError(error: unknown, context: string = 'enhanced-output'): void {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {}
}
export {
  enhanced_output_default as default,
  printError,
  printHelpSection,
  printInfo,
  printLoading,
  printStatusCard,
  printSuccess,
  printWarning,
};
