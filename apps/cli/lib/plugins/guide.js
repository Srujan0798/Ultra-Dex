// Copyright (c) 2026 Ultra-Dex

/**
 * Plugin Development Guide
 * How to create and distribute Ultra-Dex plugins
 */

// Example plugin manifest file: ultra-dex-plugin.json
const EXAMPLE_MANIFEST = {
  name: 'my-awesome-plugin',
  version: '1.0.0',
  description: 'Does awesome things with Ultra-Dex',
  main: 'index.js',
  author: 'Your Name',
  license: 'MIT',
  keywords: ['ultra-dex', 'ai', 'development'],
  hooks: ['pre-build', 'post-generate', 'before-command-execution'],
  commands: [
    {
      name: 'my-command',
      description: 'Custom command provided by plugin',
      usage: 'ultra-dex my-command [options]',
    },
  ],
  dependencies: {
    'ultra-dex': '>=3.0.0',
  },
  repository: {
    type: 'git',
    url: 'https://github.com/username/my-awesome-plugin.git',
  },
};

// Capability manifest (required for v4.1+)
const CAPABILITY_MANIFEST_EXAMPLE = {
  name: 'my-awesome-plugin',
  version: '1.0.0',
  tools: [
    {
      name: 'write_code',
      type: 'mutation',
      sideEffects: ['filesystem:write'],
      rateLimit: { max: 10, window: '1m' },
      riskScore: 'high',
      requiresApproval: true,
    },
  ],
};

// Example plugin implementation
const EXAMPLE_PLUGIN_CODE = `
// index.js - Example Ultra-Dex Plugin
import { printInfo, printSuccess } from '../utils/output.js';
import chalk from 'chalk';

export default {
  // Called when plugin is loaded
  async activate(pluginManager, cliProgram) {
    console.log('My plugin activated!');
    
    // Register hooks
    pluginManager.subscribeToHook('pre-build', async (context) => {
      console.log('About to build:', context);
    });

    pluginManager.subscribeToHook('post-generate', async (context) => {
      console.log('Generated:', context);
      printSuccess(chalk.green('✓ Custom post-generation task completed'));
    });
    
    // Register custom command
    cliProgram
      .command('my-command')
      .description('My custom plugin command')
      .option('-v, --verbose', 'Enable verbose output')
      .action(async (options) => {
        printInfo(chalk.blue('Running my custom plugin command'));
        if (options.verbose) {
          printInfo(chalk.gray('Verbose mode enabled'));
        }
        // Your command logic here
      });
  },

  // Called when plugin is unloaded
  async deactivate() {
    console.log('My plugin deactivated');
  }
};
`;

// Plugin development best practices
const BEST_PRACTICES = {
  performance: 'Keep plugin initialization lightweight',
  compatibility: 'Test against multiple Ultra-Dex versions',
  error_handling: 'Always handle errors gracefully',
  documentation: 'Provide clear usage instructions',
  security: 'Validate all inputs and sanitize data',
  modularity: 'Keep plugins focused on specific functionality',
};

// Common hook types
const HOOK_TYPES = {
  'before-command-execution': 'Called before any Ultra-Dex command executes',
  'after-command-execution': 'Called after any Ultra-Dex command completes',
  'pre-build': 'Called before build process starts',
  'post-build': 'Called after build process completes',
  'pre-generate': 'Called before code generation',
  'post-generate': 'Called after code generation',
  'pre-commit': 'Called before git commit (if git hooks enabled)',
  'validation-error': 'Called when validation errors occur',
  'project-initialize': 'Called when initializing a new project',
  'agent-start': 'Called when an agent starts processing',
  'agent-complete': 'Called when an agent completes processing',
};

export { EXAMPLE_MANIFEST, EXAMPLE_PLUGIN_CODE, BEST_PRACTICES, HOOK_TYPES };

export default {
  EXAMPLE_MANIFEST,
  CAPABILITY_MANIFEST_EXAMPLE,
  EXAMPLE_PLUGIN_CODE,
  BEST_PRACTICES,
  HOOK_TYPES,
};

/**
 * Safe execution wrapper with error handling for guide
 * @param {Function} fn - Async function to execute
 * @param {string} [context='guide'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'guide') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
