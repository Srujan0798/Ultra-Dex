// Copyright (c) 2026 Ultra-Dex
// src/core/orchestration/index.js

/**
 * Agent Orchestration System
 * Coordinates multi-agent workflows and manages agent communication
 */

import { executeProtocol21 } from '../quality/protocol-21.js';
import { AgentStateMachine } from './agent-state.js';
import { AgentCommunicationBus } from './communication-bus.js';
import { AgentScheduler } from './scheduler.js';
import { AgentRegistry } from './registry.js';

import { ppmManager } from '../memory/manager.js';
import { ciHealer } from '../cicd/self-healing.js';

class AgentOrchestrator {
  constructor(options = {}) {
    this.memory = ppmManager;
    this.healer = ciHealer;
    this.options = {
      maxConcurrentAgents: options.maxConcurrentAgents || 8,
      enableCoordination: options.enableCoordination !== false,
      enableLoadBalancing: options.enableLoadBalancing !== false,
      enableDynamicAllocation: options.enableDynamicAllocation !== false,
      coordinationThreshold: options.coordinationThreshold || 0.7,
      ...options
    };
    
    this.stateMachine = new AgentStateMachine();
    this.commBus = new AgentCommunicationBus();
    this.scheduler = new AgentScheduler(this.options);
    this.registry = new AgentRegistry();
    this.activeSessions = new Map();
    this.coordinationGraph = new Map(); // Tracks agent relationships
    
    this.metrics = {
      totalSessions: 0,
      successfulSessions: 0,
      failedSessions: 0,
      avgResponseTime: 0,
      totalTokens: 0
    };
  }

  /**
   * Execute a high-level objective using the autonomous Nexus mode
   */
  async executeNexus(objective) {
    console.log(chalk.magenta(`\n🌌 Nexus Orchestration: ${objective}`));
    await this.memory.init();
    
    // Integrate with Ralph Loop for autonomous execution
    const { runAutonomousTask } = await import('../agents/ralph-loop.js');
    return await runAutonomousTask(objective);
  }

  /**
   * Alias for executeNexus to support CLI compatibility
   */
  async execute(objective) {
    return await this.executeNexus(objective);
  }

  /**
   * Initialize the orchestrator
   */
  async initialize() {
    await this.stateMachine.initialize();
    await this.commBus.initialize();
    await this.registry.initialize();
    
    console.log('🤖 Agent Orchestration System Initialized');
  }

  /**
   * Execute a task with agent coordination
   */
  async executeTask(task, options = {}) {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();
    
    this.activeSessions.set(sessionId, {
      startTime,
      task,
      agentsUsed: [],
      status: 'active'
    });

    try {
      // Register the session
      this.metrics.totalSessions++;
      
      // Determine the best agents for the task
      const selectedAgents = await this.selectAgentsForTask(task, options);
      
      if (selectedAgents.length === 0) {
        throw new Error('No suitable agents found for the task');
      }

      // Check for coordination needs
      const coordinatingAgents = await this.identifyCoordinatingAgents(selectedAgents, task);
      
      let result;
      if (coordinatingAgents.length > 0 && this.options.enableCoordination) {
        result = await this.executeWithCoordination(selectedAgents, coordinatingAgents, task, options, sessionId);
      } else {
        result = await this.executeSequentially(selectedAgents, task, options, sessionId);
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.metrics.successfulSessions++;
      this.metrics.avgResponseTime = 
        ((this.metrics.avgResponseTime * (this.metrics.successfulSessions - 1)) + responseTime) / 
        this.metrics.successfulSessions;

      // Update session status
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'completed';
        session.endTime = Date.now();
        session.result = result;
      }

      return result;
    } catch (error) {
      this.metrics.failedSessions++;
      
      // Update session status
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'failed';
        session.endTime = Date.now();
        session.error = error.message;
      }
      
      throw error;
    } finally {
      // Clean up session
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Select the best agents for a task
   */
  async selectAgentsForTask(task, options = {}) {
    const { requiredCapabilities, complexity, deadline, priority } = options;
    
    // Get all available agents
    const allAgents = await this.registry.getAllAgents();
    
    // Filter by capabilities
    let candidates = allAgents;
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      candidates = allAgents.filter(agent => 
        requiredCapabilities.every(cap => agent.capabilities.includes(cap))
      );
    }

    // Sort by priority and other factors
    candidates.sort((a, b) => {
      // Higher priority agents first
      let priorityDiff = (b.priority || 5) - (a.priority || 5);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Prefer less busy agents
      const aLoad = this.scheduler.getAgentLoad(a.id);
      const bLoad = this.scheduler.getAgentLoad(b.id);
      return aLoad - bLoad;
    });

    return candidates;
  }

