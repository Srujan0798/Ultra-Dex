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
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REQUIRED_PLUGIN_EXPORTS = ['name', 'version', 'activate'];
const OPTIONAL_PLUGIN_EXPORTS = ['deactivate', 'description', 'author', 'hooks', 'config'];
const PluginStatus = {
  DISCOVERED: 'discovered',
  INSTALLED: 'installed',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ERROR: 'error',
  UNINSTALLED: 'uninstalled',
};
let Plugin = class {
  constructor(metadata) {
    this.id = metadata.id;
    this.name = metadata.name;
    this.version = metadata.version;
    this.description = metadata.description || '';
    this.author = metadata.author || '';
    this.entryPoint = metadata.entryPoint;
    this.path = metadata.path;
    this.status = PluginStatus.DISCOVERED;
    this.config = metadata.config || {};
    this.hooks = /* @__PURE__ */ new Map();
    this.module = null;
    this.activatedAt = null;
    this.error = null;
    this.stats = {
      activations: 0,
      deactivations: 0,
      hookCalls: 0,
      errors: 0,
    };
  }
  /**
   * Get plugin dashboard data
   */
  getDashboard() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      status: this.status,
      author: this.author,
      activatedAt: this.activatedAt,
      hooks: Array.from(this.hooks.keys()),
      stats: { ...this.stats },
      error: this.error,
    };
  }
};
Plugin = __decorateClass([singleton()], Plugin);
let PluginManager = class {
  constructor(config = {}) {
    this.config = {
      pluginDirs: config.pluginDirs || [
        path.join(process.cwd(), 'packages', 'plugins'),
        path.join(process.cwd(), '.ultra-dex', 'plugins'),
      ],
      autoDiscover: config.autoDiscover !== false,
      allowHooks: config.allowHooks !== false,
      ...config,
    };
    this.plugins = /* @__PURE__ */ new Map();
    this.hooks = /* @__PURE__ */ new Map();
    this.hookStats = /* @__PURE__ */ new Map();
    this.initialized = false;
  }
  /**
   * Initialize the plugin manager
   */
  async initialize() {
    if (this.initialized) return;
    if (this.config.autoDiscover) {
      await this.discoverPlugins();
    }
    this.initialized = true;
  }
  /**
   * Auto-discover plugins in configured directories
   */
  async discoverPlugins() {
    const discovered = [];
    for (const pluginDir of this.config.pluginDirs) {
      try {
        const entries = await fs.readdir(pluginDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const pluginPath = path.join(pluginDir, entry.name);
          const plugin = await this.validatePluginDirectory(pluginPath);
          if (plugin && !this.plugins.has(plugin.id)) {
            this.plugins.set(plugin.id, plugin);
            discovered.push(plugin.id);
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`[PluginManager] Failed to scan ${pluginDir}: ${error.message}`);
        }
      }
    }
    return discovered;
  }
  /**
   * Validate a plugin directory has required files
   */
  async validatePluginDirectory(pluginPath) {
    try {
      const packageJsonPath = path.join(pluginPath, 'package.json');
      const indexPath = path.join(pluginPath, 'index.js');
      await fs.access(packageJsonPath);
      await fs.access(indexPath);
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const manifest = packageJson.manifest || packageJson;
      if (!manifest.id && !packageJson.name) {
        return null;
      }
      return new Plugin({
        id: manifest.id || packageJson.name.replace('@ultra-dex/plugin-', ''),
        name: manifest.name || packageJson.name,
        version: manifest.version || packageJson.version,
        description: manifest.description || packageJson.description,
        author: manifest.author || packageJson.author,
        entryPoint: manifest.entryPoint || 'index.js',
        config: manifest.configSchema || {},
        path: pluginPath,
      });
    } catch (_error) {
      return null;
    }
  }
  /**
   * Validate plugin module exports required interface
   */
  validatePluginModule(module, pluginId) {
    const missing = REQUIRED_PLUGIN_EXPORTS.filter((exp) => !(exp in module));
    if (missing.length > 0) {
      throw new Error(`Plugin "${pluginId}" missing required exports: ${missing.join(', ')}`);
    }
    if (typeof module.activate !== 'function') {
      throw new Error(`Plugin "${pluginId}" activate must be a function`);
    }
    return true;
  }
  /**
   * Install a plugin (load and validate)
   */
  async install(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found. Run discoverPlugins() first.`);
    }
    if (plugin.status === PluginStatus.INSTALLED || plugin.status === PluginStatus.ACTIVE) {
      return plugin;
    }
    try {
      const module = await import(path.join(plugin.path, plugin.entryPoint));
      this.validatePluginModule(module, pluginId);
      plugin.module = module;
      plugin.status = PluginStatus.INSTALLED;
      plugin.error = null;
      return plugin;
    } catch (error) {
      plugin.status = PluginStatus.ERROR;
      plugin.error = error.message;
      throw error;
    }
  }
  /**
   * Activate a plugin
   */
  async activate(pluginId, context = {}) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    if (plugin.status === PluginStatus.ACTIVE) {
      return plugin;
    }
    if (plugin.status !== PluginStatus.INSTALLED) {
      await this.install(pluginId);
    }
    try {
      if (plugin.module.deactivate) {
        plugin.deactivateFn = plugin.module.deactivate;
      }
      await plugin.module.activate(this, context.cliProgram || null);
      plugin.status = PluginStatus.ACTIVE;
      plugin.activatedAt = /* @__PURE__ */ new Date().toISOString();
      plugin.stats.activations++;
      plugin.error = null;
      return plugin;
    } catch (error) {
      plugin.status = PluginStatus.ERROR;
      plugin.error = error.message;
      plugin.stats.errors++;
      throw error;
    }
  }
  /**
   * Deactivate a plugin
   */
  async deactivate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    if (plugin.status !== PluginStatus.ACTIVE) {
      return plugin;
    }
    try {
      if (plugin.deactivateFn) {
        await plugin.deactivateFn(this);
      }
      this.unregisterPluginHooks(pluginId);
      plugin.status = PluginStatus.INACTIVE;
      plugin.stats.deactivations++;
      plugin.activatedAt = null;
      return plugin;
    } catch (error) {
      plugin.status = PluginStatus.ERROR;
      plugin.error = error.message;
      plugin.stats.errors++;
      throw error;
    }
  }
  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    if (plugin.status === PluginStatus.ACTIVE) {
      await this.deactivate(pluginId);
    }
    this.unregisterPluginHooks(pluginId);
    plugin.module = null;
    plugin.status = PluginStatus.UNINSTALLED;
    this.plugins.delete(pluginId);
    return true;
  }
  /**
   * Register a hook
   */
  registerHook(hookName, description = '') {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
      this.hookStats.set(hookName, { calls: 0, errors: 0 });
    }
    return this;
  }
  /**
   * Attach a handler to a hook
   */
  attachToHook(hookName, pluginId, handler) {
    if (!this.config.allowHooks) {
      return false;
    }
    if (!this.hooks.has(hookName)) {
      this.registerHook(hookName);
    }
    const handlers = this.hooks.get(hookName);
    handlers.push({ pluginId, handler });
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      if (!plugin.hooks.has(hookName)) {
        plugin.hooks.set(hookName, []);
      }
      plugin.hooks.get(hookName).push(handler);
    }
    return true;
  }
  /**
   * Execute all handlers for a hook
   */
  async executeHook(hookName, context = {}) {
    if (!this.config.allowHooks || !this.hooks.has(hookName)) {
      return context;
    }
    const handlers = this.hooks.get(hookName);
    const stats = this.hookStats.get(hookName);
    stats.calls++;
    let result = context;
    for (const { pluginId, handler } of handlers) {
      try {
        result = (await handler(result)) || result;
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
          plugin.stats.hookCalls++;
        }
      } catch (error) {
        stats.errors++;
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
          plugin.stats.errors++;
        }
        console.warn(
          `[PluginManager] Hook "${hookName}" failed for plugin "${pluginId}": ${error.message}`
        );
      }
    }
    return result;
  }
  /**
   * Unregister all hooks for a plugin
   */
  unregisterPluginHooks(pluginId) {
    for (const [hookName, handlers] of this.hooks.entries()) {
      const filtered = handlers.filter((h) => h.pluginId !== pluginId);
      this.hooks.set(hookName, filtered);
    }
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.hooks.clear();
    }
  }
  /**
   * List all plugins with their status
   */
  list() {
    return Array.from(this.plugins.values()).map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
      status: p.status,
      author: p.author,
    }));
  }
  /**
   * Get plugin manager statistics
   */
  getStats() {
    const plugins = Array.from(this.plugins.values());
    return {
      total: plugins.length,
      discovered: plugins.filter((p) => p.status === PluginStatus.DISCOVERED).length,
      installed: plugins.filter((p) => p.status === PluginStatus.INSTALLED).length,
      active: plugins.filter((p) => p.status === PluginStatus.ACTIVE).length,
      inactive: plugins.filter((p) => p.status === PluginStatus.INACTIVE).length,
      error: plugins.filter((p) => p.status === PluginStatus.ERROR).length,
      hooks: {
        registered: this.hooks.size,
        stats: Object.fromEntries(this.hookStats.entries()),
      },
    };
  }
  /**
   * Get dashboard data for all plugins
   */
  getDashboard() {
    return {
      plugins: Array.from(this.plugins.values()).map((p) => p.getDashboard()),
      stats: this.getStats(),
      hooks: Array.from(this.hooks.keys()),
    };
  }
  /**
   * Stop the plugin manager and deactivate all plugins
   */
  async stop() {
    for (const [pluginId, plugin] of this.plugins.entries()) {
      if (plugin.status === PluginStatus.ACTIVE) {
        try {
          await this.deactivate(pluginId);
        } catch (error) {
          console.warn(`[PluginManager] Failed to deactivate ${pluginId}: ${error.message}`);
        }
      }
    }
    this.initialized = false;
  }
  /**
   * Legacy unload method (alias for stop)
   */
  async unload() {
    return this.stop();
  }
};
PluginManager = __decorateClass([singleton()], PluginManager);
var plugin_manager_default = PluginManager;
export { Plugin, PluginManager, PluginStatus, plugin_manager_default as default };
