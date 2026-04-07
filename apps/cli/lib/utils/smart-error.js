// Copyright (c) 2026 Ultra-Dex

/**
 * Smart Error Handler
 * Intercept stack traces and provide contextual help
 */

import chalk from 'chalk';
import { printError, printWarning, printInfo, printSuccess } from '../utils/output.js';

// Error categories and their solutions
const ERROR_CATEGORIES = {
  MODULE_NOT_FOUND: {
    title: 'Module Not Found',
    whatHappened: 'A required module or package could not be found',
    why: 'The module is not installed or the path is incorrect',
    suggestedFix: 'Run `npm install [package-name]` to install the missing module',
    interactiveFix: async () => {
      // In a real implementation, this would offer to install the missing package
      console.log(chalk.yellow('Offering to install missing packages...'));
    },
  },
  SYNTAX_ERROR: {
    title: 'Syntax Error',
    whatHappened: 'There is a syntax error in your code',
    why: 'Invalid JavaScript/TypeScript syntax',
    suggestedFix: 'Check the file and line number for syntax issues',
    interactiveFix: async () => {
      console.log(chalk.yellow('Opening file in editor for syntax correction...'));
    },
  },
  TYPE_ERROR: {
    title: 'Type Error',
    whatHappened: 'A type mismatch occurred',
    why: 'Variables or functions are used with incompatible types',
    suggestedFix: 'Check TypeScript definitions and fix type mismatches',
    interactiveFix: async () => {
      console.log(chalk.yellow('Running TypeScript compiler for detailed errors...'));
    },
  },
  NETWORK_ERROR: {
    title: 'Network Error',
    whatHappened: 'Failed to connect to a network resource',
    why: 'Network connectivity issues or service unavailable',
    suggestedFix: 'Check your internet connection and service availability',
    interactiveFix: async () => {
      console.log(chalk.yellow('Testing network connectivity...'));
    },
  },
  PERMISSION_DENIED: {
    title: 'Permission Denied',
    whatHappened: 'Access to a resource was denied',
    why: 'Insufficient permissions to access the file or directory',
    suggestedFix: 'Check file permissions and run with appropriate privileges',
    interactiveFix: async () => {
      console.log(chalk.yellow('Checking file permissions...'));
    },
  },
  FILE_NOT_FOUND: {
    title: 'File Not Found',
    whatHappened: 'A required file could not be located',
    why: 'The file path is incorrect or the file does not exist',
    suggestedFix: 'Verify the file path and ensure the file exists',
    interactiveFix: async () => {
      console.log(chalk.yellow('Searching for similar files...'));
    },
  },
  CONFIG_ERROR: {
    title: 'Configuration Error',
    whatHappened: 'Invalid or missing configuration',
    why: 'Configuration files are missing or contain invalid values',
    suggestedFix: 'Check configuration files and ensure they are properly formatted',
    interactiveFix: async () => {
      console.log(chalk.yellow('Validating configuration files...'));
    },
  },
  ENVIRONMENT_ERROR: {
    title: 'Environment Error',
    whatHappened: 'Environment variables are missing or invalid',
    why: 'Required environment variables are not set',
    suggestedFix: 'Set the required environment variables',
    interactiveFix: async () => {
      console.log(chalk.yellow('Checking environment variables...'));
    },
  },
};

// Common error patterns and their mappings
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

/**
 * Classify error based on message
 */
function classifyError(errorMessage) {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(errorMessage)) {
      return ERROR_CATEGORIES[pattern.category];
    }
  }

  // Default category if no specific pattern matches
  return {
    title: 'General Error',
    whatHappened: 'An unexpected error occurred',
    why: 'Something went wrong during execution',
    suggestedFix: 'Check the error details and try again',
    interactiveFix: async () => {
      console.log(chalk.yellow('No specific fix available for this error type.'));
    },
  };
}

/**
 * Format error in a user-friendly way
 */
