/**
 * Enhanced error handling with smart suggestions
 * Provides helpful fixes when commands fail
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { recordError } from '../analytics/index.js';

// Error patterns and their solutions
const ERROR_SOLUTIONS = {
  // Common CLI errors
  'command not found': {
    check: (msg) => msg.includes('command not found') || msg.includes('not recognized'),
    suggest: () => [
      'Make sure ultra-dex is installed: npm install -g ultra-dex',
      'Try using npx: npx ultra-dex <command>',
      'Check your PATH includes npm global bin'
    ]
  },
  
  // API key errors
  'api key': {
    check: (msg) => msg.includes('api key') || msg.includes('API key') || msg.includes('authentication'),
    suggest: (msg) => {
      const provider = msg.includes('anthropic') ? 'Anthropic' : 
                      msg.includes('openai') ? 'OpenAI' :
                      msg.includes('google') ? 'Google' : 'your AI provider';
      return [
        `Set your ${provider} API key: export ${provider.toUpperCase().replace(' ', '_')}_API_KEY=your_key`,
        'Run setup wizard: npx ultra-dex setup',
        'Check ~/.ultra-dex/config.json for configuration'
      ];
    }
  },
  
  // Network errors
  'network': {
    check: (msg) => msg.includes('network') || msg.includes('timeout') || msg.includes('ECONNREFUSED'),
    suggest: () => [
      'Check your internet connection',
      'Verify the server is running: npx ultra-dex serve',
      'Try again in a few moments',
      'Check if firewall is blocking connections'
    ]
  },
  
  // File not found
  'file not found': {
    check: (msg) => msg.includes('ENOENT') || msg.includes('no such file'),
    suggest: (msg) => {
      const file = msg.match(/'(.*?)'/)?.[1] || 'the file';
      return [
        `Create ${file}: npx ultra-dex init`,
        `Check if ${file} exists in current directory`,
        'Run from project root directory'
      ];
    }
  },
  
  // Port in use
  'port': {
    check: (msg) => msg.includes('EADDRINUSE') || msg.includes('port is already in use'),
    suggest: (msg) => {
      const port = msg.match(/:(\d+)/)?.[1] || '3001';
      return [
        `Kill process on port ${port}: lsof -ti:${port} | xargs kill -9`,
        `Use different port: npx ultra-dex serve --port ${parseInt(port) + 1}`,
        'Check what\'s using the port: lsof -i :' + port
      ];
    }
  },
  
  // Permission errors
  'permission': {
    check: (msg) => msg.includes('EACCES') || msg.includes('permission denied'),
    suggest: () => [
      'Check file permissions: ls -la',
      'Run with sudo (if needed): sudo npx ultra-dex <command>',
      'Change file ownership: sudo chown -R $USER:$USER .',
      'Check directory write permissions'
    ]
  },
  
  // Git errors
  'git': {
    check: (msg) => msg.includes('git') || msg.includes('not a git repository'),
    suggest: () => [
      'Initialize git: git init',
      'Check if you\'re in the right directory',
      'Install git if not available',
      'Run init with --skip-git to bypass'
    ]
  },
  
  // Docker errors
  'docker': {
    check: (msg) => msg.includes('docker') || msg.includes('container'),
    suggest: () => [
      'Start Docker: open -a Docker (macOS) or sudo systemctl start docker (Linux)',
      'Check Docker status: docker ps',
      'Install Docker if not available',
      'Run without sandbox: --no-sandbox flag'
    ]
  },
  
  // Model not found
  'model': {
    check: (msg) => msg.includes('model') || msg.includes('model not found'),
    suggest: () => [
      'Check available models: npx ultra-dex config --list-models',
      'Use default model by not specifying --model',
      'Update ultra-dex for latest models: npm update -g ultra-dex'
    ]
  },
  
  // Memory/SQLite errors
  'database': {
    check: (msg) => msg.includes('sqlite') || msg.includes('database') || msg.includes('SQLITE'),
    suggest: () => [
      'Check database permissions in .ultra/memory/',
      'Reset memory: npx ultra-dex memory clear --force',
      'Ensure disk space is available',
      'Check if another process is using the database'
    ]
  },
  
  // Build/Test failures
  'build_failure': {
    check: (msg) => msg.includes('build failed') || msg.includes('test failed') || msg.includes('compilation error'),
    suggest: () => [
      chalk.green('Try automatic self-healing: ultra-dex autonomous --fix'),
      'Check the logs for specific error details',
      'Run ultra-dex verify to identify architectural gaps'
    ]
  }
};

/**
 * Analyze error and provide helpful suggestions
 */
