// Copyright (c) 2026 Ultra-Dex
/**
 * Agent Orchestration System (v6.0.0)
 * Coordinates multi-agent workflows and manages agent communication.
 */

import { AgentStateMachine } from './agent-state.js';
import { AgentCommunicationBus } from './communication-bus.js';
import { AgentScheduler } from './scheduler.js';
import { AgentRegistry } from './registry.js';
import chalk from 'chalk';
import { ppmManager } from '../memory/manager.js';
import { aiMetaLayer } from '../ai/ai-meta-layer.js';
import { EventEmitter } from 'events';

class TaskGraph {
  constructor() {
    this.tasks = new Map();
  }

  addTask(task) {
    if (!task.id) task.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.tasks.set(task.id, {
      ...task,
      dependencies: task.dependencies || [],
      status: task.status || 'pending',
    });
    return task.id;
  }

  markComplete(taskId) {
    const task = this.tasks.get(taskId);
    if (task) task.status = 'completed';
  }

  getReadyTasks() {
    const ready = [];
    for (const task of this.tasks.values()) {
      if (task.status !== 'pending') continue;
      const depsMet = task.dependencies.every((depId) => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === 'completed';
      });
      if (depsMet) ready.push(task);
    }
    return ready;
  }

  hasPending() {
    return Array.from(this.tasks.values()).some((task) => task.status === 'pending');
  }
}

class AgentOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.memory = ppmManager;
    this.ai = aiMetaLayer;
    this.mcpServer = this.normalizeMcpServer(options.mcpServer);
    this.mcpServerFactory = options.mcpServerFactory;
    this.nexusExecutor = options.nexusExecutor;
    this.tasks = new TaskGraph();
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

  normalizeMcpServer(server) {
    if (server?.toolsMap instanceof Map) {
      return server;
    }
    return { toolsMap: new Map() };
  }

  async initialize() {
    try {
      await this.stateMachine.initialize();
      await this.commBus.initialize();
      await this.registry.initialize();
      await this.initializeMcpServer();
      console.log(chalk.green('🤖 Agent Orchestration System Initialized'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ Agent Orchestration initialization failed: ${message}`));
      throw error;
    }
  }

  async initializeMcpServer() {
    if (this.mcpServer?.toolsMap instanceof Map && this.mcpServer.toolsMap.size > 0) {
      return;
    }

    if (typeof this.mcpServerFactory !== 'function') {
      return;
    }

    try {
      const server = await this.mcpServerFactory();
      this.mcpServer = this.normalizeMcpServer(server);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.mcpServer = { toolsMap: new Map() };
      console.warn(chalk.yellow(`⚠ MCP tools unavailable; continuing without tool registry: ${message}`));
    }
  }

  /**
   * Execute a high-level objective using the autonomous Nexus mode
   */
  async executeNexus(objective, options = {}) {
    console.log(chalk.magenta(`\n🌌 Nexus Orchestration: ${objective}`));
    try {
      await this.memory.init();

      // Integrate with Ralph Loop for autonomous execution
      if (typeof this.nexusExecutor === 'function') {
        return await this.nexusExecutor(objective, options, this);
      }

      const { runAutonomousTask } = await import('../agents/ralph-loop.js');
      return await runAutonomousTask(objective, options, this);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ Nexus execution failed: ${message}`));
      throw error;
    }
  }

  /**
   * Alias for executeNexus to support CLI compatibility
   */
  async execute(objective, options = {}) {
    return await this.executeNexus(objective, options);
  }

  async executeTask(task, options = {}) {
    const sessionId = `session_${Date.now()}`;
    const startedAt = Date.now();
    const normalizedTask = typeof task === 'string' ? task : JSON.stringify(task);
    this.metrics.totalSessions++;
    
    this.emit('task:start', { sessionId, task: normalizedTask, options });
    console.log(chalk.blue(`  - Executing Task: ${normalizedTask}`));
    try {
      // 1. Determine Agent & Gather Context
      const agentId = options.agentId || this.selectAgentForTask(normalizedTask, options);
      const memoryContext = await this.memory.search(normalizedTask);
      const systemPrompt = await this.registry.getAgentPrompt(agentId);

      // 2. Call AI Meta-Layer
      const response = await this.ai.call(
        null,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Context: ${JSON.stringify(memoryContext)}\n\nTask: ${normalizedTask}` },
        ],
        {
          metadata: {
            taskType: options.taskType || 'coding',
            complexity: options.complexity || 'medium',
          },
        }
      );

      const output = response.text || response.content || JSON.stringify(response);

      // 3. Record Observation
      await this.memory.add({
        content: `Task Completed by @${agentId}: ${normalizedTask}\nOutput: ${output.substring(0, 200)}...`,
        type: 'observation',
        importance: 5,
        metadata: { agentId, sessionId },
      });

      this.metrics.successfulSessions++;
      this.emit('task:complete', { sessionId, agentId, output: output.substring(0, 500) });
      return { status: 'COMPLETE', output, agentId };
    } catch (error) {
      this.metrics.failedSessions++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ Task execution failed (${sessionId}): ${message}`));
      this.emit('task:error', { sessionId, task: normalizedTask, error: message });
      throw error;
    } finally {
      const elapsed = Date.now() - startedAt;
      const completedSessions = this.metrics.successfulSessions + this.metrics.failedSessions;
      if (completedSessions > 0) {
        this.metrics.avgResponseTime =
          (this.metrics.avgResponseTime * (completedSessions - 1) + elapsed) / completedSessions;
      }
    }
  }

  selectAgentForTask(task, options = {}) {
    if (!task || typeof task !== 'string') {
      return 'orchestrator';
    }
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
    // Convert registered tools to a format the AI Meta-Layer understands
    const tools = [];
    if (this.mcpServer.toolsMap) {
      for (const [name, tool] of this.mcpServer.toolsMap.entries()) {
        tools.push({
          name: name,
          description: tool.description,
          inputSchema: tool.schema
        });
      }
    }
    return { tools };
  }

  async executeTool(name, args) {
    try {
      this.emit('tool:use', { name, args });
      const tool = this.mcpServer.toolsMap?.get(name);
      if (!tool) throw new Error(`Tool ${name} not found`);
      
      // Call the tool's handler directly
      const result = await tool.handler(args);
      this.emit('tool:result', { name, result: JSON.stringify(result).substring(0, 500) });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Internal Tool Error (${name}): ${message}`);
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
