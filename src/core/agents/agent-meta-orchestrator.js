// Copyright (c) 2026 Ultra-Dex
// src/core/agents/agent-meta-orchestrator.js

import { aiMetaLayer } from '../ai/ai-meta-layer.js';
import { performance } from 'perf_hooks';
import { logger } from '../../src/utils/logging.js';

/**
 * Agent Meta-Orchestrator
 * Manages multiple AI agents with intelligent routing and coordination
 */
export class AgentMetaOrchestrator {
  constructor(config = {}) {
    this.agents = new Map();
    this.agentQueues = new Map();
    this.agentStats = new Map();
    this.config = {
      maxConcurrentAgents: config.maxConcurrentAgents || 10,
      enableCoordination: config.enableCoordination !== false,
      enableLoadBalancing: config.enableLoadBalancing !== false,
      enableDynamicAllocation: config.enableDynamicAllocation !== false,
      coordinationThreshold: config.coordinationThreshold || 0.7,
      ...config
    };
    
    this.coordinationGraph = new Map(); // Tracks agent relationships
    this.activeSessions = new Map(); // Tracks active agent sessions
  }

  /**
   * Register a new agent with the orchestrator
   */
  registerAgent(agentId, agentConfig) {
    const agent = {
      id: agentId,
      name: agentConfig.name || agentId,
      description: agentConfig.description || '',
      capabilities: agentConfig.capabilities || [],
      modelPreference: agentConfig.modelPreference || null,
      priority: agentConfig.priority || 5, // 1-10 scale
      maxConcurrency: agentConfig.maxConcurrency || 1,
      isActive: true,
      stats: {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        avgResponseTime: 0,
        totalTokens: 0,
        lastActive: null
      },
      ...agentConfig
    };

    this.agents.set(agentId, agent);
    this.agentQueues.set(agentId, []);
    this.agentStats.set(agentId, agent.stats);
    
    // Initialize coordination relationships
    this.coordinationGraph.set(agentId, new Set());
    
    logger.info(`Agent registered: ${agent.name} (${agentId})`);
    return agent;
  }

