import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Marketplace Service for agent discovery and management
export interface AgentPackage {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  providers: string[];
  category: string;
  downloads: number;
}

export interface AgentMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  providers: string[];
}

export class MarketplaceService {
  private localRegistryPath: string;
  private builtInAgents: Map<string, AgentPackage> = new Map();

  constructor() {
    this.localRegistryPath = path.join(os.homedir(), '.ultra-dex', 'agents');
    this.initializeBuiltInAgents();
  }

  private initializeBuiltInAgents(): void {
    const builtIns = [
      {
        id: '@ultra-dex/planner',
        name: 'Planner',
        version: '1.0.0',
        description: 'Breaks down objectives into executable tasks',
        author: 'Ultra-Dex',
        capabilities: ['planning', 'task-decomposition'],
        providers: ['claude', 'openai', 'nvidia'],
        category: 'planning',
        downloads: 0,
      },
      {
        id: '@ultra-dex/backend',
        name: 'Backend Developer',
        version: '1.0.0',
        description: 'Designs and implements server-side code',
        author: 'Ultra-Dex',
        capabilities: ['coding', 'api-design', 'database'],
        providers: ['claude', 'openai', 'gemini'],
        category: 'coding',
        downloads: 0,
      },
      {
        id: '@ultra-dex/frontend',
        name: 'Frontend Developer',
        version: '1.0.0',
        description: 'Builds user interfaces and components',
        author: 'Ultra-Dex',
        capabilities: ['ui', 'react', 'css'],
        providers: ['claude', 'openai', 'gemini'],
        category: 'coding',
        downloads: 0,
      },
      {
        id: '@ultra-dex/reviewer',
        name: 'Code Reviewer',
        version: '1.0.0',
        description: 'Reviews code for quality and issues',
        author: 'Ultra-Dex',
        capabilities: ['review', 'security', 'performance'],
        providers: ['claude', 'openai', 'nvidia'],
        category: 'review',
        downloads: 0,
      },
      {
        id: '@ultra-dex/cto',
        name: 'Technical Architect',
        version: '1.0.0',
        description: 'Provides high-level technical guidance',
        author: 'Ultra-Dex',
        capabilities: ['architecture', 'decisions', 'planning'],
        providers: ['claude', 'openai'],
        category: 'planning',
        downloads: 0,
      },
      {
        id: '@ultra-dex/security',
        name: 'Security Auditor',
        version: '1.0.0',
        description: 'Identifies security vulnerabilities',
        author: 'Ultra-Dex',
        capabilities: ['security', 'audit', 'review'],
        providers: ['claude', 'openai', 'nvidia'],
        category: 'security',
        downloads: 0,
      },
      {
        id: '@ultra-dex/database',
        name: 'Database Designer',
        version: '1.0.0',
        description: 'Designs database schemas and queries',
        author: 'Ultra-Dex',
        capabilities: ['database', 'schema', 'sql'],
        providers: ['claude', 'openai', 'gemini'],
        category: 'data',
        downloads: 0,
      },
      {
        id: '@ultra-dex/devops',
        name: 'DevOps Engineer',
        version: '1.0.0',
        description: 'Manages deployments and infrastructure',
        author: 'Ultra-Dex',
        capabilities: ['devops', 'ci-cd', 'infrastructure'],
        providers: ['claude', 'openai', 'nvidia'],
        category: 'infrastructure',
        downloads: 0,
      },
    ];

    builtIns.forEach((agent) => this.builtInAgents.set(agent.id, agent));
  }

  async listAgents(filters?: { category?: string }): Promise<AgentPackage[]> {
    const agents: AgentPackage[] = [];

    // Get built-in agents
    this.builtInAgents.forEach((agent) => agents.push(agent));

    // Get locally installed agents
    try {
      const localAgents = await this.getLocalAgents();
      agents.push(...localAgents);
    } catch {
      // Ignore if no local agents
    }

    // Apply category filter
    if (filters?.category) {
      return agents.filter((a) => a.category === filters.category);
    }

    return agents;
  }

  async getAgent(id: string): Promise<AgentPackage | null> {
    // Check built-in first
    if (this.builtInAgents.has(id)) {
      return this.builtInAgents.get(id)!;
    }

    // Check local registry
    try {
      const agentPath = path.join(this.localRegistryPath, id, 'agent.json');
      const content = await fs.readFile(agentPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async installAgent(id: string): Promise<boolean> {
    // Mock install - in production would download from registry
    console.log(`Installing agent ${id}...`);
    return true;
  }

  async uninstallAgent(id: string): Promise<boolean> {
    // Cannot uninstall built-in agents
    if (this.builtInAgents.has(id)) {
      throw new Error(`Cannot uninstall built-in agent: ${id}`);
    }

    const agentPath = path.join(this.localRegistryPath, id);
    try {
      await fs.rmdir(agentPath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  async publishAgent(agentDir: string): Promise<string> {
    // Mock publish - in production would upload to registry
    console.log(`Publishing agent from ${agentDir}...`);
    return 'agent-id';
  }

  async searchAgents(query: string): Promise<{ agent: AgentPackage; relevance: number }[]> {
    const allAgents = await this.listAgents();
    const results = allAgents.map((agent) => ({
      agent,
      relevance: this.calculateRelevance(query, agent),
    }));

    return results.filter((r) => r.relevance > 0.3).sort((a, b) => b.relevance - a.relevance);
  }

  private async getLocalAgents(): Promise<AgentPackage[]> {
    const agents: AgentPackage[] = [];
    try {
      const entries = await fs.readdir(this.localRegistryPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const agentPath = path.join(this.localRegistryPath, entry.name, 'agent.json');
            const content = await fs.readFile(agentPath, 'utf-8');
            agents.push(JSON.parse(content));
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

  private calculateRelevance(query: string, agent: AgentPackage): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    if (agent.name.toLowerCase().includes(queryLower)) score += 0.4;
    if (agent.description.toLowerCase().includes(queryLower)) score += 0.3;
    if (agent.category.toLowerCase().includes(queryLower)) score += 0.2;
    if (agent.capabilities.some((c) => c.toLowerCase().includes(queryLower))) score += 0.1;

    return score;
  }
}
