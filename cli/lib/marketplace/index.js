import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import axios from 'axios';
import { AppError } from '../utils/errors.js';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

const execAsync = promisify(exec);

/**
 * Agent Marketplace & Plugin System
 * Manages community agents, plugins, and extensions
 */
export class AgentMarketplace {
  constructor(options = {}) {
    this.options = {
      registryUrl: options.registryUrl || 'https://marketplace.ultra-dex.ai',
      localRegistry: options.localRegistry || path.join(process.cwd(), '.ultra-dex', 'marketplace'),
      ...options
    };
    
    this.agentsDir = path.join(this.options.localRegistry, 'agents');
    this.pluginsDir = path.join(this.options.localRegistry, 'plugins');
    this.templatesDir = path.join(this.options.localRegistry, 'templates');
  }

  /**
   * Initialize marketplace directories
   */
  async initialize() {
    try {
      await fs.mkdir(this.agentsDir, { recursive: true });
      await fs.mkdir(this.pluginsDir, { recursive: true });
      await fs.mkdir(this.templatesDir, { recursive: true });
      
      printSuccess('🏪 Agent marketplace initialized');
    } catch (error) {
      throw new AppError(`Marketplace initialization failed: ${error.message}`);
    }
  }

  /**
   * Search for agents in marketplace
   */
  async searchAgents(query, options = {}) {
    try {
      const params = {
        q: query,
        category: options.category,
        tier: options.tier,
        sort: options.sort || 'downloads',
        limit: options.limit || 20
      };

      const response = await axios.get(`${this.options.registryUrl}/api/agents`, { params });
      return response.data;
    } catch (error) {
      printWarning('⚠️  Marketplace search failed, using local cache');
      return await this.searchLocalAgents(query, options);
    }
  }

  /**
   * Search local agents
   */
  async searchLocalAgents(query, options = {}) {
    try {
      const agents = [];
      const agentDirs = await fs.readdir(this.agentsDir);
      
      for (const dir of agentDirs) {
        const manifestPath = path.join(this.agentsDir, dir, 'manifest.json');
        if (await fs.access(manifestPath).then(() => true).catch(() => false)) {
          const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
          
          if (!query || 
              manifest.name.toLowerCase().includes(query.toLowerCase()) ||
              manifest.description.toLowerCase().includes(query.toLowerCase()) ||
              (manifest.tags && manifest.tags.some(tag => 
                tag.toLowerCase().includes(query.toLowerCase())
              ))) {
            agents.push({
              ...manifest,
              local: true,
              path: path.join(this.agentsDir, dir)
            });
          }
        }
      }
      
      return agents;
    } catch (error) {
      printError(`Local agent search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Install an agent from marketplace
   */
  async installAgent(agentId, version = 'latest') {
    try {
      printInfo(`📥 Installing agent: ${agentId}@${version}`);
      
      // Get agent info
      let agentInfo;
      try {
        const response = await axios.get(`${this.options.registryUrl}/api/agents/${agentId}`);
        agentInfo = response.data;
      } catch {
        // Fallback to local search
        const localAgents = await this.searchLocalAgents(agentId);
        agentInfo = localAgents.find(a => a.name === agentId);
        
        if (!agentInfo) {
          throw new AppError(`Agent not found: ${agentId}`);
        }
      }

      // Determine installation path
      const installPath = path.join(this.agentsDir, agentInfo.name);
      
      // Download agent
      if (agentInfo.downloadUrl) {
        await this.downloadAgent(agentInfo.downloadUrl, installPath);
      } else if (agentInfo.repository) {
        await this.cloneAgentRepo(agentInfo.repository, installPath);
      } else {
        throw new AppError(`No download method available for agent: ${agentId}`);
      }

      // Validate agent
      const isValid = await this.validateAgent(installPath);
      if (!isValid) {
        await fs.rm(installPath, { recursive: true, force: true });
        throw new AppError(`Invalid agent: ${agentId} failed validation`);
      }

      // Install dependencies
      await this.installAgentDependencies(installPath);

      printSuccess(`✅ Agent installed: ${agentInfo.name} (${agentInfo.version})`);
      
      return {
        success: true,
        agent: agentInfo,
        path: installPath,
        message: `Agent ${agentInfo.name} installed successfully`
      };
    } catch (error) {
      throw new AppError(`Agent installation failed: ${error.message}`);
    }
  }

  /**
   * Download agent from URL
   */
  async downloadAgent(downloadUrl, installPath) {
    const { pipeline } = await import('stream');
    const { promisify } = await import('util');
    const { createWriteStream } = await import('fs');
    const { get } = await import('https');
    
    const finished = promisify(pipeline);
    
    // Create temporary file
    const tempFile = path.join(this.options.localRegistry, 'temp', `${Date.now()}.zip`);
    await fs.mkdir(path.dirname(tempFile), { recursive: true });
    
    // Download
    await new Promise((resolve, reject) => {
      get(downloadUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode}`));
          return;
        }
        
