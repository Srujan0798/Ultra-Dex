import { singleton } from 'tsyringe';

// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Plugin System
 * Provides a modular architecture for extending Ultra-Dex functionality
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@singleton()
export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map(); // Hook name -> [plugin names]
    this.pluginDir = path.join(process.cwd(), '.ultra-dex', 'plugins');
    this.installedPlugins = new Set();
  }

  /**
   * Initialize the plugin system
   */
  async initialize(): Promise<void> {
    await this.ensurePluginDirectory();
    await this.loadInstalledPlugins();
  }

  /**
   * Ensure the plugin directory exists
   */
  async ensurePluginDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.pluginDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create plugin directory: ${error.message}`);
    }
  }

  /**
   * Load all installed plugins
   */
  async loadInstalledPlugins(): Promise<void> {
    try {
      const files = await fs.readdir(this.pluginDir);
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.mjs')) {
          await this.loadPlugin(path.join(this.pluginDir, file));
        }
      }
    } catch (error) {
      console.error(`Failed to load plugins: ${error.message}`);
    }
  }

  /**
   * Load a plugin from a file
   */
  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const pluginModule = await import(pluginPath);
      const plugin = pluginModule.default || pluginModule;

      if (!plugin.name || !plugin.version) {
        console.warn(`Plugin at ${pluginPath} missing required fields (name, version)`);
        return;
      }

      // Validate plugin structure
      if (typeof plugin.activate !== 'function') {
        console.warn(`Plugin ${plugin.name} missing activate function`);
        return;
      }

      this.plugins.set(plugin.name, {
        ...plugin,
        path: pluginPath,
        loaded: true,
      });

      this.installedPlugins.add(plugin.name);
      console.log(`Loaded plugin: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      console.error(`Failed to load plugin ${pluginPath}: ${error.message}`);
    }
  }

  /**
   * Register a hook that plugins can attach to
   */
  registerHook(hookName: string, _description = ''): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
  }

  /**
   * Attach a function to a hook
   */
  attachToHook(hookName: string, pluginName: string, callback: (...args: unknown[]) => unknown): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hook = this.hooks.get(hookName);
    hook.push({ pluginName, callback });
  }

  /**
   * Execute all functions attached to a hook
   */
  async executeHook(hookName: string, ...args: unknown[]): Promise<unknown> {
    if (!this.hooks.has(hookName)) {
      return args[0]; // Return original value if no hooks
    }

    let result = args.length > 0 ? args[0] : null;
    const hooks = this.hooks.get(hookName);

    for (const hook of hooks) {
      try {
        if (hook.callback && typeof hook.callback === 'function') {
          // If the hook function expects multiple args, pass them all
          // Otherwise, pass the current result
          if (hook.callback.length > 1) {
            result = await hook.callback(...args);
          } else {
            result = await hook.callback(result);
          }
        }
      } catch (error) {
        console.error(`Hook ${hookName} failed in plugin ${hook.pluginName}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Install a plugin from a local file or npm package
   */
  async installPlugin(pluginSource: string, _options = {}): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      let pluginPath;

      if (pluginSource.startsWith('.') || pluginSource.startsWith('/')) {
        // Local file
        pluginPath = path.resolve(pluginSource);
      } else {
        // NPM package installation coming in v3.6.0
        throw new Error(
          `NPM plugin installation coming in v3.6.0 (March 2026).\n\n` +
          `For now, install plugins from local files:\n` +
          `  ultra-dex plugin install ./path/to/plugin.js\n\n` +
          `Or clone from GitHub:\n` +
          `  git clone https://github.com/user/ultra-dex-plugin-name\n` +
          `  ultra-dex plugin install ./ultra-dex-plugin-name/index.js\n\n` +
          `Community plugins: https://github.com/topics/ultra-dex-plugin`
        );
      }

      // Validate plugin file exists
      await fs.access(pluginPath);

      // Copy plugin to local directory
      const fileName = path.basename(pluginPath);
      const targetPath = path.join(this.pluginDir, fileName);

      await fs.copyFile(pluginPath, targetPath);

      // Load the newly installed plugin
      await this.loadPlugin(targetPath);

      console.log(`Plugin installed: ${fileName}`);
      return { success: true, path: targetPath };
    } catch (error) {
      console.error(`Failed to install plugin: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName: string): Promise<{ success: boolean; error?: string }> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    // Remove from plugins map
    this.plugins.delete(pluginName);
    this.installedPlugins.delete(pluginName);

    // Remove plugin file
    try {
      await fs.unlink(plugin.path);
      console.log(`Plugin uninstalled: ${pluginName}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to remove plugin file: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of installed plugins
   */
  getInstalledPlugins(): Array<Record<string, unknown>> {
    return Array.from(this.plugins.values()).map((plugin) => ({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description || '',
      author: plugin.author || '',
      loaded: plugin.loaded,
    }));
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): unknown {
    return this.plugins.get(name);
  }

  /**
   * Activate all loaded plugins
   */
  async activatePlugins(cliProgram: unknown): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      try {
        if (typeof plugin.activate === 'function') {
          await plugin.activate(this, cliProgram);
          console.log(`Activated plugin: ${name}`);
        }
      } catch (error) {
        console.error(`Failed to activate plugin ${name}: ${error.message}`);
      }
    }
  }

  /**
   * Get all registered hooks
   */
  getHooks(): string[] {
    return Array.from(this.hooks.keys());
  }
}

// Singleton instance
export const pluginManager = new PluginManager();

// Export for use in other modules
export default pluginManager;