  /**
   * Execute a task with intelligent agent selection
   */
  async executeTask(task, options = {}) {
    const startTime = performance.now();
    const sessionId = options.sessionId || this.generateSessionId();
    
    // Track session
    this.activeSessions.set(sessionId, {
      startTime,
      task,
      agentsUsed: [],
      status: 'active'
    });

    try {
      // Find the best agent for the task
      const selectedAgent = await this.selectBestAgent(task, options);
      
      if (!selectedAgent) {
        throw new Error('No suitable agent found for the task');
      }

      // Check for coordination needs
      const coordinatingAgents = await this.identifyCoordinatingAgents(selectedAgent, task);
      
      // Execute with coordination if needed
      if (coordinatingAgents.length > 0 && this.config.enableCoordination) {
        return await this.executeWithCoordination(selectedAgent, coordinatingAgents, task, options, sessionId);
      } else {
        return await this.executeSingleAgent(selectedAgent, task, options, sessionId);
      }
    } finally {
      // Update session status
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'completed';
        session.endTime = performance.now();
        this.activeSessions.set(sessionId, session);
      }
    }
  }

  /**
   * Select the best agent for a given task
   */
  async selectBestAgent(task, options = {}) {
    const { requiredCapabilities, complexity, deadline, priority } = options;
    
    // Filter agents by capabilities
    let candidates = Array.from(this.agents.values()).filter(agent => {
      if (!agent.isActive) return false;
      
      // Check if agent has required capabilities
      if (requiredCapabilities) {
        return requiredCapabilities.every(cap => agent.capabilities.includes(cap));
      }
      
      // If no specific capabilities required, use general matching
      return true;
    });

    // Sort by priority and other factors
    candidates.sort((a, b) => {
      // Higher priority agents first
      let priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Prefer agents with matching model preference
      if (options.model && a.modelPreference === options.model) return -1;
      if (options.model && b.modelPreference === options.model) return 1;
      
      // Prefer less busy agents
      const aQueueLength = this.agentQueues.get(a.id)?.length || 0;
      const bQueueLength = this.agentQueues.get(b.id)?.length || 0;
      return aQueueLength - bQueueLength;
    });

    // Return the best candidate
    return candidates[0] || null;
  }

  /**
   * Identify agents that should coordinate with the selected agent
   */
  async identifyCoordinatingAgents(selectedAgent, task) {
    if (!this.config.enableCoordination) return [];

    const coordinatingAgents = [];
    
    // Check coordination graph for related agents
    const relatedAgentIds = this.coordinationGraph.get(selectedAgent.id) || new Set();
    
    for (const relatedId of relatedAgentIds) {
      const relatedAgent = this.agents.get(relatedId);
      if (relatedAgent && relatedAgent.isActive) {
        // Check if coordination is beneficial for this task
        if (await this.shouldCoordinate(selectedAgent, relatedAgent, task)) {
          coordinatingAgents.push(relatedAgent);
        }
      }
    }

    // Also consider agents with complementary capabilities
    const taskKeywords = this.extractKeywords(task);
    for (const [id, agent] of this.agents) {
      if (id === selectedAgent.id || coordinatingAgents.includes(agent)) continue;
      
      // Check if agent's capabilities complement the task
      const complementScore = this.calculateComplementScore(agent, taskKeywords);
      if (complementScore > this.config.coordinationThreshold) {
        coordinatingAgents.push(agent);
      }
    }

    return coordinatingAgents;
  }

  /**
   * Execute task with coordination between multiple agents
   */
  async executeWithCoordination(mainAgent, coordinatingAgents, task, options, sessionId) {
    logger.info(`Executing task with coordination: ${mainAgent.name} + ${coordinatingAgents.length} others`);
    
    // Create coordination context
    const coordinationContext = {
      mainAgent: mainAgent.id,
      coordinatingAgents: coordinatingAgents.map(a => a.id),
      task,
      timestamp: Date.now()
    };

    // Execute main task
    const mainResult = await this.executeSingleAgent(mainAgent, task, options, sessionId, coordinationContext);

    // Execute coordinating tasks in parallel if needed
    const coordinationResults = await Promise.allSettled(
      coordinatingAgents.map(agent => {
        const coordinationTask = this.createCoordinationTask(agent, task, mainResult);
        return this.executeSingleAgent(agent, coordinationTask, options, sessionId, coordinationContext);
      })
    );

    // Aggregate results
    return {
      mainResult,
      coordinationResults: coordinationResults.map((result, idx) => ({
        agent: coordinatingAgents[idx].name,
        success: result.status === 'fulfilled',
        result: result.status === 'fulfilled' ? result.value : result.reason
      })),
      coordinationContext
    };
  }

  /**
   * Execute task with a single agent
   */
  async executeSingleAgent(agent, task, options, sessionId, coordinationContext = null) {
    // Add to agent queue
    const queue = this.agentQueues.get(agent.id) || [];
    queue.push({ task, options, sessionId });
    this.agentQueues.set(agent.id, queue);

    try {
      // Update agent stats
      agent.stats.totalCalls++;
      agent.stats.lastActive = new Date();
      
      // Prepare the call to AI
      const messages = this.prepareMessages(agent, task, coordinationContext);
      const model = options.model || agent.modelPreference || 'gpt-4o-2024-11-20';
      
      const startTime = performance.now();
      const result = await aiMetaLayer.call(model, messages, options);
      const responseTime = performance.now() - startTime;

      // Update agent stats
      agent.stats.successfulCalls++;
      agent.stats.avgResponseTime = 
        ((agent.stats.avgResponseTime * (agent.stats.successfulCalls - 1)) + responseTime) / 
        agent.stats.successfulCalls;
      
      if (result.usage?.totalTokens) {
        agent.stats.totalTokens += result.usage.totalTokens;
      }

      // Track in session
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.agentsUsed.push(agent.id);
      }

      logger.info(`Agent ${agent.name} completed task`, {
        agentId: agent.id,
        responseTime: Math.round(responseTime),
        tokens: result.usage?.totalTokens,
        sessionId
      });

      return result;
    } catch (error) {
      agent.stats.failedCalls++;
      logger.error(`Agent ${agent.name} failed task`, {
        agentId: agent.id,
        error: error.message,
        sessionId
      });
      throw error;
    } finally {
      // Remove from queue
      const queue = this.agentQueues.get(agent.id) || [];
      queue.shift();
      this.agentQueues.set(agent.id, queue);
    }
  }

  /**
   * Prepare messages for AI call
   */
  prepareMessages(agent, task, coordinationContext = null) {
    const systemPrompt = `
You are ${agent.name}, ${agent.description}.
Your capabilities include: ${agent.capabilities.join(', ')}.

${coordinationContext ? `You are coordinating with other agents on this task. Context: ${JSON.stringify(coordinationContext)}` : ''}

Follow these guidelines:
- Be concise but thorough
- Ask for clarification if needed
- Provide actionable output
- Format responses appropriately for the task type
    `;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: task }
    ];
  }

  /**
   * Create a coordination task for a supporting agent
   */
  createCoordinationTask(agent, originalTask, mainResult) {
    return `Original task: ${originalTask}
Main agent result: ${JSON.stringify(mainResult)}
Your role: ${agent.description}
Capabilities: ${agent.capabilities.join(', ')}

Based on the main result, provide your specialized input or validation.`;
  }

  /**
   * Check if two agents should coordinate on a task
   */
  async shouldCoordinate(agentA, agentB, task) {
    // Simple heuristic: check if agents have overlapping or complementary capabilities
    const overlap = agentA.capabilities.filter(cap => agentB.capabilities.includes(cap)).length;
    const complementA = agentB.capabilities.filter(cap => !agentA.capabilities.includes(cap)).length;
    const complementB = agentA.capabilities.filter(cap => !agentB.capabilities.includes(cap)).length;
    
    // Calculate coordination score
    const score = (overlap * 0.3) + (complementA * 0.4) + (complementB * 0.3);
    return score > this.config.coordinationThreshold;
  }

  /**
   * Calculate complement score between agent and task
   */
  calculateComplementScore(agent, taskKeywords) {
    const matches = agent.capabilities.filter(cap => 
      taskKeywords.some(keyword => cap.toLowerCase().includes(keyword.toLowerCase()))
    ).length;
    
    return matches / agent.capabilities.length;
  }

  /**
   * Extract keywords from a task
   */
  extractKeywords(task) {
    // Simple keyword extraction - in practice, use NLP techniques
    const text = typeof task === 'string' ? task : JSON.stringify(task);
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Top 10 keywords
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics() {
    const totalStats = {
      totalAgents: this.agents.size,
      activeSessions: this.activeSessions.size,
      totalTasksProcessed: 0,
      successfulTasks: 0,
      failedTasks: 0
    };

    for (const agent of this.agents.values()) {
      totalStats.totalTasksProcessed += agent.stats.totalCalls;
      totalStats.successfulTasks += agent.stats.successfulCalls;
      totalStats.failedTasks += agent.stats.failedCalls;
    }

    return {
      orchestrator: totalStats,
      agents: Object.fromEntries(
        Array.from(this.agents.entries()).map(([id, agent]) => [id, agent.stats])
      )
    };
  }

  /**
   * Get active sessions
   */
  getActiveSessions() {
    return Object.fromEntries(this.activeSessions);
  }

  /**
   * Add coordination relationship between agents
   */
  addCoordinationRelationship(agentA, agentB) {
    if (!this.coordinationGraph.has(agentA)) {
      this.coordinationGraph.set(agentA, new Set());
    }
    if (!this.coordinationGraph.has(agentB)) {
      this.coordinationGraph.set(agentB, new Set());
    }
    
    this.coordinationGraph.get(agentA).add(agentB);
    this.coordinationGraph.get(agentB).add(agentA);
    
    logger.info(`Coordination relationship added: ${agentA} <-> ${agentB}`);
  }
}

// Export singleton instance
export const agentMetaOrchestrator = new AgentMetaOrchestrator();

// Export for direct import
export default agentMetaOrchestrator;