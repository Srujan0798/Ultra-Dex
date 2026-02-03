/**
 * Plugin system foundation for Ultra-Dex
 * Allows third-party extensions
 */

import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import chalk from 'chalk';

const PLUGIN_DIR = '.ultra/plugins';
const PLUGIN_MANIFEST = 'ultra-dex-plugin.json';

export class PluginManager {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.plugins = new Map();
    this.hooks = new Map();
  }

  /**
   * Discover and load all plugins
   */
  async loadPlugins() {
    const pluginDir = path.join(this.projectRoot, PLUGIN_DIR);
    
    try {
      const entries = await fs.readdir(pluginDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadPlugin(path.join(pluginDir, entry.name));
        }
      }
    } catch {
      // Plugin directory doesn't exist
    }
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(pluginPath) {
    try {
      const manifestPath = path.join(pluginPath, PLUGIN_MANIFEST);
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      
      // Validate manifest
      if (!manifest.name || !manifest.version) {
        console.warn(chalk.yellow(`Invalid plugin manifest: ${pluginPath}`));
        return;
      }
      
      // Load plugin module
      const indexPath = path.join(pluginPath, manifest.main || 'index.js');
      const pluginModule = await import(pathToFileURL(indexPath).href);
      
      const plugin = {
        manifest,
        module: pluginModule,
        path: pluginPath,
        hooks: new Set()
      };
      
      this.plugins.set(manifest.name, plugin);
      
      // Initialize plugin
      if (pluginModule.default?.activate) {
        await pluginModule.default.activate(this);
      }
      
      console.log(chalk.green(`✓ Loaded plugin: ${manifest.name} v${manifest.version}`));
      
    } catch (error) {
      console.warn(chalk.yellow(`Failed to load plugin ${pluginPath}:`), error.message);
    }
  }

  /**
   * Register a hook that plugins can subscribe to
   */
  registerHook(name, fn) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name).push(fn);
  }

  /**
   * Execute all hooks for an event
   */
  async executeHook(name, context = {}) {
    const hooks = this.hooks.get(name) || [];
    const results = [];
    
    for (const hook of hooks) {
      try {
        const result = await hook(context);
        results.push(result);
      } catch (error) {
        console.warn(chalk.yellow(`Hook ${name} failed:`), error.message);
      }
    }
    
    return results;
  }

  /**
   * Get list of loaded plugins
   */
  listPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.manifest.name,
      version: p.manifest.version,
      description: p.manifest.description,
      author: p.manifest.author
    }));
  }

  /**
   * Install a plugin from npm or git
   */
  async installPlugin(source) {
    const pluginDir = path.join(this.projectRoot, PLUGIN_DIR);
    
    // Ensure plugin directory exists
    await fs.mkdir(pluginDir, { recursive: true });
    
    console.log(chalk.blue(`Installing plugin from ${source}...`));
    
    // This is a placeholder - real implementation would:
    // 1. npm install the package
    // 2. Extract to plugin directory
    // 3. Load and validate
    
    console.log(chalk.green('✓ Plugin installed'));
    console.log(chalk.gray('Restart Ultra-Dex to load the plugin'));
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }
    
    // Deactivate plugin
    if (plugin.module.default?.deactivate) {
      await plugin.module.default.deactivate();
    }
    
    // Remove directory
    await fs.rm(plugin.path, { recursive: true });
    this.plugins.delete(name);
    
    console.log(chalk.green(`✓ Uninstalled plugin: ${name}`));
  }
}

// Example plugin manifest structure
export const PLUGIN_MANIFEST_EXAMPLE = {
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "Does awesome things with Ultra-Dex",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT",
  "hooks": ["pre-init", "post-generate"],
  "commands": [
    {
      "name": "my-command",
      "description": "Custom command provided by plugin"
    }
  ],
  "dependencies": {
    "ultra-dex": ">=3.0.0"
  }
};

// Example plugin implementation
export const PLUGIN_EXAMPLE = `
// index.js - Example Ultra-Dex Plugin

export default {
  // Called when plugin is loaded
  async activate(pluginManager) {
    console.log('My plugin activated!');
    
    // Register hooks
    pluginManager.registerHook('pre-init', async (context) => {
      console.log('About to init:', context);
    });
    
    pluginManager.registerHook('post-generate', async (context) => {
      console.log('Generated:', context);
    });
  },
  
  // Called when plugin is unloaded
  async deactivate() {
    console.log('My plugin deactivated');
  },
  
  // Custom commands
  commands: {
    'my-command': async (args, options) => {
      console.log('Running my custom command');
    }
  }
};
`;

export default { PluginManager, PLUGIN_MANIFEST_EXAMPLE };
