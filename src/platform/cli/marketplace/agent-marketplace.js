import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import axios from "axios";
import { execSync } from "child_process";
class AgentMarketplace {
  marketplaceUrl;
  localAgentsPath;
  localPluginsPath;
  constructor(options) {
    this.marketplaceUrl = options?.marketplaceUrl || "https://marketplace.ultra-dex.ai";
    this.localAgentsPath = options?.localAgentsPath || "./agents";
    this.localPluginsPath = options?.localPluginsPath || "./plugins";
  }
  /**
   * List available agents in the marketplace
   */
  async listAgents() {
    try {
      const response = await axios.get(`${this.marketplaceUrl}/api/agents`);
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch agents from marketplace:", error.message);
      return this.getLocalAgents();
    }
  }
  /**
   * List available plugins in the marketplace
   */
  async listPlugins() {
    try {
      const response = await axios.get(`${this.marketplaceUrl}/api/plugins`);
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch plugins from marketplace:", error.message);
      return this.getLocalPlugins();
    }
  }
  /**
   * Install an agent from the marketplace
   */
  async installAgent(agentId, version) {
    try {
      logger.log(`Installing agent: ${agentId}${version ? `@${version}` : ""}`);
      const response = await axios.get(`${this.marketplaceUrl}/api/agents/${agentId}`);
      let agentManifest = response.data;
      if (version && agentManifest.version !== version) {
        const versionResponse = await axios.get(`${this.marketplaceUrl}/api/agents/${agentId}/${version}`);
        agentManifest = versionResponse.data;
      }
      const agentPath = join(this.localAgentsPath, agentId);
      if (!existsSync(agentPath)) {
        execSync(`mkdir -p ${agentPath}`, { stdio: "inherit" });
      }
      const agentZipUrl = `${this.marketplaceUrl}/api/agents/${agentId}/download`;
      const manifestPath = join(agentPath, "manifest.json");
      writeFileSync(manifestPath, JSON.stringify(agentManifest, null, 2));
      logger.log(`\u2705 Agent ${agentId} installed successfully`);
      return true;
    } catch (error) {
      logger.error(`\u274C Failed to install agent ${agentId}:`, error.message);
      return false;
    }
  }
  /**
   * Install a plugin from the marketplace
   */
  async installPlugin(pluginId, version) {
    try {
      logger.log(`Installing plugin: ${pluginId}${version ? `@${version}` : ""}`);
      const response = await axios.get(`${this.marketplaceUrl}/api/plugins/${pluginId}`);
      let pluginManifest = response.data;
      if (version && pluginManifest.version !== version) {
        const versionResponse = await axios.get(`${this.marketplaceUrl}/api/plugins/${pluginId}/${version}`);
        pluginManifest = versionResponse.data;
      }
      const pluginPath = join(this.localPluginsPath, pluginId);
      if (!existsSync(pluginPath)) {
        execSync(`mkdir -p ${pluginPath}`, { stdio: "inherit" });
      }
      const pluginZipUrl = `${this.marketplaceUrl}/api/plugins/${pluginId}/download`;
      const manifestPath = join(pluginPath, "manifest.json");
      writeFileSync(manifestPath, JSON.stringify(pluginManifest, null, 2));
      logger.log(`\u2705 Plugin ${pluginId} installed successfully`);
      return true;
    } catch (error) {
      logger.error(`\u274C Failed to install plugin ${pluginId}:`, error.message);
      return false;
    }
  }
  /**
   * Uninstall an agent
   */
  async uninstallAgent(agentId) {
    try {
      const agentPath = join(this.localAgentsPath, agentId);
      if (existsSync(agentPath)) {
        execSync(`rm -rf ${agentPath}`, { stdio: "inherit" });
        logger.log(`\u2705 Agent ${agentId} uninstalled successfully`);
        return true;
      }
      logger.log(`\u26A0\uFE0F Agent ${agentId} not found`);
      return false;
    } catch (error) {
      logger.error(`\u274C Failed to uninstall agent ${agentId}:`, error.message);
      return false;
    }
  }
  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId) {
    try {
      const pluginPath = join(this.localPluginsPath, pluginId);
      if (existsSync(pluginPath)) {
        execSync(`rm -rf ${pluginPath}`, { stdio: "inherit" });
        logger.log(`\u2705 Plugin ${pluginId} uninstalled successfully`);
        return true;
      }
      logger.log(`\u26A0\uFE0F Plugin ${pluginId} not found`);
      return false;
    } catch (error) {
      logger.error(`\u274C Failed to uninstall plugin ${pluginId}:`, error.message);
      return false;
    }
  }
  /**
   * Get locally installed agents
   */
  getLocalAgents() {
    if (!existsSync(this.localAgentsPath)) {
      return [];
    }
    const agents = [];
    const agentDirs = readdirSync(this.localAgentsPath);
    for (const agentDir of agentDirs) {
      const manifestPath = join(this.localAgentsPath, agentDir, "manifest.json");
      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
          agents.push({
            ...manifest,
            local: true,
            path: join(this.localAgentsPath, agentDir)
          });
        } catch (error) {
          logger.error(`Failed to parse manifest for agent ${agentDir}:`, error.message);
        }
      }
    }
    return agents;
  }
  /**
   * Get locally installed plugins
   */
  getLocalPlugins() {
    if (!existsSync(this.localPluginsPath)) {
      return [];
    }
    const plugins = [];
    const pluginDirs = readdirSync(this.localPluginsPath);
    for (const pluginDir of pluginDirs) {
      const manifestPath = join(this.localPluginsPath, pluginDir, "manifest.json");
      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
          plugins.push({
            ...manifest,
            local: true,
            path: join(this.localPluginsPath, pluginDir)
          });
        } catch (error) {
          logger.error(`Failed to parse manifest for plugin ${pluginDir}:`, error.message);
        }
      }
    }
    return plugins;
  }
  /**
   * Search for agents/plugins
   */
  async search(query) {
    try {
      const [agentsResponse, pluginsResponse] = await Promise.allSettled([
        axios.get(`${this.marketplaceUrl}/api/agents/search?q=${encodeURIComponent(query)}`),
        axios.get(`${this.marketplaceUrl}/api/plugins/search?q=${encodeURIComponent(query)}`)
      ]);
      const agents = agentsResponse.status === "fulfilled" ? agentsResponse.value.data : [];
      const plugins = pluginsResponse.status === "fulfilled" ? pluginsResponse.value.data : [];
      return { agents, plugins };
    } catch (error) {
      logger.error("Search failed:", error.message);
      return { agents: [], plugins: [] };
    }
  }
  /**
   * Get agent details
   */
  async getAgentDetails(agentId) {
    try {
      const response = await axios.get(`${this.marketplaceUrl}/api/agents/${agentId}/details`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get details for agent ${agentId}:`, error.message);
      return null;
    }
  }
  /**
   * Get plugin details
   */
  async getPluginDetails(pluginId) {
    try {
      const response = await axios.get(`${this.marketplaceUrl}/api/plugins/${pluginId}/details`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get details for plugin ${pluginId}:`, error.message);
      return null;
    }
  }
  /**
   * Update an installed agent
   */
  async updateAgent(agentId) {
    try {
      const localAgents = this.getLocalAgents();
      const localAgent = localAgents.find((a) => a.id === agentId);
      if (!localAgent) {
        logger.log(`\u274C Agent ${agentId} not found locally`);
        return false;
      }
      const latestAgent = await this.getAgentDetails(agentId);
      if (!latestAgent) {
        logger.log(`\u274C Agent ${agentId} not found in marketplace`);
        return false;
      }
      if (localAgent.version === latestAgent.version) {
        logger.log(`\u2705 Agent ${agentId} is already up to date`);
        return true;
      }
      logger.log(`Updating agent ${agentId} from ${localAgent.version} to ${latestAgent.version}`);
      return await this.installAgent(agentId, latestAgent.version);
    } catch (error) {
      logger.error(`Failed to update agent ${agentId}:`, error.message);
      return false;
    }
  }
  /**
   * Update an installed plugin
   */
  async updatePlugin(pluginId) {
    try {
      const localPlugins = this.getLocalPlugins();
      const localPlugin = localPlugins.find((p) => p.id === pluginId);
      if (!localPlugin) {
        logger.log(`\u274C Plugin ${pluginId} not found locally`);
        return false;
      }
      const latestPlugin = await this.getPluginDetails(pluginId);
      if (!latestPlugin) {
        logger.log(`\u274C Plugin ${pluginId} not found in marketplace`);
        return false;
      }
      if (localPlugin.version === latestPlugin.version) {
        logger.log(`\u2705 Plugin ${pluginId} is already up to date`);
        return true;
      }
      logger.log(`Updating plugin ${pluginId} from ${localPlugin.version} to ${latestPlugin.version}`);
      return await this.installPlugin(pluginId, latestPlugin.version);
    } catch (error) {
      logger.error(`Failed to update plugin ${pluginId}:`, error.message);
      return false;
    }
  }
  /**
   * Validate agent manifest
   */
  validateAgentManifest(manifest) {
    const requiredFields = ["id", "name", "version", "description", "author", "license", "main"];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        logger.error(`Missing required field in agent manifest: ${field}`);
        return false;
      }
    }
    return true;
  }
  /**
   * Validate plugin manifest
   */
  validatePluginManifest(manifest) {
    const requiredFields = ["id", "name", "version", "description", "type", "entryPoint"];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        logger.error(`Missing required field in plugin manifest: ${field}`);
        return false;
      }
    }
    const validTypes = ["command", "agent", "integration", "template"];
    if (!validTypes.includes(manifest.type)) {
      logger.error(`Invalid plugin type: ${manifest.type}`);
      return false;
    }
    return true;
  }
}
var agent_marketplace_default = AgentMarketplace;
export {
  AgentMarketplace,
  agent_marketplace_default as default
};
