import chalk from '../../utils/chalk.js';
import { execSync } from 'child_process';
import { recordError } from '../analytics/index.js';
import { formatSmartError } from './smart-error.js';
import { logger } from './logging.js';
const ERROR_SOLUTIONS = {
  // Common CLI errors
  'command not found': {
    check: (msg) => msg.includes('command not found') || msg.includes('not recognized'),
    suggest: () => [
      'Make sure ultra-dex is installed: npm install -g ultra-dex',
      'Try using npx: npx ultra-dex <command>',
      'Check your PATH includes npm global bin',
    ],
  },
  // API key errors
  'api key': {
    check: (msg) =>
      msg.includes('api key') || msg.includes('API key') || msg.includes('authentication'),
    suggest: (msg) => {
      const provider = msg.includes('anthropic')
        ? 'Anthropic'
        : msg.includes('openai')
          ? 'OpenAI'
          : msg.includes('google')
            ? 'Google'
            : 'your AI provider';
      return [
        `Set your ${provider} API key: export ${provider.toUpperCase().replace(' ', '_')}_API_KEY=your_key`,
        'Run setup wizard: npx ultra-dex setup',
        'Check ~/.ultra-dex/config.json for configuration',
      ];
    },
  },
  // Network errors
  network: {
    check: (msg) =>
      msg.includes('network') || msg.includes('timeout') || msg.includes('ECONNREFUSED'),
    suggest: () => [
      'Check your internet connection',
      'Verify the server is running: npx ultra-dex serve',
      'Try again in a few moments',
      'Check if firewall is blocking connections',
    ],
  },
  // File not found
  'file not found': {
    check: (msg) => msg.includes('ENOENT') || msg.includes('no such file'),
    suggest: (msg) => {
      const file = msg.match(/'(.*?)'/)?.[1] || 'the file';
      return [
        `Create ${file}: npx ultra-dex init`,
        `Check if ${file} exists in current directory`,
        'Run from project root directory',
      ];
    },
  },
  // Port in use
  port: {
    check: (msg) => msg.includes('EADDRINUSE') || msg.includes('port is already in use'),
    suggest: (msg) => {
      const port = msg.match(/:(\d+)/)?.[1] || '3001';
      return [
        `Kill process on port ${port}: lsof -ti:${port} | xargs kill -9`,
        `Use different port: npx ultra-dex serve --port ${parseInt(port) + 1}`,
        "Check what's using the port: lsof -i :" + port,
      ];
    },
  },
  // Permission errors
  permission: {
    check: (msg) => msg.includes('EACCES') || msg.includes('permission denied'),
    suggest: () => [
      'Check file permissions: ls -la',
      'Run with sudo (if needed): sudo npx ultra-dex <command>',
      'Change file ownership: sudo chown -R $USER:$USER .',
      'Check directory write permissions',
    ],
  },
  // Git errors
  git: {
    check: (msg) => msg.includes('git') || msg.includes('not a git repository'),
    suggest: () => [
      'Initialize git: git init',
      "Check if you're in the right directory",
      'Install git if not available',
      'Run init with --skip-git to bypass',
    ],
  },
  // Docker errors
  docker: {
    check: (msg) => msg.includes('docker') || msg.includes('container'),
    suggest: () => [
      'Start Docker: open -a Docker (macOS) or sudo systemctl start docker (Linux)',
      'Check Docker status: docker ps',
      'Install Docker if not available',
      'Run without sandbox: --no-sandbox flag',
    ],
  },
  // Model not found
  model: {
    check: (msg) => msg.includes('model') || msg.includes('model not found'),
    suggest: () => [
      'Check available models: npx ultra-dex config --list-models',
      'Use default model by not specifying --model',
      'Update ultra-dex for latest models: npm update -g ultra-dex',
    ],
  },
  // Memory/SQLite errors
  database: {
    check: (msg) => msg.includes('sqlite') || msg.includes('database') || msg.includes('SQLITE'),
    suggest: () => [
      'Check database permissions in .ultra/memory/',
      'Reset memory: npx ultra-dex memory clear --force',
      'Ensure disk space is available',
      'Check if another process is using the database',
    ],
  },
  // Build/Test failures
  build_failure: {
    check: (msg) =>
      msg.includes('build failed') ||
      msg.includes('test failed') ||
      msg.includes('compilation error'),
    suggest: () => [
      chalk.green('Try automatic self-healing: ultra-dex autonomous --fix'),
      'Check the logs for specific error details',
      'Run ultra-dex verify to identify architectural gaps',
    ],
  },
};
async function handleError(error, context = {}) {
  const errorMessage = error.message || error.toString();
  const suggestions = getSuggestions(errorMessage);
  try {
    await recordError({
      message: errorMessage,
      command: context.command,
      stack: error.stack,
      metadata: context,
    });
  } catch {
    // Error recording is best-effort - don't fail if analytics is unavailable
  }
  logger.error(chalk.red('\n\u274C Error:'), errorMessage);
  const smart = formatSmartError(error);
  if (smart?.summary) {
    logger.log(smart.summary);
    logger.log(smart.why);
    if (smart.suggestions?.length) {
      logger.log(chalk.cyan('\nSuggested fixes:'));
      smart.suggestions.forEach((s) => logger.log(`  - ${s}`));
    }
  }
  if (suggestions.length > 0) {
    logger.log(chalk.cyan('\n\u{1F4A1} Suggestions:'));
    suggestions.forEach((suggestion, i) => {
      logger.log(chalk.white(`  ${i + 1}. ${suggestion}`));
    });
    logger.log();
  }
  if (errorMessage.toLowerCase().includes('build') || errorMessage.toLowerCase().includes('test')) {
    await offerAutoFix();
  }
  if (process.env.DEBUG) {
    logger.error(chalk.gray('\nDebug Info:'));
    logger.error(chalk.gray('  Context:'), JSON.stringify(context, null, 2));
    logger.error(chalk.gray('  Stack:'), error.stack);
  }
  return suggestions;
}
async function offerAutoFix() {
  const { default: inquirer } = await import('inquirer');
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.cyan('Detected build/test failure. Start autonomous self-healing?'),
      default: true,
    },
  ]);
  if (confirm) {
    logger.log(chalk.green('\n\u{1F680} Initiating Autonomous Fix...\n'));
    try {
      execSync('npx ultra-dex autonomous --fix', { stdio: 'inherit' });
    } catch (_e) {
      logger.error(chalk.red('Self-healing failed to launch.'));
    }
  }
}
function getSuggestions(errorMessage) {
  const suggestions = [];
  for (const [key, handler] of Object.entries(ERROR_SOLUTIONS)) {
    if (handler.check(errorMessage)) {
      const newSuggestions = handler.suggest(errorMessage);
      suggestions.push(...newSuggestions);
    }
  }
  return [...new Set(suggestions)];
}
function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  };
}
function formatError(error, command) {
  const lines = [
    chalk.red.bold(`Command failed: ${command}`),
    '',
    chalk.red('Error:') + ' ' + (error.message || error),
    '',
  ];
  const suggestions = getSuggestions(error.message || error.toString());
  if (suggestions.length > 0) {
    lines.push(chalk.cyan('Try these solutions:'));
    suggestions.forEach((s) => lines.push('  ' + chalk.white('\u2022') + ' ' + s));
    lines.push('');
  }
  lines.push(chalk.gray('Need more help? Run: ultra-dex --help'));
  lines.push(chalk.gray('Or visit: https://github.com/Srujan0798/Ultra-Dex#readme'));
  return lines.join('\n');
}

