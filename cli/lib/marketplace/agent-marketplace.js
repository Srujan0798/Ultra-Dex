import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import axios from 'axios';
import { execSync } from 'child_process';

interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  dependencies?: Record<string, string>;
  main: string;
  keywords?: string[];
  repository?: string;
}

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'command' | 'agent' | 'integration' | 'template';
  entryPoint: string;
  dependencies?: string[];
}

export class AgentMarketplace {
  private marketplaceUrl: string;
  private localAgentsPath: string;
  private localPluginsPath: string;

  constructor(options?: { marketplaceUrl?: string; localAgentsPath?: string; localPluginsPath?: string }) {
    this.marketplaceUrl = options?.marketplaceUrl || 'https://marketplace.ultra-dex.ai';
    this.localAgentsPath = options?.localAgentsPath || './agents';
    this.localPluginsPath = options?.localPluginsPath || './plugins';
  }

  /**
   * List available agents in the marketplace
   */
  async listAgents(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.marketplaceUrl}/api/agents`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch agents from marketplace:', error.message);
      // Return local agents as fallback
      return this.getLocalAgents();
    }
  }

  /**
   * List available plugins in the marketplace
   */
  async listPlugins(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.marketplaceUrl}/api/plugins`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch plugins from marketplace:', error.message);
      // Return local plugins as fallback
      return this.getLocalPlugins();
    }
  }

  /**
   * Install an agent from the marketplace
   */
  async installAgent(agentId: string, version?: string): Promise<boolean> {
    try {
      console.log(`Installing agent: ${agentId}${version ? `@${version}` : ''}`);

      // Fetch agent manifest
      const response = await axios.get(`${this.marketplaceUrl}/api/agents/${agentId}`);
      const agentManifest: AgentManifest = response.data;

      if (version && agentManifest.version !== version) {
        // Fetch specific version if requested
        const versionResponse = await axios.get(`${this.marketplaceUrl}/api/agents/${agentId}/${version}`);
        agentManifest = versionResponse.data;
      }

      // Create agent directory
      const agentPath = join(this.localAgentsPath, agentId);
      if (!existsSync(agentPath)) {
        execSync(`mkdir -p ${agentPath}`, { stdio: 'inherit' });
      }

      // Download agent files
      const agentZipUrl = `${this.marketplaceUrl}/api/agents/${agentId}/download`;
      // In a real implementation, download and extract the zip file
      // For now, we'll create a placeholder

      // Save manifest
      const manifestPath = join(agentPath, 'manifest.json');
      writeFileSync(manifestPath, JSON.stringify(agentManifest, null, 2));

      console.log(`✅ Agent ${agentId} installed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to install agent ${agentId}:`, error.message);
      return false;
    }
  }

  /**
   * Install a plugin from the marketplace
   */
  async installPlugin(pluginId: string, version?: string): Promise<boolean> {
    try {
      console.log(`Installing plugin: ${pluginId}${version ? `@${version}` : ''}`);

      // Fetch plugin manifest
      const response = await axios.get(`${this.marketplaceUrl}/api/plugins/${pluginId}`);
      const pluginManifest: PluginManifest = response.data;

      if (version && pluginManifest.version !== version) {
        // Fetch specific version if requested
        const versionResponse = await axios.get(`${this.marketplaceUrl}/api/plugins/${pluginId}/${version}`);
        pluginManifest = versionResponse.data;
      }

      // Create plugin directory
      const pluginPath = join(this.localPluginsPath, pluginId);
      if (!existsSync(pluginPath)) {
        execSync(`mkdir -p ${pluginPath}`, { stdio: 'inherit' });
      }

      // Download plugin files
      const pluginZipUrl = `${this.marketplaceUrl}/api/plugins/${pluginId}/download`;
      // In a real implementation, download and extract the zip file
      // For now, we'll create a placeholder

      // Save manifest
      const manifestPath = join(pluginPath, 'manifest.json');
      writeFileSync(manifestPath, JSON.stringify(pluginManifest, null, 2));

      console.log(`✅ Plugin ${pluginId} installed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to install plugin ${pluginId}:`, error.message);
      return false;
    }
  }

  /**
   * Uninstall an agent
   */
  async uninstallAgent(agentId: string): Promise<boolean> {
    try {
      const agentPath = join(this.localAgentsPath, agentId);
      if (existsSync(agentPath)) {
        execSync(`rm -rf ${agentPath}`, { stdio: 'inherit' });
        console.log(`✅ Agent ${agentId} uninstalled successfully`);
        return true;
      }
      console.log(`⚠️ Agent ${agentId} not found`);
      return false;
    } catch (error) {
      console.error(`❌ Failed to uninstall agent ${agentId}:`, error.message);
      return false;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      const pluginPath = join(this.localPluginsPath, pluginId);
      if (existsSync(pluginPath)) {
        execSync(`rm -rf ${pluginPath}`, { stdio: 'inherit' });
        console.log(`✅ Plugin ${pluginId} uninstalled successfully`);
        return true;
      }
      console.log(`⚠️ Plugin ${pluginId} not found`);
      return false;
    } catch (error) {
      console.error(`❌ Failed to uninstall plugin ${pluginId}:`, error.message);
      return false;
    }
  }

  /**
   * Get locally installed agents
   */
  private getLocalAgents(): any[] {
    if (!existsSync(this.localAgentsPath)) {
      return [];
    }

    const agents = [];
    const agentDirs = readdirSync(this.localAgentsPath);

    for (const agentDir of agentDirs) {
      const manifestPath = join(this.localAgentsPath, agentDir, 'manifest.json');
      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
          agents.push({
            ...manifest,
            local: true,
            path: join(this.localAgentsPath, agentDir)
          });
        } catch (error) {
          console.error(`Failed to parse manifest for agent ${agentDir}:`, error.message);
        }
      }
    }

    return agents;
  }

  /**
   * Get locally installed plugins
   */
  private getLocalPlugins(): any[] {
    if (!existsSync(this.localPluginsPath)) {
      return [];
    }

    const plugins = [];
    const pluginDirs = readdirSync(this.localPluginsPath);

    for (const pluginDir of pluginDirs) {
      const manifestPath = join(this.localPluginsPath, pluginDir, 'manifest.json');
      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
          plugins.push({
            ...manifest,
            local: true,
            path: join(this.localPluginsPath, pluginDir)
          });
        } catch (error) {
          console.error(`Failed to parse manifest for plugin ${pluginDir}:`, error.message);
        }
      }
    }

    return plugins;
  }

  /**
   * Search for agents/plugins
   */
  async search(query: string): Promise<{ agents: any[], plugins: any[] }> {
    try {
      const [agentsResponse, pluginsResponse] = await Promise.allSettled([
        axios.get(`${this.marketplaceUrl}/api/agents/search?q=${encodeURIComponent(query)}`),
        axios.get(`${this.marketplaceUrl}/api/plugins/search?q=${encodeURIComponent(query)}`)
      ]);

      const agents = agentsResponse.status === 'fulfilled' ? agentsResponse.value.data : [];
      const plugins = pluginsResponse.status === 'fulfilled' ? pluginsResponse.value.data : [];

      return { agents, plugins };
    } catch (error) {
      console.error('Search failed:', error.message);
      return { agents: [], plugins: [] };
    }
  }

  /**
   * Get agent details
   */
  async getAgentDetails(agentId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.marketplaceUrl}/api/agents/${agentId}/details`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get details for agent ${agentId}:`, error.message);
      return null;
    }
  }

  /**
   * Get plugin details
   */
  async getPluginDetails(pluginId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.marketplaceUrl}/api/plugins/${pluginId}/details`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get details for plugin ${pluginId}:`, error.message);
      return null;
    }
  }

  /**
   * Update an installed agent
   */
  async updateAgent(agentId: string): Promise<boolean> {
    try {
      // Get current version
      const localAgents = this.getLocalAgents();
      const localAgent = localAgents.find(a => a.id === agentId);
      
      if (!localAgent) {
        console.log(`❌ Agent ${agentId} not found locally`);
        return false;
      }

      // Get latest version from marketplace
      const latestAgent = await this.getAgentDetails(agentId);
      if (!latestAgent) {
        console.log(`❌ Agent ${agentId} not found in marketplace`);
        return false;
      }

      if (localAgent.version === latestAgent.version) {
        console.log(`✅ Agent ${agentId} is already up to date`);
        return true;
      }

      console.log(`Updating agent ${agentId} from ${localAgent.version} to ${latestAgent.version}`);
      return await this.installAgent(agentId, latestAgent.version);
    } catch (error) {
      console.error(`Failed to update agent ${agentId}:`, error.message);
      return false;
    }
  }

  /**
   * Update an installed plugin
   */
  async updatePlugin(pluginId: string): Promise<boolean> {
    try {
      // Get current version
      const localPlugins = this.getLocalPlugins();
      const localPlugin = localPlugins.find(p => p.id === pluginId);
      
      if (!localPlugin) {
        console.log(`❌ Plugin ${pluginId} not found locally`);
        return false;
      }

      // Get latest version from marketplace
      const latestPlugin = await this.getPluginDetails(pluginId);
      if (!latestPlugin) {
        console.log(`❌ Plugin ${pluginId} not found in marketplace`);
        return false;
      }

      if (localPlugin.version === latestPlugin.version) {
        console.log(`✅ Plugin ${pluginId} is already up to date`);
        return true;
      }

      console.log(`Updating plugin ${pluginId} from ${localPlugin.version} to ${latestPlugin.version}`);
      return await this.installPlugin(pluginId, latestPlugin.version);
    } catch (error) {
      console.error(`Failed to update plugin ${pluginId}:`, error.message);
      return false;
    }
  }

  /**
   * Validate agent manifest
   */
  validateAgentManifest(manifest: AgentManifest): boolean {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'license', 'main'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        console.error(`Missing required field in agent manifest: ${field}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Validate plugin manifest
   */
  validatePluginManifest(manifest: PluginManifest): boolean {
    const requiredFields = ['id', 'name', 'version', 'description', 'type', 'entryPoint'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        console.error(`Missing required field in plugin manifest: ${field}`);
        return false;
      }
    }
    
    const validTypes = ['command', 'agent', 'integration', 'template'];
    if (!validTypes.includes(manifest.type)) {
      console.error(`Invalid plugin type: ${manifest.type}`);
      return false;
    }
    
    return true;
  }
}

export default AgentMarketplace;