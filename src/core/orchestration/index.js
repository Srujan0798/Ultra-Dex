// Copyright (c) 2026 Ultra-Dex
/**
 * Agent Orchestration System (v6.0.0)
 * Coordinates multi-agent workflows and manages agent communication.
 */

import { executeProtocol21 } from '../quality/protocol-21.js';
import { AgentStateMachine } from './agent-state.js';
import { AgentCommunicationBus } from './communication-bus.js';
import { AgentScheduler } from './scheduler.js';
import { AgentRegistry } from './registry.js';
import chalk from 'chalk';
import { ppmManager } from '../memory/manager.js';
import { ciHealer } from '../cicd/self-healing.js';
import { aiMetaLayer } from '../ai/ai-meta-layer.js';
import { createMcpServer } from '../../../apps/cli/lib/mcp/server.js';

class AgentOrchestrator {
  constructor(options = {}) {
    this.memory = ppmManager;
    this.healer = ciHealer;
    this.ai = aiMetaLayer;
    this.mcpServer = createMcpServer();
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
    this.coordinationGraph = new Map();
    
    this.metrics = {
      totalSessions: 0,
      successfulSessions: 0,
      failedSessions: 0,
      avgResponseTime: 0,
      totalTokens: 0
    };
  }

  async initialize() {
    await this.stateMachine.initialize();
    await this.commBus.initialize();
    await this.registry.initialize();
    console.log(chalk.green('🤖 Agent Orchestration System Initialized'));
  }

  /**
   * Execute a high-level objective using the autonomous Nexus mode
   */
  async executeNexus(objective, options = {}) {
    console.log(chalk.magenta(`\n🌌 Nexus Orchestration: ${objective}`));
    await this.memory.init();
    
    // Integrate with Ralph Loop for autonomous execution
    const { runAutonomousTask } = await import('../agents/ralph-loop.js');
    return await runAutonomousTask(objective, options);
  }

  /**
   * Alias for executeNexus to support CLI compatibility
   */
  async execute(objective, options = {}) {
    return await this.executeNexus(objective, options);
  }

  async executeTask(task, options = {}) {
    const sessionId = `session_${Date.now()}`;
    this.metrics.totalSessions++;
    
    console.log(chalk.blue(`  - Executing Task: ${task}`));
    
    // 1. Determine Agent & Gather Context
    const agentId = options.agentId || this.selectAgentForTask(task, options);
    const memoryContext = await this.memory.search(task);
    const systemPrompt = await this.registry.getAgentPrompt(agentId);

    // 2. Call AI Meta-Layer
    const response = await this.ai.call(null, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context: ${JSON.stringify(memoryContext)}\n\nTask: ${task}` }
    ], { 
      metadata: { 
        taskType: options.taskType || 'coding', 
        complexity: options.complexity || 'medium' 
      } 
    });

    const output = response.text || response.content || JSON.stringify(response);

    // 3. Record Observation
    await this.memory.add({
      content: `Task Completed by @${agentId}: ${task}\nOutput: ${output.substring(0, 200)}...`,
      type: 'observation',
      importance: 5,
      metadata: { agentId, sessionId }
    });

    return { status: 'COMPLETE', output, agentId };
  }

  selectAgentForTask(task, options) {
    if (options.requiredCapabilities) {
      const candidates = this.registry.findAgentsByCapabilities(options.requiredCapabilities);
      if (candidates.length > 0) return candidates[0].id;
    }
    
    // Default fallback agents based on keywords
    const taskLower = task.toLowerCase();
    if (taskLower.includes('ui') || taskLower.includes('css') || taskLower.includes('component')) return 'frontend';
    if (taskLower.includes('api') || taskLower.includes('route') || taskLower.includes('server')) return 'backend';
    if (taskLower.includes('db') || taskLower.includes('schema') || taskLower.includes('sql')) return 'database';
    if (taskLower.includes('test') || taskLower.includes('spec')) return 'testing';
    
    return 'orchestrator';
  }

  async getTools() {
    return await this.mcpServer.listTools();
  }

  async executeTool(name, args) {
    try {
      const result = await this.mcpServer.callTool(name, args);
      return result;
    } catch (error) {
      console.error(`❌ MCP Tool Error (${name}): ${error.message}`);
      throw error;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }
}

export const agentOrchestrator = new AgentOrchestrator();
export const nexus = agentOrchestrator;
export default agentOrchestrator;
