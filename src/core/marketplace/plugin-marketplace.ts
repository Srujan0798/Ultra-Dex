export interface Plugin { id: string; name: string; downloads: number; rating: number; }
export class PluginMarketplace {
  async searchPlugins(): Promise<Plugin[]> {
    return [
      { id: 'github', name: 'GitHub', downloads: 15000, rating: 4.8 },
      { id: 'slack', name: 'Slack', downloads: 8900, rating: 4.5 }
    ];
  }
}
export const marketplace = new PluginMarketplace();
