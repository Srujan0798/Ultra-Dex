// Copyright (c) 2026 Ultra-Dex
/**
 * Agent Orchestration System (v6.0.0)
 * Coordinates multi-agent workflows and manages agent communication.
 */

import { AgentStateMachine } from './agent-state.js';
import { AgentCommunicationBus } from './communication-bus.js';
import { AgentRegistry } from './registry.js';
import { ExecutionContext, TaskGraph } from './execution-context.js';
import chalk from '../../utils/chalk.js';
import { ppmManager } from '../memory/manager.js';
import { EventEmitter } from 'events';
import { GovernanceManager, GovernanceDeniedException } from '../governance/governance-manager.js';

export class AgentOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.memory = ppmManager;
    this.ai = options.ai || null;
    this.selfHealing = options.selfHealing || null;
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
      ...options,
    };

    this.stateMachine = new AgentStateMachine();
    this.commBus = new AgentCommunicationBus();
    this.registry = new AgentRegistry();
    // NOTE: AgentScheduler removed in Milestone 1 (dead code).
    // Re-design scheduling in Milestone 4 if priority-based task routing is needed.
    this.governance = new GovernanceManager();
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

  async initialize() {
    try {
      await this.stateMachine.initialize();
      await this.commBus.initialize();
      await this.registry.initialize();
      await this.initializeMcpServer();

      // Initialize Self-Healing
      const selfHealing = await this.getSelfHealing();
      await selfHealing.start();

      process.stdout.write(chalk.green('🤖 Agent Orchestration System Initialized (Self-Healing Active)\n'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(chalk.red(`❌ Agent Orchestration initialization failed: ${message}\n`));
      throw error;
    }
  }

  async initializeMcpServer() {
    if (this.mcpServer?.toolsMap instanceof Map && this.mcpServer.toolsMap.size > 0) {
      return;
    }

    if (typeof this.mcpServerFactory !== 'function') {
      // Try to create a default MCP server with tools registered
      try {
        const { createMcpServer } = await import('../../../apps/cli/lib/mcp/server.js');
        const { registerTools } = await import('../../../apps/cli/lib/mcp/tools.js');

        const server = createMcpServer();
        registerTools(server);

        this.mcpServer = this.normalizeMcpServer(server);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.mcpServer = { toolsMap: new Map() };
        process.stderr.write(
          chalk.yellow(`⚠ MCP tools unavailable; continuing without tool registry: ${message}\n`)
        );
      }
      return;
    }

    try {
      const server = await this.mcpServerFactory();
      this.mcpServer = this.normalizeMcpServer(server);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.mcpServer = { toolsMap: new Map() };
      process.stderr.write(
        chalk.yellow(`⚠ MCP tools unavailable; continuing without tool registry: ${message}\n`)
      );
    }
  }

  createExecutionContext(objective, options = {}) {
    const sessionId =
      options.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return new ExecutionContext(sessionId, objective, options);
  }

  async getAiLayer() {
    if (this.ai) {
      return this.ai;
    }

    const { aiMetaLayer } = await import('../ai/ai-meta-layer.js');
    this.ai = aiMetaLayer;
    return this.ai;
  }

  async getSelfHealing() {
    if (this.selfHealing) {
      return this.selfHealing;
    }

    const { selfHealing } = await import('../reliability/self-healing.js');
    this.selfHealing = selfHealing;
    return this.selfHealing;
  }

  /**
   * Execute a high-level objective using the autonomous Nexus mode
   */
  async executeNexus(objective, options = {}) {
    // Prune completed tasks older than 5 minutes to prevent memory leaks
    this.tasks.prune();

    process.stdout.write(chalk.magenta(`\n🌌 Nexus Orchestration: ${objective}\n`));
    const executionContext = this.createExecutionContext(objective, options);
    this.activeSessions.set(executionContext.sessionId, executionContext);

    try {
      await this.memory.init();

      // Integrate with Ralph Loop for autonomous execution
      if (typeof this.nexusExecutor === 'function') {
        const result = await this.nexusExecutor(objective, options, this, executionContext);
        executionContext.status = 'completed';
        return result;
      }

      const { runAutonomousTask } = await import('../agents/ralph-loop.js');
      const result = await runAutonomousTask(objective, options, this, executionContext);
      executionContext.status = 'completed';
      return result;
    } catch (error) {
      executionContext.status = 'failed';
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(chalk.red(`❌ Nexus execution failed: ${message}\n`));

      // Report failure to Self-Healing
      const selfHealing = await this.getSelfHealing();
      await selfHealing.reportAgentError('nexus', error, { objective, options });

      throw error;
    } finally {
      this.activeSessions.delete(executionContext.sessionId);
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

    // Governance context
    const agentId = options.agentId || this.selectAgentForTask(normalizedTask, options);
    const context = {
      agentId: agentId,
      action: 'executeTask',
      resource: normalizedTask.substring(0, 100), // Truncate for resource field
      details: { task: normalizedTask, options },
    };

    this.emit('task:start', { sessionId, task: normalizedTask, options });
    process.stdout.write(chalk.blue(`  - Executing Task: ${normalizedTask}\n`));
    try {
      const ai = await this.getAiLayer();

      // 1. Determine Agent & Gather Context
      const memoryContext = await this.memory.search(normalizedTask);
      const systemPrompt = await this.registry.getAgentPrompt(agentId);

      // Governance check before task execution
      const governanceResult = await this.governance.gate(context);
      if (!governanceResult.allowed) {
        throw new GovernanceDeniedException(
          `Task execution blocked by governance policy: ${governanceResult.reason}`,
          context
        );
      }

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
      process.stderr.write(chalk.red(`❌ Task execution failed (${sessionId}): ${message}\n`));
      this.emit('task:error', { sessionId, task: normalizedTask, error: message });

      // Report to Self-Healing
      const selfHealing = await this.getSelfHealing();
      await selfHealing.reportAgentError(options.agentId || 'unknown', error, {
        sessionId,
        task: normalizedTask,
      });

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
      process.stderr.write(`❌ Internal Tool Error (${name}): ${message}\n`);
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
