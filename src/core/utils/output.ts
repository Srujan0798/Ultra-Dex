import chalk from 'chalk';
import { formatError, formatWarning, formatInfo, formatSuccess } from './status.js';
import { logger } from '../../utils/logging.js';
function printError(message, err) {
  try {
    logger.log(formatError(message));
    if (err?.message) {
      logger.log(chalk.gray(`  \u2192 ${err.message}`));
    }
  } catch (e) {
    logger.error('Failed to print error:', e);
  }
}
function printWarning(message) {
  try {
    logger.log(formatWarning(message));
  } catch (e) {
    logger.error('Failed to print warning:', e);
  }
}
function printInfo(message) {
  try {
    logger.log(formatInfo(message));
  } catch (e) {
    logger.error('Failed to print info:', e);
  }
}
function printSuccess(message) {
  try {
    logger.log(formatSuccess(message));
  } catch (e) {
    logger.error('Failed to print success:', e);
  }
}
export { printError, printInfo, printSuccess, printWarning };
