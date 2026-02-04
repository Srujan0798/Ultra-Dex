/**
 * Plugin Integration Layer
 * Connects the plugin system with the main Ultra-Dex CLI
 */

import { pluginRegistry } from './index.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';
import chalk from 'chalk';

/**
 * Initialize plugins for the CLI
 */
export async function initializePlugins(cliProgram) {
  try {
    await pluginRegistry.initialize();
    
    // Register core hooks that plugins can subscribe to
    pluginRegistry.registerHook('before-command-execution', 'Called before any command executes');
    pluginRegistry.registerHook('after-command-execution', 'Called after any command executes');
    pluginRegistry.registerHook('pre-build', 'Called before build process starts');
    pluginRegistry.registerHook('post-build', 'Called after build process completes');
    pluginRegistry.registerHook('pre-generate', 'Called before code generation');
    pluginRegistry.registerHook('post-generate', 'Called after code generation');
    pluginRegistry.registerHook('pre-commit', 'Called before git commit (if git hooks enabled)');
    pluginRegistry.registerHook('validation-error', 'Called when validation errors occur');
    
    printSuccess(chalk.green('✓ Plugin system initialized'));
    
    // Activate all installed plugins with the CLI program
    const installedPlugins = pluginRegistry.getInstalledPlugins();
    for (const plugin of installedPlugins) {
      if (plugin.module && plugin.module.default) {
        try {
          // Give plugins access to the CLI program to register commands
          if (plugin.module.default.activate) {
            await plugin.module.default.activate(pluginRegistry, cliProgram);
          }
        } catch (error) {
          printError(chalk.red(`Plugin activation error (${plugin.name}): ${error.message}`));
        }
      }
    }
    
  } catch (error) {
    printError(chalk.red(`Plugin initialization failed: ${error.message}`));
  }
}

/**
 * Execute a hook across all subscribed plugins
 */
export async function executeHook(hookName, data = {}) {
  return await pluginRegistry.executeHook(hookName, data);
}

/**
 * Get plugin by name
 */
export function getPlugin(name) {
  return pluginRegistry.getPluginInfo(name);
}

/**
 * Check if a plugin is installed
 */
export function isPluginInstalled(name) {
  return pluginRegistry.getInstalledPlugins().some(p => p.name === name);
}

/**
 * Get all installed plugin names
 */
export function getInstalledPluginNames() {
  return pluginRegistry.getInstalledPlugins().map(p => p.name);
}

/**
 * Wrapper for plugin-safe command execution
 */
export async function executeCommandWithPlugins(commandName, args, options) {
  // Execute pre-command hook
  await executeHook('before-command-execution', {
    command: commandName,
    args,
    options,
    timestamp: Date.now()
  });
  
  let result;
  try {
    // Execute the actual command
    result = await executeOriginalCommand(commandName, args, options);
  } catch (error) {
    // Execute error hook if command fails
    await executeHook('validation-error', {
      command: commandName,
      error: error.message,
      timestamp: Date.now()
    });
    throw error;
  }
  
  // Execute post-command hook
  await executeHook('after-command-execution', {
    command: commandName,
    args,
    options,
    result,
    timestamp: Date.now()
  });
  
  return result;
}

// Placeholder for original command execution
async function executeOriginalCommand(commandName, args, options) {
  // This would normally call the actual command implementation
  // For now, returning a mock result
  return { success: true, command: commandName, executed: true };
}

export default {
  initializePlugins,
  executeHook,
  getPlugin,
  isPluginInstalled,
  getInstalledPluginNames,
  executeCommandWithPlugins
};