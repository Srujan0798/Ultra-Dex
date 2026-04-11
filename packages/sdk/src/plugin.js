export class PluginLoader {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
  }

  load(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('UltraDex SDK: plugin must be an object');
    }
    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new Error('UltraDex SDK: plugin must include a string id');
    }

    this.plugins.set(plugin.id, plugin);

    if (typeof plugin.setup === 'function') {
      plugin.setup(this);
    }

    if (plugin.hooks && typeof plugin.hooks === 'object') {
      for (const [event, handler] of Object.entries(plugin.hooks)) {
        if (typeof handler === 'function') {
          this.on(event, handler);
        }
      }
    }

    return plugin;
  }

  unload(pluginId) {
    return this.plugins.delete(pluginId);
  }

  list() {
    return Array.from(this.plugins.values()).map((plugin) => ({
      id: plugin.id,
      version: plugin.version || '0.0.0',
    }));
  }

  on(event, handler) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push(handler);
  }

  async emit(event, payload) {
    const handlers = this.hooks.get(event) || [];
    for (const handler of handlers) {
      await handler(payload);
    }
  }
}

export default PluginLoader;
