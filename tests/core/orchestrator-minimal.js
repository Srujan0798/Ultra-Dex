// Copyright (c) 2026 Ultra-Dex
/**
 * Agent Orchestration System (v6.0.0)
 * Coordinates multi-agent workflows and manages agent communication.
 */

import { EventEmitter } from 'events';

class TaskGraph {
  prune() {}
}

export class AgentOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.memory = options.memory || { init: async () => {}, search: async () => [], add: async () => {} };
    this.ai = options.ai || null;
    this.selfHealing = options.selfHealing || null;
    this.mcpServer = { toolsMap: new Map() };
    this.tasks = new TaskGraph();
    this.options = {
      maxConcurrentAgents: options.maxConcurrentAgents || 8,
      enableCoordination: options.enableCoordination !== false,
      enableLoadBalancing: options.enableLoadBalancing !== false,
      enableDynamicAllocation: options.enableDynamicAllocation !== false,
      coordinationThreshold: options.coordinationThreshold || 0.7,
      ...options,
    };

    this.stateMachine = { initialize: async () => {} };
    this.commBus = { initialize: async () => {} };
    this.registry = { 
        initialize: async () => {},
        registerAgent: async () => {},
        findAgentsByCapabilities: () => [],
        getAgentPrompt: async () => 'Mock prompt'
    };
    this.governance = {
        gate: async () => ({ allowed: true }),
        audit: { record: async () => {} }
    };
    this.activeSessions = new Map();
    this.coordinationGraph = new Map();

    this.metrics = {
      totalSessions: 0,
      successfulSessions: 0,
      failedSessions: 0,
      avgResponseTime: 0,
      totalTokens: 0,
    };
  }

  normalizeMcpServer(server) {
    if (server?.toolsMap instanceof Map) {
      return server;
    }
    return { toolsMap: new Map() };
  }

  async initializeMcpServer() {
    if (typeof this.mcpServerFactory === 'function') {
        const server = await this.mcpServerFactory();
        this.mcpServer = this.normalizeMcpServer(server);
    }
  }

  async executeNexus(objective, options = {}) {
    this.tasks.prune();
    if (typeof this.nexusExecutor === 'function') {
        return await this.nexusExecutor(objective, options, this);
    }
    return { status: 'completed' };
  }

  async execute(objective, options = {}) {
    return await this.executeNexus(objective, options);
  }

  async executeTask(task, options = {}) {
    const sessionId = `session_${Date.now()}`;
    const startedAt = Date.now();
    const normalizedTask = typeof task === 'string' ? task : JSON.stringify(task);
    this.metrics.totalSessions++;

    // Governance context
    const agentId = options.agentId || this.selectAgentForTask(normalizedTask, options);
    const context = {
      agentId: agentId,
      action: 'executeTask',
      resource: normalizedTask.substring(0, 100), // Truncate for resource field
      details: { task: normalizedTask, options },
    };

    this.emit('task:start', { sessionId, task: normalizedTask, options });
    console.log(`  - Executing Task: ${normalizedTask}\n`);
    try {
      // Governance check FIRST (before loading AI or gathering context)
      const governanceResult = await this.governance.gate(context);
      if (!governanceResult.allowed) {
        throw new Error(
          `Task execution blocked by governance policy: ${governanceResult.reason}`
        );
      }

      const ai = await this.getAiLayer ? await this.getAiLayer() : this.ai;

      // 1. Determine Agent & Gather Context
      const memoryContext = await this.memory.search(normalizedTask);
      const systemPrompt = await this.registry.getAgentPrompt(agentId);

      // 2. Call AI Meta-Layer
      const response = await ai.call(
        null,
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Context: ${JSON.stringify(memoryContext)}\n\nTask: ${normalizedTask}`,
          },
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

      // Audit successful execution
      await this.governance.audit.record({
        action: 'task_execution',
        task: normalizedTask,
        result: 'success',
        agentId: context.agentId,
        details: { options },
      });

      this.metrics.successfulSessions++;
      this.emit('task:complete', { sessionId, agentId, output: output.substring(0, 500) });
      return { status: 'COMPLETE', output, agentId };
    } catch (error) {
      // Audit failed execution
      await this.governance.audit.record({
        action: 'task_execution',
        task: normalizedTask,
        result: 'failure',
        agentId: context.agentId,
        details: { options, error: error.message },
      });

      this.metrics.failedSessions++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Task execution failed (${sessionId}): ${message}\n`);
      this.emit('task:error', { sessionId, task: normalizedTask, error: message });

      // Report to Self-Healing
      if (this.getSelfHealing) {
          const selfHealing = await this.getSelfHealing();
          await selfHealing.reportAgentError(options.agentId || 'unknown', error, {
            sessionId,
            task: normalizedTask,
          });
      }

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
    if (taskLower.includes('ui') || taskLower.includes('css') || taskLower.includes('component'))
      return 'frontend';
    if (taskLower.includes('api') || taskLower.includes('route') || taskLower.includes('server'))
      return 'backend';
    if (taskLower.includes('db') || taskLower.includes('schema') || taskLower.includes('sql'))
      return 'database';
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
          inputSchema: tool.schema,
        });
      }
    }
    return { tools };
  }

  async executeTool(name, args) {
    // Governance context
    const context = {
      agentId: 'orchestrator',
      action: `tool:${name}`,
      resource: name,
      details: { toolName: name, args },
    };

    try {
      this.emit('tool:use', { name, args });
      const tool = this.mcpServer.toolsMap?.get(name);
      if (!tool) throw new Error(`Tool ${name} not found`);

      // Governance check before tool execution
      const governanceResult = await this.governance.gate(context);
      if (!governanceResult.allowed) {
        throw new GovernanceDeniedException(
          `Tool execution blocked by governance policy: ${governanceResult.reason}`,
          context
        );
      }

      // Call the tool's handler directly
      const result = await tool.handler(args);

      // Audit successful execution
      await this.governance.audit.record({
        action: 'tool_execution',
        tool: name,
        args,
        result: 'success',
        agentId: context.agentId,
        details: { toolName: name },
      });

      this.emit('tool:result', { name, result: JSON.stringify(result).substring(0, 500) });
      return result;
    } catch (error) {
      // Audit failed execution
      await this.governance.audit.record({
        action: 'tool_execution',
        tool: name,
        args,
        result: 'failure',
        agentId: context.agentId,
        details: { toolName: name, error: error.message },
      });

      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Internal Tool Error (${name}): ${message}\n`);
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