        const writeStream = createWriteStream(tempFile);
        response.pipe(writeStream);
        
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      }).on('error', reject);
    });
    
    // Extract to install path
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(tempFile);
    zip.extractAllTo(installPath, true);
    
    // Cleanup
    await fs.unlink(tempFile);
  }

  /**
   * Clone agent from git repository
   */
  async cloneAgentRepo(repoUrl, installPath) {
    await execAsync(`git clone ${repoUrl} ${installPath}`);
  }

  /**
   * Validate agent structure
   */
  async validateAgent(agentPath) {
    try {
      const manifestPath = path.join(agentPath, 'manifest.json');
      if (!(await fs.access(manifestPath).then(() => true).catch(() => false))) {
        printError(`Missing manifest.json in agent: ${agentPath}`);
        return false;
      }

      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      
      // Validate manifest structure
      const manifestSchema = z.object({
        name: z.string().min(1),
        version: z.string().regex(/^\d+\.\d+\.\d+$/),
        description: z.string().min(10),
        author: z.string(),
        license: z.string(),
        main: z.string(),
        type: z.enum(['agent', 'plugin', 'template']),
        dependencies: z.record(z.string()).optional(),
        capabilities: z.array(z.string()).optional(),
        permissions: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional()
      });

      manifestSchema.parse(manifest);

      // Check main file exists
      const mainPath = path.join(agentPath, manifest.main);
      if (!(await fs.access(mainPath).then(() => true).catch(() => false))) {
        printError(`Main file not found: ${mainPath}`);
        return false;
      }

      return true;
    } catch (error) {
      printError(`Agent validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Install agent dependencies
   */
  async installAgentDependencies(agentPath) {
    const packageJsonPath = path.join(agentPath, 'package.json');
    if (await fs.access(packageJsonPath).then(() => true).catch(() => false)) {
      try {
        await execAsync('npm install', { cwd: agentPath });
        printSuccess(`📦 Dependencies installed for agent: ${agentPath}`);
      } catch (error) {
        printWarning(`⚠️  Dependency installation failed for agent: ${agentPath}`);
      }
    }
  }

  /**
   * List installed agents
   */
  async listInstalledAgents() {
    try {
      const agents = [];
      const agentDirs = await fs.readdir(this.agentsDir);
      
      for (const dir of agentDirs) {
        const manifestPath = path.join(this.agentsDir, dir, 'manifest.json');
        if (await fs.access(manifestPath).then(() => true).catch(() => false)) {
          const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
          agents.push({
            ...manifest,
            path: path.join(this.agentsDir, dir),
            installed: true
          });
        }
      }
      
      return agents;
    } catch (error) {
      throw new AppError(`Failed to list installed agents: ${error.message}`);
    }
  }

  /**
   * Uninstall an agent
   */
  async uninstallAgent(agentName) {
    try {
      const agentPath = path.join(this.agentsDir, agentName);
      
      if (!(await fs.access(agentPath).then(() => true).catch(() => false))) {
        throw new AppError(`Agent not found: ${agentName}`);
      }

      await fs.rm(agentPath, { recursive: true, force: true });
      printSuccess(`🗑️  Agent uninstalled: ${agentName}`);
      
      return {
        success: true,
        message: `Agent ${agentName} uninstalled successfully`
      };
    } catch (error) {
      throw new AppError(`Agent uninstallation failed: ${error.message}`);
    }
  }

  /**
   * Publish agent to marketplace
   */
  async publishAgent(agentPath, apiKey) {
    try {
      // Validate agent
      const isValid = await this.validateAgent(agentPath);
      if (!isValid) {
        throw new AppError('Agent validation failed');
      }

      // Read manifest
      const manifestPath = path.join(agentPath, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

      // Create package
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();
      zip.addLocalFolder(agentPath);
      const zipBuffer = zip.toBuffer();

      // Upload to marketplace
      const formData = new FormData();
      formData.append('agent', new Blob([zipBuffer]), `${manifest.name}-${manifest.version}.zip`);
      formData.append('manifest', JSON.stringify(manifest));

      const response = await axios.post(`${this.options.registryUrl}/api/agents/publish`, formData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        }
      });

      printSuccess(`🚀 Agent published: ${manifest.name}@${manifest.version}`);
      
      return {
        success: true,
        agent: response.data,
        message: `Agent published successfully`
      };
    } catch (error) {
      throw new AppError(`Agent publishing failed: ${error.message}`);
    }
  }

  /**
   * Update an installed agent
   */
  async updateAgent(agentName, version = 'latest') {
    try {
      const installedAgents = await this.listInstalledAgents();
      const agent = installedAgents.find(a => a.name === agentName);
      
      if (!agent) {
        throw new AppError(`Agent not installed: ${agentName}`);
      }

      // Get latest version info
      try {
        const response = await axios.get(`${this.options.registryUrl}/api/agents/${agentName}/versions/latest`);
        const latestVersion = response.data;
        
        if (latestVersion.version === agent.version) {
          printInfo(`✅ Agent ${agentName} is already up to date (${agent.version})`);
          return {
            success: true,
            message: `Agent ${agentName} is up to date`
          };
        }

        printInfo(`🔄 Updating ${agentName} from ${agent.version} to ${latestVersion.version}`);
        
        // Uninstall old version
        await this.uninstallAgent(agentName);
        
        // Install new version
        return await this.installAgent(agentName, latestVersion.version);
      } catch {
        printWarning(`⚠️  Could not check for updates, using local version`);
        return {
          success: true,
          message: 'Update check failed, keeping current version'
        };
      }
    } catch (error) {
      throw new AppError(`Agent update failed: ${error.message}`);
    }
  }

  /**
   * Get agent details
   */
  async getAgentDetails(agentId) {
    try {
      // Try marketplace first
      try {
        const response = await axios.get(`${this.options.registryUrl}/api/agents/${agentId}`);
        return response.data;
      } catch {
        // Fallback to local
        const installedAgents = await this.listInstalledAgents();
        return installedAgents.find(a => a.name === agentId);
      }
    } catch (error) {
      throw new AppError(`Failed to get agent details: ${error.message}`);
    }
  }

  /**
   * Create new agent template
   */
  async createAgentTemplate(name, type = 'custom') {
    try {
      const agentPath = path.join(this.agentsDir, name);
      
      // Create directory structure
      await fs.mkdir(agentPath, { recursive: true });
      await fs.mkdir(path.join(agentPath, 'src'));
      await fs.mkdir(path.join(agentPath, 'test'));

      // Create manifest
      const manifest = {
        name,
        version: '1.0.0',
        description: `Custom ${type} agent for Ultra-Dex`,
        author: process.env.USER || 'Anonymous',
        license: 'MIT',
        main: 'src/agent.js',
        type: 'agent',
        capabilities: ['execution', 'analysis'],
        permissions: ['read', 'write'],
        tags: [type, 'custom'],
        dependencies: {
          'ultra-dex-sdk': '^4.0.0'
        }
      };

      await fs.writeFile(
        path.join(agentPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Create basic agent file
      const agentCode = `/**
 * ${name} Agent
 * Generated by Ultra-Dex Agent Creator
 */

import { BaseAgent } from 'ultra-dex-sdk';

export class ${name.charAt(0).toUpperCase() + name.slice(1)}Agent extends BaseAgent {
  constructor(config = {}) {
    super({
      name: '${name}',
      description: '${manifest.description}',
      capabilities: ${JSON.stringify(manifest.capabilities)},
      ...config
    });
  }

  async execute(task, context) {
    try {
      this.logger.info('Executing task:', task);
      
      // Add your agent logic here
      
      return {
        success: true,
        result: 'Task completed successfully',
        context: { ...context }
      };
    } catch (error) {
      this.logger.error('Agent execution failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ${name.charAt(0).toUpperCase() + name.slice(1)}Agent;
`;

      await fs.writeFile(path.join(agentPath, 'src', 'agent.js'), agentCode);

      // Create basic test
      const testCode = `/**
 * ${name} Agent Tests
 */

import { ${name.charAt(0).toUpperCase() + name.slice(1)}Agent } from '../src/agent.js';

describe('${name} Agent', () => {
  let agent;

  beforeEach(() => {
    agent = new ${name.charAt(0).toUpperCase() + name.slice(1)}Agent();
  });

  test('should execute successfully', async () => {
    const result = await agent.execute('test task', {});
    expect(result.success).toBe(true);
  });
});
`;

      await fs.writeFile(path.join(agentPath, 'test', 'agent.test.js'), testCode);

      // Create README
      const readme = `# ${name} Agent

${manifest.description}

## Installation

\`\`\`bash
ultra-dex agent install ${name}
\`\`\`

## Usage

\`\`\`bash
ultra-dex agent run ${name} --task "your task here"
\`\`\`

## Configuration

Add to your ultra-dex.config.json:

\`\`\`json
{
  "agents": {
    "${name}": {
      "enabled": true,
      "config": {
        // Add your configuration here
      }
    }
  }
}
\`\`\`

## License

MIT
`;

      await fs.writeFile(path.join(agentPath, 'README.md'), readme);

      printSuccess(`🏗️  Agent template created: ${name}`);
      
      return {
        success: true,
        path: agentPath,
        message: `Agent template ${name} created successfully`
      };
    } catch (error) {
      throw new AppError(`Agent template creation failed: ${error.message}`);
    }
  }
}

// Singleton instance
export const agentMarketplace = new AgentMarketplace();

export default AgentMarketplace;