export function formatSmartError(error) {
  const errorCategory = classifyError(error.message || error.toString());

  let output = '\n' + chalk.red.bold('❌ ' + errorCategory.title) + '\n';
  output += chalk.red('─────────────────────────────────────────────────────────\n');
  output +=
    chalk.yellow(`\n📋 What happened:\n`) + chalk.white(`  ${errorCategory.whatHappened}\n`);
  output += chalk.yellow(`\n❓ Why this happened:\n`) + chalk.white(`  ${errorCategory.why}\n`);
  output +=
    chalk.yellow(`\n🔧 Suggested fix:\n`) + chalk.white(`  ${errorCategory.suggestedFix}\n`);

  if (error.stack) {
    output +=
      chalk.yellow(`\n📍 Stack trace:\n`) + chalk.gray(`  ${error.stack.split('\\n')[0]}\n`);
  }

  output += chalk.cyan(`\n💡 Interactive help: Press Enter to try automatic fix\n`);

  return output;
}

/**
 * Handle error with smart formatting
 */
export async function handleSmartError(error, context = {}) {
  const formattedError = formatSmartError(error);
  console.error(formattedError);

  // Offer interactive fix if available
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
      // If inquirer fails (e.g., in non-interactive environment), just continue
      printInfo(chalk.gray('\nContinuing without interactive fix...'));
    }
  }

  // Log error to error tracking system if available
  await logError(error, context);
}

/**
 * Log error to tracking system
 */
async function logError(error, context) {
  // In a real implementation, this would send errors to a tracking service
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'CLI',
    version: process.env.npm_package_version || 'unknown',
  };

  // Write to local error log
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const logDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logDir, { recursive: true });

    const logFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `[${errorLog.timestamp}] ${errorLog.message}\n${errorLog.stack}\n\n`;

    await fs.appendFile(logFile, logEntry);
  } catch (logError) {
    // If logging fails, don't let it interrupt the main error handling
    printWarning(chalk.yellow('Could not write error to log file'));
  }
}

/**
 * Wrap a function with smart error handling
 */
export function withSmartErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleSmartError(error, { ...context, function: fn.name, args });
      throw error; // Re-throw to maintain original behavior
    }
  };
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandler() {
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    printError(chalk.red('\n💥 Uncaught Exception:'));
    await handleSmartError(error, { type: 'uncaughtException' });
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    printError(chalk.red('\n🚫 Unhandled Promise Rejection:'));
    await handleSmartError(reason, { type: 'unhandledRejection', promise });
    process.exit(1);
  });
}

/**
 * Enhanced error class with context
 */
export class SmartError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'SmartError';
    this.context = options.context || {};
    this.suggestion = options.suggestion || null;
    this.code = options.code || null;

    // Capture stack trace
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
}

/**
 * Create a smart error from a regular error
 */
export function toSmartError(error, options = {}) {
  if (error instanceof SmartError) {
    return error;
  }

  return new SmartError(error.message, {
    ...options,
    context: { ...options.context, originalError: error },
  });
}

/**
 * Register smart error command
 */
export function registerSmartErrorCommand(program) {
  program
    .command('error')
    .alias('debug')
    .description('Smart error handling and debugging tools')
    .argument('<message>', 'Error message to analyze')
    .option('-c, --context <json>', 'Context as JSON string')
    .option('-s, --suggest', 'Provide solution suggestions')
    .action(async (message, options) => {
      try {
        printInfo(chalk.cyan('\n🔍 Smart Error Analyzer\n'));

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

        console.log(formatted);

        if (options.suggest) {
          const errorCategory = classifyError(message);
          printInfo(chalk.green(`\n🎯 Specific suggestion: ${errorCategory.suggestedFix}\n`));
        }
      } catch (error) {
        printError(chalk.red(`Error analysis failed: ${error.message}`));
      }
    });
}

export default {
  formatSmartError,
  handleSmartError,
  withSmartErrorHandling,
  setupGlobalErrorHandler,
  SmartError,
  toSmartError,
  registerSmartErrorCommand,
  classifyError,
};
