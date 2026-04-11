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
import { EventEmitter } from 'events';
let Plugin = class {
  constructor({
    name,
    version = '1.0.0',
    description = '',
    hooks = {},
    config = {},
    dependencies = [],
  }) {
    this.name = name;
    this.version = version;
    this.description = description;
    this.hooks = hooks;
    this.config = config;
    this.dependencies = dependencies;
    this.status = 'registered';
    this.loadedAt = null;
    this.stats = { invocations: 0, errors: 0, totalMs: 0 };
  }
  async initialize() {
    this.status = 'loading';
    if (this.hooks.onInit) {
      await this.hooks.onInit(this.config);
    }
    this.status = 'active';
    this.loadedAt = Date.now();
  }
  async teardown() {
    this.status = 'unloading';
    if (this.hooks.onDestroy) {
      await this.hooks.onDestroy();
    }
    this.status = 'inactive';
  }
  async execute(hookName, ...args) {
    if (this.status !== 'active') return null;
    const hook = this.hooks[hookName];
    if (!hook) return null;
    const start = Date.now();
    try {
      const result = await hook(...args);
      this.stats.invocations++;
      this.stats.totalMs += Date.now() - start;
      return result;
    } catch (error) {
      this.stats.errors++;
      this.stats.totalMs += Date.now() - start;
      throw error;
    }
  }
  toJSON() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      status: this.status,
      dependencies: this.dependencies,
      stats: {
        ...this.stats,
        avgMs:
          this.stats.invocations > 0 ? Math.round(this.stats.totalMs / this.stats.invocations) : 0,
      },
      loadedAt: this.loadedAt,
    };
  }
};
Plugin = __decorateClass([singleton()], Plugin);
let PluginManager = class extends EventEmitter {
  constructor({ maxPlugins = 50, enableHotReload = true } = {}) {
    super();
    this.plugins = /* @__PURE__ */ new Map();
    this.maxPlugins = maxPlugins;
    this.enableHotReload = enableHotReload;
    this.hookRegistry = /* @__PURE__ */ new Map();
  }
  /**
   * Register a plugin
   */
  register(config) {
    if (this.plugins.size >= this.maxPlugins) {
      throw new Error(`Max plugins (${this.maxPlugins}) reached`);
    }
    const plugin = config instanceof Plugin ? config : new Plugin(config);
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" already registered`);
    }
    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Missing dependency "${dep}" for plugin "${plugin.name}"`);
      }
      const depPlugin = this.plugins.get(dep);
      if (depPlugin.status !== 'active') {
        throw new Error(`Dependency "${dep}" is not active (status: ${depPlugin.status})`);
      }
    }
    this.plugins.set(plugin.name, plugin);
    for (const hookName of Object.keys(plugin.hooks)) {
      if (!this.hookRegistry.has(hookName)) {
        this.hookRegistry.set(hookName, []);
      }
      this.hookRegistry.get(hookName).push(plugin.name);
    }
    this.emit('plugin:registered', { name: plugin.name, version: plugin.version });
    return plugin;
  }
  /**
   * Load and initialize a plugin
   */
  async load(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin "${name}" not found`);
    if (plugin.status === 'active') return plugin;
    await plugin.initialize();
    this.emit('plugin:loaded', { name, version: plugin.version });
    return plugin;
  }
  /**
   * Unload a plugin
   */
  async unload(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin "${name}" not found`);
    const dependents = [...this.plugins.values()].filter(
      (p) => p.dependencies.includes(name) && p.status === 'active'
    );
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unload "${name}" \u2014 ${dependents.map((d) => d.name).join(', ')} depend on it`
      );
    }
    await plugin.teardown();
    for (const [hookName, plugins] of this.hookRegistry) {
      const idx = plugins.indexOf(name);
      if (idx !== -1) plugins.splice(idx, 1);
    }
    this.emit('plugin:unloaded', { name });
    return plugin;
  }
  /**
   * Hot-reload a plugin with new configuration
   */
  async reload(name, newConfig) {
    if (!this.enableHotReload) {
      throw new Error('Hot-reload is disabled');
    }
    const existing = this.plugins.get(name);
    if (!existing) throw new Error(`Plugin "${name}" not found`);
    await this.unload(name);
    this.plugins.delete(name);
    const updated = new Plugin({ ...newConfig, name });
    this.register(updated);
    await this.load(name);
    this.emit('plugin:reloaded', {
      name,
      oldVersion: existing.version,
      newVersion: updated.version,
    });
    return updated;
  }
  /**
   * Execute a hook across all active plugins
   */
  async executeHook(hookName, ...args) {
    const pluginNames = this.hookRegistry.get(hookName) || [];
    const results = [];
    for (const name of pluginNames) {
      const plugin = this.plugins.get(name);
      if (plugin && plugin.status === 'active') {
        try {
          const result = await plugin.execute(hookName, ...args);
          results.push({ plugin: name, result });
        } catch (error) {
          results.push({ plugin: name, error: error.message });
          this.emit('hook:error', { hookName, plugin: name, error });
        }
      }
    }
    return results;
  }
  /**
   * Get a plugin by name
   */
  get(name) {
    return this.plugins.get(name);
  }
  /**
   * List all plugins
   */
  list(filter = {}) {
    let results = [...this.plugins.values()];
    if (filter.status) results = results.filter((p) => p.status === filter.status);
    return results.map((p) => p.toJSON());
  }
  /**
   * Get dashboard stats
   */
  getDashboard() {
    const plugins = [...this.plugins.values()];
    return {
      total: plugins.length,
      active: plugins.filter((p) => p.status === 'active').length,
      inactive: plugins.filter((p) => p.status === 'inactive' || p.status === 'registered').length,
      hooks: this.hookRegistry.size,
      totalInvocations: plugins.reduce((sum, p) => sum + p.stats.invocations, 0),
      totalErrors: plugins.reduce((sum, p) => sum + p.stats.errors, 0),
    };
  }
};
PluginManager = __decorateClass([singleton()], PluginManager);
var lifecycle_manager_default = PluginManager;
export { Plugin, PluginManager, lifecycle_manager_default as default };