/**
 * Create a structured application error
 */
export function createError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;

  // Assign status codes based on common error codes
  const statusCodes = {
    VALIDATION_ERROR: 400,
    AUTHENTICATION_ERROR: 401,
    FORBIDDEN: 403,
    AUTHORIZATION_ERROR: 403,
    NOT_FOUND: 404,
    RESOURCE_NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    TIMEOUT_ERROR: 504,
  };

  error.statusCode = statusCodes[code] || 500;
  return error;
}

const RECOVERY_STRATEGIES = {
  /**
   * Retry an operation with exponential backoff and jitter
   * @param {Function} operation - Async operation to retry
   * @param {number} [maxAttempts=3] - Maximum retry attempts
   * @param {number} [delay=1000] - Initial delay in ms
   * @param {number} [maxDelay=30000] - Maximum delay in ms
   * @returns {Promise<any>} Operation result
   */
  async retry(operation, maxAttempts = 3, delay = 1e3, maxDelay = 3e4) {
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxAttempts) throw error;
        const baseDelay = Math.min(delay * Math.pow(2, i - 1), maxDelay);
        const jitter = Math.random() * 0.1 * baseDelay;
        const actualDelay = baseDelay + jitter;
        logger.log(
          chalk.yellow(
            `\u26A0\uFE0F  Attempt ${i}/${maxAttempts} failed, retrying in ${Math.round(actualDelay)}ms...`
          )
        );
        logger.log(chalk.gray(`   Error: ${error.message || error}`));
        await sleep(actualDelay);
      }
    }
  },
  /**
   * Execute an operation with a timeout
   * @param {Function} operation - Async operation
   * @param {number} [timeoutMs=30000] - Timeout in ms
   * @returns {Promise<any>} Operation result
   */
  async withTimeout(operation, timeoutMs = 3e4) {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  },
  /**
   * Execute with a fallback strategy on failure
   * @param {Function} primary - Primary operation
   * @param {Function} fallback - Fallback operation
   * @returns {Promise<any>} Result from primary or fallback
   */
  async withFallback(primary, fallback) {
    try {
      return await primary();
    } catch (error) {
      logger.log(chalk.yellow('\u26A0\uFE0F  Primary method failed, trying fallback...'));
      logger.log(chalk.gray(`   Original error: ${error.message || error}`));
      return await fallback();
    }
  },
  /**
   * Circuit breaker pattern to prevent cascading failures
   * @param {Function} operation - Operation to protect
   * @param {Object} options - Circuit breaker options
   * @returns {Promise<any>} Operation result
   */
  circuitBreaker(operation, options = {}) {
    const opts = {
      threshold: options.threshold || 5,
      // Number of failures before opening
      timeout: options.timeout || 6e4,
      // Time to wait before half-open state
      ...options,
    };
    let failures = 0;
    let openedAt = null;
    let state = 'CLOSED';
    return async function circuitBreakerWrapper() {
      if (state === 'OPEN') {
        if (Date.now() - openedAt > opts.timeout) {
          state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }
      try {
        const result = await operation();
        failures = 0;
        state = 'CLOSED';
        return result;
      } catch (error) {
        failures++;
        if (failures >= opts.threshold) {
          state = 'OPEN';
          openedAt = Date.now();
          logger.log(chalk.red(`\u{1F6A8} Circuit breaker OPEN after ${failures} failures`));
        }
        throw error;
      }
    };
  },
  /**
   * Bulkhead isolation - limit concurrent executions
   * @param {Function} operation - Operation to limit
   * @param {number} [maxConcurrency=5] - Maximum concurrent executions
   * @returns {Function} Limited operation
   */
  bulkhead(operation, maxConcurrency = 5) {
    const queue = [];
    let running = 0;
    return async function bulkheadWrapper(...args) {
      return new Promise((resolve, reject) => {
        queue.push({ args, resolve, reject });
        const processQueue = async () => {
          if (running >= maxConcurrency || queue.length === 0) return;
          running++;
          const { args: args2, resolve: resolve2, reject: reject2 } = queue.shift();
          try {
            const result = await operation(...args2);
            resolve2(result);
          } catch (error) {
            reject2(error);
          } finally {
            running--;
            processQueue();
          }
        };
        processQueue();
      });
    };
  },
  /**
   * Graceful degradation - try multiple approaches until one succeeds
   * @param {Array<Function>} operations - Array of operations to try
   * @returns {Promise<any>} Result from first successful operation
   */
  async degradeGracefully(operations) {
    let lastError;
    for (let i = 0; i < operations.length; i++) {
      try {
        const result = await operations[i]();
        logger.log(chalk.green(`\u2705 Approach ${i + 1} succeeded`));
        return result;
      } catch (error) {
        lastError = error;
        logger.log(chalk.yellow(`\u26A0\uFE0F  Approach ${i + 1} failed, trying next...`));
        if (i === operations.length - 1) {
          logger.log(chalk.red('\u274C All approaches failed'));
          throw lastError;
        }
      }
    }
  },
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var error_handler_default = {
  handleError,
  withErrorHandling,
  formatError,
  RECOVERY_STRATEGIES,
};
export {
  RECOVERY_STRATEGIES,
  error_handler_default as default,
  formatError,
  handleError,
  offerAutoFix,
  withErrorHandling,
};
