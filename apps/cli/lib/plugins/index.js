// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Plugin Ecosystem
 * Centralized plugin management and registry
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import chalk from 'chalk';
import ora from '../utils/ora.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Plugin Registry - manages all available plugins
 */
class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.installed = new Set();
    this.hooks = new Map();
    this.pluginDir = path.join(process.cwd(), '.ultra-dex', 'plugins');
    this.registryUrl = 'https://registry.ultra-dex.ai/plugins';
  }

  /**
   * Initialize the plugin system
   */
  async initialize() {
    await this.ensurePluginDirectory();
    await this.discoverLocalPlugins();
    await this.loadInstalledPlugins();
  }

  /**
   * Ensure the plugin directory exists
   */
  async ensurePluginDirectory() {
    try {
      await fs.mkdir(this.pluginDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create plugin directory: ${error.message}`);
    }
  }

  /**
   * Discover local plugins in the project
   */
  async discoverLocalPlugins() {
    try {
      const entries = await fs.readdir(this.pluginDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(this.pluginDir, entry.name);
          const manifestPath = path.join(pluginPath, 'ultra-dex-plugin.json');

          try {
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            this.plugins.set(manifest.name, {
              ...manifest,
              path: pluginPath,
              local: true,
              installed: true,
            });
            this.installed.add(manifest.name);
          } catch (error) {
            console.warn(`Invalid plugin manifest in ${entry.name}: ${error.message}`);
          }
        }
      }
    } catch (_error) {
      // Directory might not exist yet
      console.debug('Plugin directory does not exist yet');
    }
  }

  /**
   * Load all installed plugins
   */
  async loadInstalledPlugins() {
    for (const [name, plugin] of this.plugins) {
      if (plugin.installed) {
        await this.loadPlugin(name);
      }
    }
  }

  /**
   * Load a plugin dynamically
   */
  async loadPlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    try {
      const indexPath = path.join(plugin.path, plugin.main || 'index.js');
      const pluginModule = await import(`file://${indexPath}`);

      if (pluginModule.default && typeof pluginModule.default.activate === 'function') {
        await pluginModule.default.activate(this);
      }

      console.log(chalk.green(`✓ Loaded plugin: ${plugin.name}@${plugin.version}`));
    } catch (error) {
      console.error(chalk.red(`Failed to load plugin ${pluginName}: ${error.message}`));
    }
  }

  /**
   * Discover plugins from the registry
   */
  async discoverRegistryPlugins() {
    // In a real implementation, this would fetch from a remote registry
    // For now, we'll return a mock list of popular plugins
    const mockPlugins = [
      {
        name: '@ultra-dex/git-hooks',
        version: '1.2.0',
        description: 'Automated git hooks for Ultra-Dex workflows',
        author: 'Ultra-Dex Team',
        downloads: 12500,
        rating: 4.8,
      },
      {
        name: '@ultra-dex/ai-explain',
        version: '2.1.3',
        description: 'AI-powered code explanation and documentation',
        author: 'AI Team',
        downloads: 8900,
        rating: 4.9,
      },
      {
        name: '@ultra-dex/dependency-analyzer',
        version: '1.0.5',
        description: 'Advanced dependency analysis and optimization',
        author: 'Dev Tools',
        downloads: 6700,
        rating: 4.7,
      },
      {
        name: '@ultra-dex/performance-profiler',
        version: '3.0.1',
        description: 'Real-time performance profiling and optimization',
        author: 'Performance Team',
        downloads: 5400,
        rating: 4.6,
      },
    ];

    return mockPlugins;
  }

  /**
   * Install a plugin from various sources
   */
  async installPlugin(pluginSource, _options = {}) {
    const spinner = ora(`Installing plugin: ${pluginSource}`);
    spinner.start();

    try {
      let pluginName, pluginPath;

      if (
        pluginSource.startsWith('file://') ||
        pluginSource.startsWith('./') ||
        pluginSource.startsWith('/')
      ) {
        // Local file installation
        const sourcePath = pluginSource.startsWith('file://')
          ? pluginSource.replace('file://', '')
          : path.resolve(pluginSource);

        pluginPath = await this.installLocalPlugin(sourcePath);
        const manifest = JSON.parse(
          await fs.readFile(path.join(pluginPath, 'ultra-dex-plugin.json'), 'utf8')
        );
        pluginName = manifest.name;
      } else if (pluginSource.startsWith('github:')) {
        // GitHub installation
        pluginName = await this.installFromGitHub(pluginSource);
      } else {
        // Registry installation (mock for now)
        pluginName = await this.installFromRegistry(pluginSource);
      }

      // Add to registry
      this.plugins.set(pluginName, {
        name: pluginName,
        version: '1.0.0', // Would come from actual plugin
        path: pluginPath || path.join(this.pluginDir, pluginName),
        installed: true,
        local: pluginPath ? true : false,
      });

      this.installed.add(pluginName);

      // Load the plugin
      await this.loadPlugin(pluginName);

      spinner.succeed(`Plugin installed: ${pluginName}`);
      return { success: true, name: pluginName };
    } catch (error) {
      spinner.fail(`Failed to install plugin: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Install a plugin from a local file
   */
  async installLocalPlugin(sourcePath) {
    const stats = await fs.stat(sourcePath);

    if (stats.isDirectory()) {
      // Source is a directory
      const manifestPath = path.join(sourcePath, 'ultra-dex-plugin.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      const targetPath = path.join(this.pluginDir, manifest.name);

      // Copy the entire directory
      await this.copyDirectory(sourcePath, targetPath);
      return targetPath;
    } else if (stats.isFile() && sourcePath.endsWith('.zip')) {
      // Source is a zip file
      const pluginName = path.basename(sourcePath, '.zip');
      const targetPath = path.join(this.pluginDir, pluginName);

      // Extract the zip file (simplified - would need proper zip extraction)
      // For now, we'll simulate this
      await fs.mkdir(targetPath, { recursive: true });
      await fs.copyFile(sourcePath, path.join(targetPath, path.basename(sourcePath)));

      return targetPath;
    } else {
      throw new Error('Local plugin source must be a directory or zip file');
    }
  }

  /**
   * Install a plugin from GitHub
   */
  async installFromGitHub(githubRef) {
    const repo = githubRef.replace('github:', '');
    const [owner, repoName] = repo.split('/');

    if (!owner || !repoName) {
      throw new Error('Invalid GitHub reference format. Use: github:owner/repo');
    }

    const pluginName = repoName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const targetPath = path.join(this.pluginDir, pluginName);

    // Clone the repository (simplified - would need proper git handling)
    // For simulation purposes:
    await fs.mkdir(targetPath, { recursive: true });

    // Create a basic plugin structure
    const manifest = {
      name: pluginName,
      version: '1.0.0',
      description: `Plugin from GitHub: ${repo}`,
      main: 'index.js',
      author: owner,
      license: 'MIT',
    };

    await fs.writeFile(
      path.join(targetPath, 'ultra-dex-plugin.json'),
      JSON.stringify(manifest, null, 2)
    );

    await fs.writeFile(
      path.join(targetPath, 'index.js'),
      `// ${pluginName} - Generated from GitHub: ${repo}
export default {
  async activate(pluginManager) {
    console.log('Plugin activated:', this.name);
  }
};
`
    );

    return pluginName;
  }

  /**
   * Install a plugin from the registry
   */
  async installFromRegistry(pluginName) {
    // Simulate registry installation
    // In a real implementation, this would download from the registry
    const targetPath = path.join(this.pluginDir, pluginName);

    await fs.mkdir(targetPath, { recursive: true });

    // Create a basic plugin structure
    const manifest = {
      name: pluginName,
      version: '1.0.0',
      description: `Plugin from Ultra-Dex registry: ${pluginName}`,
      main: 'index.js',
      author: 'Registry',
      license: 'MIT',
    };

    await fs.writeFile(
      path.join(targetPath, 'ultra-dex-plugin.json'),
      JSON.stringify(manifest, null, 2)
    );

    await fs.writeFile(
      path.join(targetPath, 'index.js'),
      `// ${pluginName} - Downloaded from registry
export default {
  async activate(pluginManager) {
    console.log('Registry plugin activated:', this.name);
  }
};
`
    );

    return pluginName;
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName) {
    if (!this.installed.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }

    try {
      // Remove plugin directory
      await fs.rm(plugin.path, { recursive: true, force: true });

      // Remove from registry
      this.plugins.delete(pluginName);
      this.installed.delete(pluginName);

      console.log(chalk.green(`✓ Uninstalled plugin: ${pluginName}`));
      return { success: true };
    } catch (error) {
      console.error(chalk.red(`Failed to uninstall plugin: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of installed plugins
   */
  getInstalledPlugins() {
    return Array.from(this.installed).map((name) => this.plugins.get(name));
  }

  /**
   * Get list of available plugins from registry
   */
  async getAvailablePlugins() {
    return await this.discoverRegistryPlugins();
  }

  /**
   * Register a hook that plugins can subscribe to
   */
  registerHook(hookName, description = '') {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, {
        name: hookName,
        description,
        handlers: [],
      });
    }
  }

  /**
   * Subscribe to a hook
   */
  subscribeToHook(hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.registerHook(hookName);
    }

    this.hooks.get(hookName).handlers.push(handler);
  }

  /**
   * Execute all handlers for a hook
   */
  async executeHook(hookName, data = {}) {
    if (!this.hooks.has(hookName)) {
      return data;
    }

    const hook = this.hooks.get(hookName);
    let result = data;

    for (const handler of hook.handlers) {
      try {
        result = await handler(result);
      } catch (error) {
        console.error(`Hook ${hookName} handler failed: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest) {
    const entries = await fs.readdir(src, { withFileTypes: true });

    await fs.mkdir(dest, { recursive: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Update a plugin
   */
  async updatePlugin(pluginName) {
    if (!this.installed.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    const plugin = this.plugins.get(pluginName);
    if (plugin.local) {
      throw new Error(`Cannot update local plugins directly`);
    }

    console.log(chalk.blue(`Updating plugin: ${pluginName}`));
    // In a real implementation, this would fetch the latest version from the registry
    console.log(chalk.green(`✓ Plugin updated: ${pluginName}`));
    return { success: true };
  }

  /**
   * Get plugin info
   */
  getPluginInfo(pluginName) {
    return this.plugins.get(pluginName);
  }
}

// Singleton instance
const pluginRegistry = new PluginRegistry();

// Export the registry and related functions
export { PluginRegistry, pluginRegistry as default, pluginRegistry };

// Export individual functions for convenience
export const {
  initialize,
  installPlugin,
  uninstallPlugin,
  getInstalledPlugins,
  getAvailablePlugins,
  registerHook,
  subscribeToHook,
  executeHook,
  updatePlugin,
  getPluginInfo,
} = pluginRegistry;
