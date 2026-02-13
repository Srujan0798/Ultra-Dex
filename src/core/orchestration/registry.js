// Copyright (c) 2026 Ultra-Dex
// src/core/orchestration/registry.js

import fs from 'fs/promises';
import path from 'path';

/**
 * Agent Registry
 * Manages registration, discovery, and lifecycle of agents
 */

export class AgentRegistry {
  constructor(options = {}) {
    this.options = {
      autoDiscover: options.autoDiscover !== false,
      enablePersistence: options.enablePersistence !== false,
      maxAgents: options.maxAgents || 100,
      agentsPath: options.agentsPath || path.join(process.cwd(), 'apps', 'cli', 'assets', 'agents'),
      ...options,
    };

    this.agents = new Map(); // agentId -> agent definition
    this.agentCapabilities = new Map(); // capability -> Set of agentIds
    this.agentMetadata = new Map(); // agentId -> metadata
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Load persisted agents if enabled
    if (this.options.enablePersistence) {
      await this.loadPersistedAgents();
    }

    // Auto-discover agents if enabled
    if (this.options.autoDiscover) {
      await this.discoverAgents();
    }

    this.isInitialized = true;
    // console.log(`📋 Agent Registry initialized with ${this.agents.size} agents`);
  }

  /**
   * Register a new agent
   */
  async registerAgent(agentId, agentDefinition) {
    if (this.agents.size >= this.options.maxAgents) {
      throw new Error(`Maximum agent limit (${this.options.maxAgents}) reached`);
    }

    // Validate agent definition
    this.validateAgentDefinition(agentDefinition);

    // Store agent
    this.agents.set(agentId, {
      id: agentId,
      ...agentDefinition,
      registeredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active',
    });

    // Index capabilities
    if (agentDefinition.capabilities) {
      for (const capability of agentDefinition.capabilities) {
        if (!this.agentCapabilities.has(capability)) {
          this.agentCapabilities.set(capability, new Set());
        }
        this.agentCapabilities.get(capability).add(agentId);
      }
    }

    // Store metadata
    this.agentMetadata.set(agentId, {
      lastAccessed: null,
      executionCount: 0,
      avgResponseTime: 0,
      totalTokens: 0,
    });

    return {
      id: agentId,
      status: 'registered',
      registeredAt: new Date().toISOString(),
    };
  }

  /**
   * Validate agent definition
   */
  validateAgentDefinition(definition) {
    if (!definition.name) {
      throw new Error('Agent definition must include a name');
    }

    if (!definition.description) {
      throw new Error('Agent definition must include a description');
    }

    if (!Array.isArray(definition.capabilities)) {
      throw new Error('Agent definition must include capabilities array');
    }
  }

  /**
   * Get an agent by ID
   */
  getAgentById(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability) {
    const agentIds = this.agentCapabilities.get(capability) || new Set();
    return Array.from(agentIds)
      .map((id) => this.agents.get(id))
      .filter(Boolean);
  }

  /**
   * Find agents by multiple capabilities (AND condition)
   */
  findAgentsByCapabilities(capabilities) {
    if (!capabilities || capabilities.length === 0) {
      return this.getAllAgents();
    }

    // Get agents with first capability
    let candidateIds = this.agentCapabilities.get(capabilities[0]) || new Set();

    // Intersect with agents having other capabilities
    for (let i = 1; i < capabilities.length; i++) {
      const capabilityIds = this.agentCapabilities.get(capabilities[i]) || new Set();
      candidateIds = new Set([...candidateIds].filter((id) => capabilityIds.has(id)));
    }

    return Array.from(candidateIds)
      .map((id) => this.agents.get(id))
      .filter(Boolean);
  }

  /**
   * Find agents by capability (OR condition)
   */
  findAgentsByAnyCapability(capabilities) {
    const allAgentIds = new Set();

    for (const capability of capabilities) {
      const agentIds = this.agentCapabilities.get(capability) || new Set();
      for (const id of agentIds) {
        allAgentIds.add(id);
      }
    }

    return Array.from(allAgentIds)
      .map((id) => this.agents.get(id))
      .filter(Boolean);
  }

