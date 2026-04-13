import { PluginManifest, InstalledPlugin, AgentDef, ToolDef } from './types.js';
import { PluginLoader } from './plugin-loader.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, InstalledPlugin> = new Map();
  private loader: PluginLoader;
  private pluginsDir: string;
  private lockFile: string;

  private constructor() {
    this.loader = new PluginLoader();
    this.pluginsDir = path.join(os.homedir(), '.ultra-dex', 'plugins');
    this.lockFile = path.join(this.pluginsDir, 'lock.json');
  }

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Install a plugin from various sources
   */
  async install(source: string): Promise<InstalledPlugin> {
    let plugin: InstalledPlugin;

    // Determine source type
    if (source.startsWith('npm:')) {
      plugin = await this.loader.loadFromNpm(source.replace('npm:', ''));
    } else if (source.startsWith('git:') || source.endsWith('.git')) {
      plugin = await this.loader.loadFromGit(source.replace('git:', ''));
    } else if (source.startsWith('/') || source.startsWith('.')) {
      plugin = await this.loader.loadFromPath(source);
    } else {
      // Try npm by default
      plugin = await this.loader.loadFromNpm(source);
    }

    // Check for conflicts
    if (this.plugins.has(plugin.manifest.name)) {
      const existing = this.plugins.get(plugin.manifest.name)!;
      if (this.compareVersions(existing.manifest.version, plugin.manifest.version) >= 0) {
        throw new Error(
          `Plugin ${plugin.manifest.name}@${plugin.manifest.version} already installed`
        );
      }
    }

    // Register plugin
    this.plugins.set(plugin.manifest.name, plugin);

    // Run onInstall hook
    await this.executeHook(plugin, 'onInstall');

    // Save lock file
    await this.saveLockFile();

    return plugin;
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return false;
    }

    // Run onUninstall hook
    await this.executeHook(plugin, 'onUninstall');

    // Remove from registry
    this.plugins.delete(name);

    // Remove directory
    try {
      await fs.rm(plugin.path, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // Save lock file
    await this.saveLockFile();

    return true;
  }

  /**
   * List all installed plugins
   */
  list(): InstalledPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get single plugin info
   */
  get(name: string): InstalledPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all agents from all plugins
   */
  getAgents(): AgentDef[] {
    const agents: AgentDef[] = [];
    for (const plugin of this.plugins.values()) {
      agents.push(...plugin.manifest.agents);
    }
    return agents;
  }

  /**
   * Get all tools from all plugins
   */
  getTools(): ToolDef[] {
    const tools: ToolDef[] = [];
    for (const plugin of this.plugins.values()) {
      tools.push(...plugin.manifest.tools);
    }
    return tools;
  }

  /**
   * Execute plugin lifecycle hook
   */
  private async executeHook(plugin: InstalledPlugin, hookName: string): Promise<void> {
    const hook = plugin.manifest.hooks?.[hookName as keyof typeof plugin.manifest.hooks];
    if (!hook) return;

    const handlerPath = path.join(plugin.path, hook);
    try {
      const handler = await import(handlerPath);
      if (typeof handler.default === 'function') {
        await handler.default({ plugin });
      }
    } catch (error) {
      console.error(`Hook ${hookName} failed for plugin ${plugin.manifest.name}:`, error);
    }
  }

  /**
   * Save lock file
   */
  private async saveLockFile(): Promise<void> {
    const lockData = {
      version: '1.0.0',
      plugins: Array.from(this.plugins.values()).map((p) => ({
        name: p.manifest.name,
        version: p.manifest.version,
        path: p.path,
        installedAt: p.installedAt.toISOString(),
        status: p.status,
      })),
    };

    await fs.mkdir(path.dirname(this.lockFile), { recursive: true });
    await fs.writeFile(this.lockFile, JSON.stringify(lockData, null, 2));
  }

  private compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (pa[i] > pb[i]) return 1;
      if (pa[i] < pb[i]) return -1;
    }
    return 0;
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