  /**
   * Identify agents that should coordinate with the selected agents
   */
  async identifyCoordinatingAgents(selectedAgents, task) {
    if (!this.options.enableCoordination) return [];

    const coordinatingAgents = [];
    
    // Check coordination graph for related agents
    for (const agent of selectedAgents) {
      const relatedAgentIds = this.coordinationGraph.get(agent.id) || new Set();
      
      for (const relatedId of relatedAgentIds) {
        const relatedAgent = await this.registry.getAgentById(relatedId);
        if (relatedAgent && !selectedAgents.some(sa => sa.id === relatedId)) {
          // Check if coordination is beneficial for this task
          if (await this.shouldCoordinate(agent, relatedAgent, task)) {
            coordinatingAgents.push(relatedAgent);
          }
        }
      }
    }

    return coordinatingAgents;
  }

  /**
   * Execute task with coordination between agents
   */
  async executeWithCoordination(mainAgents, coordinatingAgents, task, options, sessionId) {
    console.log(`Coordinating ${mainAgents.length} main agents with ${coordinatingAgents.length} coordinating agents`);
    
    // Execute main agents
    const mainResults = await Promise.allSettled(
      mainAgents.map(agent => 
        this.executeSingleAgent(agent, task, options, sessionId)
      )
    );

    // Execute coordinating agents
    const coordResults = await Promise.allSettled(
      coordinatingAgents.map(agent => 
        this.executeSingleAgent(agent, task, options, sessionId)
      )
    );

    // Aggregate results
    const successfulMain = mainResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
    
    const successfulCoord = coordResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    return {
      mainResults: successfulMain,
      coordinationResults: successfulCoord,
      coordinationApplied: true
    };
  }

  /**
   * Execute agents sequentially
   */
  async executeSequentially(agents, task, options, sessionId) {
    const results = [];
    
    for (const agent of agents) {
      const result = await this.executeSingleAgent(agent, task, options, sessionId);
      results.push(result);
      
      // Update task context with agent's output for next agent
      if (result.success && result.output) {
        task.context = task.context ? `${task.context}\n\n${result.output}` : result.output;
      }
    }

    return {
      results,
      coordinationApplied: false
    };
  }

  /**
   * Execute a single agent
   */
  async executeSingleAgent(agent, task, options, sessionId) {
    const agentStart = Date.now();
    
    try {
      // Update session with agent usage
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.agentsUsed.push(agent.id);
      }

      // Execute the agent task
      const result = await this.registry.executeAgent(agent.id, task, options);
      
      const agentTime = Date.now() - agentStart;
      
      // Update metrics
      if (result.usage?.totalTokens) {
        this.metrics.totalTokens += result.usage.totalTokens;
      }

      return {
        agent: agent.id,
        success: true,
        output: result.output || result,
        responseTime: agentTime,
        tokensUsed: result.usage?.totalTokens
      };
    } catch (error) {
      return {
        agent: agent.id,
        success: false,
        error: error.message,
        responseTime: Date.now() - agentStart
      };
    }
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
    return score > this.options.coordinationThreshold;
  }

  /**
   * Add coordination relationship between agents
   */
  addCoordinationRelationship(agentAId, agentBId) {
    if (!this.coordinationGraph.has(agentAId)) {
      this.coordinationGraph.set(agentAId, new Set());
    }
    if (!this.coordinationGraph.has(agentBId)) {
      this.coordinationGraph.set(agentBId, new Set());
    }
    
    this.coordinationGraph.get(agentAId).add(agentBId);
    this.coordinationGraph.get(agentBId).add(agentAId);
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get active sessions
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.entries()).map(([id, session]) => ({
      id,
      ...session
    }));
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown() {
    // Clean up active sessions
    for (const [sessionId, session] of this.activeSessions) {
      if (session.status === 'active') {
        session.status = 'interrupted';
        session.endTime = Date.now();
      }
    }
    
    // Shutdown subsystems
    await this.commBus.shutdown();
    await this.stateMachine.shutdown();
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();

// Export as nexus for backward compatibility
export const nexus = agentOrchestrator;

// Export class for instantiation if needed
export default agentOrchestrator;