  /**
   * Update agent definition
   */
  async updateAgent(agentId, updates) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Update capabilities index if capabilities changed
    if (updates.capabilities) {
      // Remove old capabilities
      const oldCapabilities = agent.capabilities || [];
      for (const oldCap of oldCapabilities) {
        const agentsWithCap = this.agentCapabilities.get(oldCap);
        if (agentsWithCap) {
          agentsWithCap.delete(agentId);
          if (agentsWithCap.size === 0) {
            this.agentCapabilities.delete(oldCap);
          }
        }
      }

      // Add new capabilities
      for (const newCap of updates.capabilities) {
        if (!this.agentCapabilities.has(newCap)) {
          this.agentCapabilities.set(newCap, new Set());
        }
        this.agentCapabilities.get(newCap).add(agentId);
      }
    }

    // Update agent
    Object.assign(agent, updates, {
      lastUpdated: new Date().toISOString(),
    });

    return {
      id: agentId,
      status: 'updated',
      lastUpdated: agent.lastUpdated,
    };
  }

  /**
   * Remove an agent
   */
  async removeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { id: agentId, status: 'not_found' };
    }

    // Remove from capabilities index
    if (agent.capabilities) {
      for (const capability of agent.capabilities) {
        const agentsWithCap = this.agentCapabilities.get(capability);
        if (agentsWithCap) {
          agentsWithCap.delete(agentId);
          if (agentsWithCap.size === 0) {
            this.agentCapabilities.delete(capability);
          }
        }
      }
    }

    // Remove from registry
    this.agents.delete(agentId);
    this.agentMetadata.delete(agentId);

    return {
      id: agentId,
      status: 'removed',
      removedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute an agent task
   */
  async executeAgent(agentId, task, options = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status !== 'active') {
      throw new Error(`Agent ${agentId} is not active (status: ${agent.status})`);
    }

    // Update metadata
    const metadata = this.agentMetadata.get(agentId) || {};
    metadata.lastAccessed = new Date().toISOString();
    metadata.executionCount = (metadata.executionCount || 0) + 1;
    this.agentMetadata.set(agentId, metadata);

    // This would normally call the actual agent execution system
    // For now, we'll simulate execution
    const startTime = Date.now();

    try {
      // Simulate agent execution
      const result = {
        success: true,
        output: `Agent ${agent.name} processed task: ${task}`,
        agentId,
        taskId: options.taskId || this.generateTaskId(),
      };

      const responseTime = Date.now() - startTime;

      // Update response time metrics
      const currentAvg = metadata.avgResponseTime || 0;
      metadata.avgResponseTime =
        (currentAvg * (metadata.executionCount - 1) + responseTime) / metadata.executionCount;

      return result;
    } catch (error) {
      // Update error metrics
      metadata.errorCount = (metadata.errorCount || 0) + 1;
      this.agentMetadata.set(agentId, metadata);

      throw error;
    }
  }

  /**
   * Get agent statistics
   */
  getAgentStats(agentId) {
    const agent = this.agents.get(agentId);
    const metadata = this.agentMetadata.get(agentId);

    if (!agent || !metadata) {
      return null;
    }

    return {
      id: agentId,
      name: agent.name,
      status: agent.status,
      capabilities: agent.capabilities,
      registeredAt: agent.registeredAt,
      lastUpdated: agent.lastUpdated,
      lastAccessed: metadata.lastAccessed,
      executionCount: metadata.executionCount,
      avgResponseTime: metadata.avgResponseTime,
      errorCount: metadata.errorCount || 0,
      utilization: this.calculateUtilization(agentId),
    };
  }

  /**
   * Calculate agent utilization
   */
  calculateUtilization(agentId) {
    const metadata = this.agentMetadata.get(agentId);
    if (!metadata || metadata.executionCount === 0) {
      return 0;
    }

    // Calculate based on execution count and time period
    // This is a simplified calculation
    const now = Date.now();
    const registeredAt = new Date(metadata.registeredAt).getTime();
    const uptimeMs = now - registeredAt;

    if (uptimeMs <= 0) return 0;

    // Simplified utilization: executions per hour
    const uptimeHours = uptimeMs / (1000 * 60 * 60);
    const executionsPerHour = metadata.executionCount / uptimeHours;

    // Normalize to 0-100 scale
    return Math.min(100, executionsPerHour * 10); // Adjust multiplier as needed
  }

  /**
   * Discover agents automatically
   */
  async discoverAgents() {
    const indexPath = path.join(this.options.agentsPath, '00-AGENT_INDEX.md');

    try {
      const content = await fs.readFile(indexPath, 'utf8');

      // Basic regex to extract agents from markdown tables
      // Matches: | **@AgentName** | Role | When to Use | File |
      const agentRegex =
        /\|\s*\*\*@(\w+)\*\*\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|/g;

      let match;
      while ((match = agentRegex.exec(content)) !== null) {
        const [_, name, role, whenToUse, fileName, filePath] = match;

        const agentId = name.toLowerCase();
        const absolutePath = path.resolve(this.options.agentsPath, filePath.replace('./', ''));

        // Register agent with metadata from index
        await this.registerAgent(agentId, {
          name: name,
          description: role.trim(),
          usage: whenToUse.trim(),
          promptPath: absolutePath,
          capabilities: this.inferCapabilities(agentId, role),
        });
      }

      console.log(`📋 Agent Registry: Discovered ${this.agents.size} agents from index`);
    } catch (error) {
      console.error(`❌ Agent Registry Discovery Failed: ${error.message}`);
    }
  }

  /**
   * Infer agent capabilities from their role and name
   */
  inferCapabilities(agentId, role) {
    const capabilities = ['general'];
    const roleLower = role.toLowerCase();

    if (roleLower.includes('architecture') || agentId === 'cto')
      capabilities.push('planning', 'architecture');
    if (roleLower.includes('plan') || agentId === 'planner')
      capabilities.push('planning', 'task-breakdown');
    if (roleLower.includes('implementation') || agentId === 'backend' || agentId === 'frontend')
      capabilities.push('implementation', 'coding');
    if (roleLower.includes('api') || agentId === 'backend') capabilities.push('api-design');
    if (roleLower.includes('ui') || agentId === 'frontend') capabilities.push('ui-design');
    if (roleLower.includes('database') || agentId === 'database')
      capabilities.push('database-design', 'sql');
    if (roleLower.includes('security') || agentId === 'security' || agentId === 'auth')
      capabilities.push('security', 'audit');
    if (roleLower.includes('deploy') || agentId === 'devops')
      capabilities.push('devops', 'deployment');
    if (roleLower.includes('test') || agentId === 'testing') capabilities.push('testing', 'qa');
    if (roleLower.includes('review') || agentId === 'reviewer') capabilities.push('code-review');
    if (roleLower.includes('debug') || agentId === 'debugger') capabilities.push('debugging');
    if (roleLower.includes('research') || agentId === 'research') capabilities.push('research');

    return [...new Set(capabilities)];
  }

  /**
   * Get the full prompt for an agent
   */
  async getAgentPrompt(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.promptPath) {
      return `You are the ${agentId} agent.`;
    }

    try {
      return await fs.readFile(agent.promptPath, 'utf8');
    } catch (error) {
      console.error(`Error reading prompt for ${agentId}: ${error.message}`);
      return `You are the ${agentId} agent.`;
    }
  }

  /**
   * Load persisted agents
   */
  async loadPersistedAgents() {
    // In a real implementation, this would load agents from storage
    console.log('💾 Loading persisted agents...');
  }

  /**
   * Get registry metrics
   */
  getMetrics() {
    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter((a) => a.status === 'active').length,
      capabilityIndexSize: this.agentCapabilities.size,
      totalExecutions: Array.from(this.agentMetadata.values()).reduce(
        (sum, meta) => sum + (meta.executionCount || 0),
        0
      ),
    };
  }

  /**
   * Generate a unique task ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown() {
    // Cleanup resources if needed
    this.agents.clear();
    this.agentCapabilities.clear();
    this.agentMetadata.clear();
  }
}
