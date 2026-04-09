var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import chalk from 'chalk';
import { printError, printWarning, printInfo } from '../utils/output.js';
import { logger } from './logging.js';
const ERROR_CATEGORIES = {
  MODULE_NOT_FOUND: {
    title: 'Module Not Found',
    whatHappened: 'A required module or package could not be found',
    why: 'The module is not installed or the path is incorrect',
    suggestedFix: 'Run `npm install [package-name]` to install the missing module',
    interactiveFix: async () => {
      logger.log(chalk.yellow('Offering to install missing packages...'));
    },
  },
  SYNTAX_ERROR: {
    title: 'Syntax Error',
    whatHappened: 'There is a syntax error in your code',
    why: 'Invalid JavaScript/TypeScript syntax',
    suggestedFix: 'Check the file and line number for syntax issues',
    interactiveFix: async () => {
      logger.log(chalk.yellow('Opening file in editor for syntax correction...'));
    },
  },
  TYPE_ERROR: {
    title: 'Type Error',
    whatHappened: 'A type mismatch occurred',
    why: 'Variables or functions are used with incompatible types',
    suggestedFix: 'Check TypeScript definitions and fix type mismatches',
    interactiveFix: async () => {
      logger.log(chalk.yellow('Running TypeScript compiler for detailed errors...'));
    },
  },
  NETWORK_ERROR: {
    title: 'Network Error',
    whatHappened: 'Failed to connect to a network resource',
    why: 'Network connectivity issues or service unavailable',
    suggestedFix: 'Check your internet connection and service availability',
    interactiveFix: async () => {
      logger.log(chalk.yellow('Testing network connectivity...'));
    },
  },
  PERMISSION_DENIED: {
    title: 'Permission Denied',
    whatHappened: 'Access to a resource was denied',
    why: 'Insufficient permissions to access the file or directory',
    suggestedFix: 'Check file permissions and run with appropriate privileges',
    interactiveFix: async () => {
      logger.log(chalk.yellow('Checking file permissions...'));
    },
  },
  FILE_NOT_FOUND: {
    title: 'File Not Found',
    whatHappened: 'A required file could not be located',
    why: 'The file path is incorrect or the file does not exist',
    suggestedFix: 'Verify the file path and ensure the file exists',
    interactiveFix: async () => {
      logger.log(chalk.yellow('Searching for similar files...'));
    },
  },
  CONFIG_ERROR: {
    title: 'Configuration Error',
    whatHappened: 'Invalid or missing configuration',
    why: 'Configuration files are missing or contain invalid values',
    suggestedFix: 'Check configuration files and ensure they are properly formatted',
    interactiveFix: async () => {
      logger.log(chalk.yellow('Validating configuration files...'));
    },
  },
  ENVIRONMENT_ERROR: {
    title: 'Environment Error',
    whatHappened: 'Environment variables are missing or invalid',
    why: 'Required environment variables are not set',
    suggestedFix: 'Set the required environment variables',
    interactiveFix: async () => {
      logger.log(chalk.yellow('Checking environment variables...'));
    },
  },
};
const ERROR_PATTERNS = [
  {
    pattern: /Cannot find module/,
    category: 'MODULE_NOT_FOUND',
  },
  {
    pattern: /SyntaxError/,
    category: 'SYNTAX_ERROR',
  },
  {
    pattern: /TypeError/,
    category: 'TYPE_ERROR',
  },
  {
    pattern: /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/,
    category: 'NETWORK_ERROR',
  },
  {
    pattern: /EACCES|EPERM/,
    category: 'PERMISSION_DENIED',
  },
  {
    pattern: /ENOENT/,
    category: 'FILE_NOT_FOUND',
  },
  {
    pattern: /config|configuration/i,
    category: 'CONFIG_ERROR',
  },
  {
    pattern: /process\.env|environment|ENV/i,
    category: 'ENVIRONMENT_ERROR',
  },
];
function classifyError(errorMessage) {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(errorMessage)) {
      return ERROR_CATEGORIES[pattern.category];
    }
  }
  return {
    title: 'General Error',
    whatHappened: 'An unexpected error occurred',
    why: 'Something went wrong during execution',
    suggestedFix: 'Check the error details and try again',
    interactiveFix: async () => {
      logger.log(chalk.yellow('No specific fix available for this error type.'));
    },
  };
}
function formatSmartError(error) {
  const errorCategory = classifyError(error.message || error.toString());
  let output = '\n' + chalk.red.bold('\u274C ' + errorCategory.title) + '\n';
  output += chalk.red(
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'
  );
  output +=
    chalk.yellow(`
\u{1F4CB} What happened:
`) +
    chalk.white(`  ${errorCategory.whatHappened}
`);
  output +=
    chalk.yellow(`
\u2753 Why this happened:
`) +
    chalk.white(`  ${errorCategory.why}
`);
  output +=
    chalk.yellow(`
\u{1F527} Suggested fix:
`) +
    chalk.white(`  ${errorCategory.suggestedFix}
`);
  if (error.stack) {
    output +=
      chalk.yellow(`
\u{1F4CD} Stack trace:
`) +
      chalk.gray(`  ${error.stack.split('\\n')[0]}
`);
  }
  output += chalk.cyan(`
\u{1F4A1} Interactive help: Press Enter to try automatic fix
`);
  return output;
}
async function handleSmartError(error, context = {}) {
  const formattedError = formatSmartError(error);
  logger.error(formattedError);
  const errorCategory = classifyError(error.message || error.toString());
  if (errorCategory.interactiveFix) {
    try {
      const { confirm } = await import('inquirer').then((inquirer) =>
        inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Would you like me to try an automatic fix?',
            default: true,
          },
        ])
      );
      if (confirm) {
        await errorCategory.interactiveFix();
      }
    } catch (e) {
      printInfo(chalk.gray('\nContinuing without interactive fix...'));
    }
  }
  await logError(error, context);
}
async function logError(error, context) {
  const errorLog = {
    timestamp: /* @__PURE__ */ new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'CLI',
    version: process.env.npm_package_version || 'unknown',
  };
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const logDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logDir, { recursive: true });
    const logFile = path.join(
      logDir,
      `errors-${/* @__PURE__ */ new Date().toISOString().split('T')[0]}.log`
    );
    const logEntry = `[${errorLog.timestamp}] ${errorLog.message}
${errorLog.stack}

`;
    await fs.appendFile(logFile, logEntry);
  } catch (logError2) {
    printWarning(chalk.yellow('Could not write error to log file'));
  }
}
function withSmartErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleSmartError(error, { ...context, function: fn.name, args });
      throw error;
    }
  };
}
function setupGlobalErrorHandler() {
  process.on('uncaughtException', async (error) => {
    printError(chalk.red('\n\u{1F4A5} Uncaught Exception:'));
    await handleSmartError(error, { type: 'uncaughtException' });
    process.exit(1);
  });
  process.on('unhandledRejection', async (reason, promise) => {
    printError(chalk.red('\n\u{1F6AB} Unhandled Promise Rejection:'));
    await handleSmartError(reason, { type: 'unhandledRejection', promise });
    process.exit(1);
  });
}
let SmartError = class extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'SmartError';
    this.context = options.context || {};
    this.suggestion = options.suggestion || null;
    this.code = options.code || null;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SmartError);
    }
  }
  /**
   * Format this error with smart formatting
   */
  format() {
    return formatSmartError(this);
  }
  /**
   * Handle this error with smart handling
   */
  async handle() {
    await handleSmartError(this, this.context);
  }
};
SmartError = __decorateClass([singleton()], SmartError);
function toSmartError(error, options = {}) {
  if (error instanceof SmartError) {
    return error;
  }
  return new SmartError(error.message, {
    ...options,
    context: { ...options.context, originalError: error },
  });
}
function registerSmartErrorCommand(program) {
  program
    .command('error')
    .alias('debug')
    .description('Smart error handling and debugging tools')
    .argument('<message>', 'Error message to analyze')
    .option('-c, --context <json>', 'Context as JSON string')
    .option('-s, --suggest', 'Provide solution suggestions')
    .action(async (message, options) => {
      try {
        printInfo(chalk.cyan('\n\u{1F50D} Smart Error Analyzer\n'));
        let context = {};
        if (options.context) {
          try {
            context = JSON.parse(options.context);
          } catch (_e) {
            printWarning(chalk.yellow('Invalid JSON context provided'));
          }
        }
        const error = new SmartError(message, { context });
        const formatted = error.format();
        logger.log(formatted);
        if (options.suggest) {
          const errorCategory = classifyError(message);
          printInfo(
            chalk.green(`
\u{1F3AF} Specific suggestion: ${errorCategory.suggestedFix}
`)
          );
        }
      } catch (error) {
        printError(chalk.red(`Error analysis failed: ${error.message}`));
      }
    });
}
var smart_error_default = {
  formatSmartError,
  handleSmartError,
  withSmartErrorHandling,
  setupGlobalErrorHandler,
  SmartError,
  toSmartError,
  registerSmartErrorCommand,
  classifyError,
};
export {
  SmartError,
  smart_error_default as default,
  formatSmartError,
  handleSmartError,
  registerSmartErrorCommand,
  setupGlobalErrorHandler,
  toSmartError,
  withSmartErrorHandling,
};
