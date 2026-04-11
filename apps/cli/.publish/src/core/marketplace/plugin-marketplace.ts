/**
 * Plugin Marketplace Service
 * Manages plugin discovery, installation, and registry
 */

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  downloads: number;
  rating: number;
}

export class PluginMarketplace {
  private registry: Map<string, Plugin> = new Map();
  private installedPlugins: Set<string> = new Set();

  constructor() {
    // Initial seeded data
    this.seedPlugins();
  }

  private seedPlugins() {
    const corePlugins: Plugin[] = [
      {
        id: 'github',
        name: 'GitHub Integration',
        version: '1.2.0',
        description: 'Deep integration with GitHub PRs and Actions',
        author: 'Ultra-Dex',
        category: 'DevOps',
        downloads: 15000,
        rating: 4.8,
      },
      {
        id: 'slack',
        name: 'Slack Notifications',
        version: '1.0.5',
        description: 'Send AI orchestration events to Slack',
        author: 'Ultra-Dex',
        category: 'Communication',
        downloads: 8900,
        rating: 4.5,
      },
      {
        id: 'docker',
        name: 'Docker Sandbox',
        version: '2.1.0',
        description: 'Isolated container execution for agents',
        author: 'Ultra-Dex',
        category: 'Core',
        downloads: 22000,
        rating: 4.9,
      },
    ];

    corePlugins.forEach((p) => this.registry.set(p.id, p));
  }

  /**
   * Search for plugins in the marketplace
   */
  async listPlugins(): Promise<Plugin[]> {
    return Array.from(this.registry.values());
  }

  /**
   * Get specific plugin details
   */
  async getPlugin(id: string): Promise<Plugin | undefined> {
    return this.registry.get(id);
  }

  /**
   * Install a plugin into the local environment
   */
  async installPlugin(id: string): Promise<boolean> {
    if (!this.registry.has(id)) {
      throw new Error(`Plugin ${id} not found in marketplace`);
    }

    this.installedPlugins.add(id);
    return true;
  }

  /**
   * Uninstall a plugin from the local environment
   */
  async uninstallPlugin(id: string): Promise<boolean> {
    return this.installedPlugins.delete(id);
  }

  /**
   * Get all locally installed plugins
   */
  async getInstalledPlugins(): Promise<Plugin[]> {
    return Array.from(this.installedPlugins)
      .map((id) => this.registry.get(id))
      .filter((p) => p !== undefined) as Plugin[];
  }
}

export const marketplace = new PluginMarketplace();