export async function handleError(error, context = {}) {
  const errorMessage = error.message || error.toString();
  const suggestions = getSuggestions(errorMessage);

  try {
    await recordError({
      message: errorMessage,
      command: context.command,
      stack: error.stack,
      metadata: context
    });
  } catch {
    // Analytics should never block error handling
  }
  
  console.error(chalk.red('\n❌ Error:'), errorMessage);
  
  if (suggestions.length > 0) {
    console.log(chalk.cyan('\n💡 Suggestions:'));
    suggestions.forEach((suggestion, i) => {
      console.log(chalk.white(`  ${i + 1}. ${suggestion}`));
    });
    console.log();
  }

  // Offer Auto-Fix if relevant
  if (errorMessage.toLowerCase().includes('build') || errorMessage.toLowerCase().includes('test')) {
      await offerAutoFix();
  }
  
  // Log error for debugging
  if (process.env.DEBUG) {
    console.error(chalk.gray('\nDebug Info:'));
    console.error(chalk.gray('  Context:'), JSON.stringify(context, null, 2));
    console.error(chalk.gray('  Stack:'), error.stack);
  }
  
  return suggestions;
}

export async function offerAutoFix() {
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: chalk.cyan('Detected build/test failure. Start autonomous self-healing?'),
            default: true
        }
    ]);

    if (confirm) {
        console.log(chalk.green('\n🚀 Initiating Autonomous Fix...\n'));
        try {
            execSync('npx ultra-dex autonomous --fix', { stdio: 'inherit' });
        } catch (e) {
            console.error(chalk.red('Self-healing failed to launch.'));
        }
    }
}

/**
 * Get suggestions for an error message
 */
function getSuggestions(errorMessage) {
  const suggestions = [];
  
  for (const [key, handler] of Object.entries(ERROR_SOLUTIONS)) {
    if (handler.check(errorMessage)) {
      const newSuggestions = handler.suggest(errorMessage);
      suggestions.push(...newSuggestions);
    }
  }
  
  // Remove duplicates while preserving order
  return [...new Set(suggestions)];
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw for upstream handling
    }
  };
}

/**
 * Create a user-friendly error message
 */
export function formatError(error, command) {
  const lines = [
    chalk.red.bold(`Command failed: ${command}`),
    '',
    chalk.red('Error:') + ' ' + (error.message || error),
    ''
  ];
  
  const suggestions = getSuggestions(error.message || error.toString());
  if (suggestions.length > 0) {
    lines.push(chalk.cyan('Try these solutions:'));
    suggestions.forEach(s => lines.push('  ' + chalk.white('•') + ' ' + s));
    lines.push('');
  }
  
  lines.push(chalk.gray('Need more help? Run: ultra-dex --help'));
  lines.push(chalk.gray('Or visit: https://github.com/Srujan0798/Ultra-Dex#readme'));
  
  return lines.join('\n');
}

/**
 * Recovery strategies for common failures
 */
export const RECOVERY_STRATEGIES = {
  async retry(operation, maxAttempts = 3, delay = 1000) {
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxAttempts) throw error;
        console.log(chalk.yellow(`⚠️  Attempt ${i} failed, retrying in ${delay}ms...`));
        await sleep(delay);
        delay *= 2; // Exponential backoff
      }
    }
  },
  
  async withTimeout(operation, timeoutMs = 30000) {
    return Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ]);
  },
  
  async withFallback(primary, fallback) {
    try {
      return await primary();
    } catch (error) {
      console.log(chalk.yellow('⚠️  Primary method failed, trying fallback...'));
      return await fallback();
    }
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  handleError,
  withErrorHandling,
  formatError,
  RECOVERY_STRATEGIES
};
