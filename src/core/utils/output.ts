import chalk from 'chalk';
import { formatError, formatWarning, formatInfo, formatSuccess } from './status.js';
import { logger } from '../../utils/logging.js';
interface MessageLikeError {
  message?: string;
}
function printError(message: string, err?: MessageLikeError | null): void {
  try {
    logger.log(formatError(message));
    if (err?.message) {
      logger.log(chalk.gray(`  \u2192 ${err.message}`));
    }
  } catch (e) {
    logger.error('Failed to print error:', e);
  }
}
function printWarning(message: string): void {
  try {
    logger.log(formatWarning(message));
  } catch (e) {
    logger.error('Failed to print warning:', e);
  }
}
function printInfo(message: string): void {
  try {
    logger.log(formatInfo(message));
  } catch (e) {
    logger.error('Failed to print info:', e);
  }
}
function printSuccess(message: string): void {
  try {
    logger.log(formatSuccess(message));
  } catch (e) {
    logger.error('Failed to print success:', e);
  }
}
export { printError, printInfo, printSuccess, printWarning };
