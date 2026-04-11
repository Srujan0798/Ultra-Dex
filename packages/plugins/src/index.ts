/**
 * @ultra-dex/plugins
 *
 * Plugin system for Ultra-Dex. Supports lifecycle hooks,
 * dynamic loading/unloading, and plugin-to-plugin communication.
 */

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  hooks: PluginHook[];
  dependencies?: string[];
}

export type PluginHook =
  | 'pre-execute'
  | 'post-execute'
  | 'pre-routing'
  | 'post-routing'
  | 'pre-memory'
  | 'post-memory'
  | 'on-error'
  | 'on-shutdown';

export interface PluginContext {
  config: Record<string, unknown>;
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export interface Plugin {
  manifest: PluginManifest;
  initialize(ctx: PluginContext): Promise<void>;
  execute(hook: PluginHook, data: unknown): Promise<unknown>;
  destroy(): Promise<void>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<PluginHook, Set<string>> = new Map();
  private context: PluginContext;

  constructor(context: Partial<PluginContext> = {}) {
    this.context = {
      config: context.config || {},
      logger: context.logger || {
        info: (msg: string) => console.log(`[plugin] ${msg}`),
        warn: (msg: string) => console.warn(`[plugin] ${msg}`),
        error: (msg: string) => console.error(`[plugin] ${msg}`),
      },
    };
  }

  /**
   * Register a plugin.
   */
  async register(plugin: Plugin): Promise<void> {
    const name = plugin.manifest.name;
    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }

    // Check dependencies
    for (const dep of plugin.manifest.dependencies || []) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin "${name}" requires dependency "${dep}" which is not registered`);
      }
    }

    await plugin.initialize(this.context);
    this.plugins.set(name, plugin);

    // Register hooks
    for (const hook of plugin.manifest.hooks) {
      if (!this.hooks.has(hook)) {
        this.hooks.set(hook, new Set());
      }
      this.hooks.get(hook)!.add(name);
    }
  }

  /**
   * Unregister a plugin.
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    await plugin.destroy();
    this.plugins.delete(name);

    // Remove from hooks
    for (const [, pluginNames] of this.hooks) {
      pluginNames.delete(name);
    }
  }

  /**
   * Execute all plugins for a given hook.
   */
  async executeHook(hook: PluginHook, data: unknown): Promise<unknown[]> {
    const pluginNames = this.hooks.get(hook);
    if (!pluginNames || pluginNames.size === 0) return [];

    const results: unknown[] = [];
    for (const name of pluginNames) {
      const plugin = this.plugins.get(name);
      if (plugin) {
        try {
          const result = await plugin.execute(hook, data);
          results.push(result);
        } catch (err) {
          this.context.logger.error(`Plugin "${name}" failed on hook "${hook}": ${(err as Error).message}`);
        }
      }
    }
    return results;
  }

  /**
   * Get a registered plugin by name.
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * List all registered plugins.
   */
  list(): Array<{ name: string; version: string; hooks: PluginHook[] }> {
    const result: Array<{ name: string; version: string; hooks: PluginHook[] }> = [];
    for (const [name, plugin] of this.plugins) {
      result.push({
        name,
        version: plugin.manifest.version,
        hooks: plugin.manifest.hooks,
      });
    }
    return result;
  }

  /**
   * Destroy all plugins.
   */
  async destroyAll(): Promise<void> {
    for (const [, plugin] of this.plugins) {
      try {
        await plugin.destroy();
      } catch {
        // Ignore errors during shutdown
      }
    }
    this.plugins.clear();
    this.hooks.clear();
  }
}

export const pluginManager = new PluginManager();
