import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Agent Registry for resolving and loading agents
export interface AgentConfig {
  id: string;
  name: string;
  version: string;
  prompt: string;
  capabilities: string[];
  providers: string[];
  tools?: string[];
}

export class AgentRegistry {
  private localPath: string;
  private cache: Map<string, AgentConfig> = new Map();

  constructor() {
    this.localPath = path.join(os.homedir(), '.ultra-dex', 'agents');
  }

  /**
   * Resolve agent ID to config
   * - @ultra-dex/planner → built-in agent
   * - @community/security-auditor → marketplace agent
   * - ./my-agent → local agent directory
   */
  async resolveAgent(agentId: string): Promise<AgentConfig | null> {
    // Check cache first
    if (this.cache.has(agentId)) {
      return this.cache.get(agentId)!;
    }

    // Built-in agents
    if (agentId.startsWith('@ultra-dex/')) {
      const name = agentId.replace('@ultra-dex/', '');
      return this.loadBuiltInAgent(name);
    }

    // Community/marketplace agents
    if (agentId.startsWith('@community/')) {
      return this.loadMarketplaceAgent(agentId);
    }

    // Local agents
    if (agentId.startsWith('./') || agentId.startsWith('../')) {
      return this.loadLocalAgent(agentId);
    }

    // Try as short name (planner, backend, etc)
    return this.loadBuiltInAgent(agentId);
  }

  /**
   * List all available agents
   */
  async listAgents(): Promise<{ id: string; name: string; version: string }[]> {
    const agents: { id: string; name: string; version: string }[] = [];

    // Built-in agents
    const builtIns = [
      { id: '@ultra-dex/planner', name: 'Planner', version: '1.0.0' },
      { id: '@ultra-dex/backend', name: 'Backend Developer', version: '1.0.0' },
      { id: '@ultra-dex/frontend', name: 'Frontend Developer', version: '1.0.0' },
      { id: '@ultra-dex/reviewer', name: 'Code Reviewer', version: '1.0.0' },
      { id: '@ultra-dex/cto', name: 'Technical Architect', version: '1.0.0' },
      { id: '@ultra-dex/security', name: 'Security Auditor', version: '1.0.0' },
      { id: '@ultra-dex/database', name: 'Database Designer', version: '1.0.0' },
      { id: '@ultra-dex/devops', name: 'DevOps Engineer', version: '1.0.0' },
    ];
    agents.push(...builtIns);

    // Locally installed agents
    try {
      const localAgents = await this.getLocalAgentsList();
      agents.push(...localAgents);
    } catch {
      // No local agents
    }

    return agents;
  }

  private async loadBuiltInAgent(name: string): Promise<AgentConfig | null> {
    const agentMap: Record<string, AgentConfig> = {
      planner: {
        id: '@ultra-dex/planner',
        name: 'Planner',
        version: '1.0.0',
        prompt: 'You are @Planner. Break down objectives into atomic tasks.',
        capabilities: ['planning', 'task-decomposition'],
        providers: ['claude', 'openai', 'nvidia'],
      },
      backend: {
        id: '@ultra-dex/backend',
        name: 'Backend Developer',
        version: '1.0.0',
        prompt: 'You are @Backend. Design and implement server-side code.',
        capabilities: ['coding', 'api-design', 'database'],
        providers: ['claude', 'openai', 'gemini'],
      },
      frontend: {
        id: '@ultra-dex/frontend',
        name: 'Frontend Developer',
        version: '1.0.0',
        prompt: 'You are @Frontend. Build user interfaces and components.',
        capabilities: ['ui', 'react', 'css'],
        providers: ['claude', 'openai', 'gemini'],
      },
      reviewer: {
        id: '@ultra-dex/reviewer',
        name: 'Code Reviewer',
        version: '1.0.0',
        prompt: 'You are @Reviewer. Review code for quality and issues.',
        capabilities: ['review', 'security', 'performance'],
        providers: ['claude', 'openai', 'nvidia'],
      },
      cto: {
        id: '@ultra-dex/cto',
        name: 'Technical Architect',
        version: '1.0.0',
        prompt: 'You are @CTO. Provide high-level technical guidance.',
        capabilities: ['architecture', 'decisions', 'planning'],
        providers: ['claude', 'openai'],
      },
      security: {
        id: '@ultra-dex/security',
        name: 'Security Auditor',
        version: '1.0.0',
        prompt: 'You are @Security. Identify security vulnerabilities.',
        capabilities: ['security', 'audit', 'review'],
        providers: ['claude', 'openai', 'nvidia'],
      },
      database: {
        id: '@ultra-dex/database',
        name: 'Database Designer',
        version: '1.0.0',
        prompt: 'You are @Database. Design database schemas and queries.',
        capabilities: ['database', 'schema', 'sql'],
        providers: ['claude', 'openai', 'gemini'],
      },
      devops: {
        id: '@ultra-dex/devops',
        name: 'DevOps Engineer',
        version: '1.0.0',
        prompt: 'You are @DevOps. Manage deployments and infrastructure.',
        capabilities: ['devops', 'ci-cd', 'infrastructure'],
        providers: ['claude', 'openai', 'nvidia'],
      },
    };

    return agentMap[name] || null;
  }

  private async loadMarketplaceAgent(agentId: string): Promise<AgentConfig | null> {
    const agentPath = path.join(this.localPath, agentId, 'agent.json');
    try {
      const content = await fs.readFile(agentPath, 'utf-8');
      const parsed = JSON.parse(content);
      const config: AgentConfig = {
        id: parsed.id || agentId,
        name: parsed.name,
        version: parsed.version,
        prompt: await this.loadPrompt(path.join(this.localPath, agentId)),
        capabilities: parsed.capabilities || [],
        providers: parsed.providers || [],
        tools: parsed.tools,
      };
      this.cache.set(agentId, config);
      return config;
    } catch {
      return null;
    }
  }

  private async loadLocalAgent(agentDir: string): Promise<AgentConfig | null> {
    const agentPath = path.join(process.cwd(), agentDir, 'agent.json');
    try {
      const content = await fs.readFile(agentPath, 'utf-8');
      const parsed = JSON.parse(content);
      const dir = path.join(process.cwd(), agentDir);
      const config: AgentConfig = {
        id: parsed.id || path.basename(agentDir),
        name: parsed.name,
        version: parsed.version,
        prompt: await this.loadPrompt(dir),
        capabilities: parsed.capabilities || [],
        providers: parsed.providers || [],
        tools: parsed.tools,
      };
      this.cache.set(agentDir, config);
      return config;
    } catch {
      return null;
    }
  }

  private async loadPrompt(agentDir: string): Promise<string> {
    try {
      const promptPath = path.join(agentDir, 'prompt.md');
      return await fs.readFile(promptPath, 'utf-8');
    } catch {
      return 'You are an AI agent. Help the user with their task.';
    }
  }

  private async getLocalAgentsList(): Promise<{ id: string; name: string; version: string }[]> {
    const agents: { id: string; name: string; version: string }[] = [];
    try {
      const entries = await fs.readdir(this.localPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const agentPath = path.join(this.localPath, entry.name, 'agent.json');
            const content = await fs.readFile(agentPath, 'utf-8');
            const parsed = JSON.parse(content);
            agents.push({
              id: entry.name,
              name: parsed.name || entry.name,
              version: parsed.version || 'unknown',
            });
          } catch {
            // Skip invalid agents
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
    return agents;
  }
}
