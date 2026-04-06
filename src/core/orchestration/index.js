// Copyright (c) 2026 Ultra-Dex
/**
 * Agent Orchestration System (v6.0.0)
 * Coordinates multi-agent workflows and manages agent communication.
 */

import { AgentStateMachine } from './agent-state.js';
import { AgentCommunicationBus } from './communication-bus.js';
import { AgentRegistry } from './registry.js';
import { ExecutionContext, TaskGraph } from './execution-context.js';
import { DistributedCoordinator } from './distributed-coordinator.js';
import { TaskRouter } from './task-router.js';
import { AGENT_PROFILES } from '../routing/agent-profiles.js';
import chalk from '../../utils/chalk.js';
import { ppmManager } from '../memory/index.js';
import { MemoryManager } from '../memory/manager.js';
import { AIMetaLayer } from '../ai/ai-meta-layer.js';
import { EventEmitter } from 'events';
import { GovernanceManager, GovernanceDeniedException } from '../governance/governance-manager.js';
import { EnterpriseAnalytics, enterpriseAnalytics } from '../analytics/enterprise-analytics.js';
import {
  registerAlias,
  registerScoped,
  resolveFromContainer,
} from '../di/container.js';
import { DI_TOKENS } from '../di/tokens.js';

export class AgentOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.sessionId = options.sessionId || null;
    this.memory = options.memory || ppmManager;
    this.ai = options.ai || null;
    this.telemetry = options.telemetry || enterpriseAnalytics;
    this.selfHealing = options.selfHealing || null;
    this.autopsy = options.autopsy || null;
    this.performanceTracker = options.performanceTracker || null;
    this.queueProcessor = options.queueProcessor || null;
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
      predictiveMemory: {
        enabled: options.predictiveMemory?.enabled !== false,
        timeout: options.predictiveMemory?.timeout || 5000,
        cacheTtl: options.predictiveMemory?.cacheTtl || 300000,
      },
    };

    this.stateMachine = new AgentStateMachine();
    this.commBus = new AgentCommunicationBus();
    this.registry =
      options.registry ||
      new AgentRegistry({
        autoDiscover: options.autoDiscover,
        enablePersistence: options.enablePersistence,
        maxAgents: options.maxAgents,
        agentsPath: options.agentsPath,
      });
    // NOTE: AgentScheduler removed in Milestone 1 (dead code).
    // Re-design scheduling in Milestone 4 if priority-based task routing is needed.
    this.governance = options.governance || new GovernanceManager();
    this.taskRouter = new TaskRouter({ similarityThreshold: 0.3 });
    this.initializeTaskRouter();
    this.activeSessions = new Map();
    this.coordinationGraph = new Map();
    this.activeTaskCount = 0;
    this.taskQueueInitialized = false;
    this.predictiveEngine = options.predictiveEngine || null;

    this.metrics = {
      totalSessions: 0,
      successfulSessions: 0,
      failedSessions: 0,
      avgResponseTime: 0,
      totalTokens: 0,
      lastTaskDurationMs: 0,
      lastPrefetchTimeMs: 0,
      prefetchHitRate: 0,
      timeToFirstTokenMs: 0,
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
      await selfHealing.initialize();

      process.stdout.write(
        chalk.green('🤖 Agent Orchestration System Initialized (Self-Healing Active)\n')
      );
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
      options.sessionId ||
      this.sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return new ExecutionContext(sessionId, objective, options);
  }

  async trackMetric(name, value, tags = {}, metadata = {}) {
    if (!this.telemetry?.trackMetric) {
      return;
    }

    await this.telemetry.trackMetric(name, value, tags, metadata);
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

    const { SelfHealingOrchestrator } = await import('../reliability/self-healing.js');
    this.selfHealing = new SelfHealingOrchestrator();
    return this.selfHealing;
  }

  async getPerformanceTracker() {
    if (this.options.enablePerformanceTracking === false) {
      return null;
    }

    if (this.performanceTracker) {
      return this.performanceTracker;
    }

    try {
      const { performanceMonitor } = await import('../performance/monitor.js');
      this.performanceTracker = performanceMonitor;
    } catch {
      this.performanceTracker = null;
    }

    return this.performanceTracker;
  }

  async getAutopsy() {
    if (this.autopsy) {
      return this.autopsy;
    }

    try {
      const { AgentAutopsy } = await import('../reliability/agent-autopsy.js');
      this.autopsy = new AgentAutopsy();
      if (typeof this.autopsy.initialize === 'function' && !this.autopsy.initialized) {
        await this.autopsy.initialize();
      }
    } catch {
      this.autopsy = null;
    }

    return this.autopsy;
  }

  async getPredictiveEngine() {
    if (this.options.predictiveMemory?.enabled === false) {
      return null;
    }

    if (this.predictiveEngine) {
      return this.predictiveEngine;
    }

    try {
      const { predictiveEngine } = await import('../memory/predictive-engine.js');
      predictiveEngine.memory = this.memory;
      predictiveEngine.cacheTtl = this.options.predictiveMemory?.cacheTtl || predictiveEngine.cacheTtl;
      this.predictiveEngine = predictiveEngine;
    } catch {
      this.predictiveEngine = null;
    }

    return this.predictiveEngine;
  }

  setQueueProcessor(queueProcessor) {
    this.queueProcessor = queueProcessor;

    if (!queueProcessor?.registerHandler || this.taskQueueInitialized) {
      if (queueProcessor?.start && !queueProcessor.running) {
        queueProcessor.start();
      }
      return this.queueProcessor;
    }

    queueProcessor.registerHandler('orchestrator.executeTask', async (payload) => {
      return await this.runTaskExecution(payload.task, {
        ...payload.options,
        skipQueue: true,
      });
    });

    this.taskQueueInitialized = true;
    if (queueProcessor.start && !queueProcessor.running) {
      queueProcessor.start();
    }

    return this.queueProcessor;
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
    const predictiveEngine = await this.getPredictiveEngine();
    if (predictiveEngine) {
      predictiveEngine.spawnBackgroundPrefetch(executionContext.sessionId, objective, {
        cacheTtl: this.options.predictiveMemory?.cacheTtl,
      });
    }

    try {
      await this.memory.init();
      const prefetchedContext = predictiveEngine
        ? await predictiveEngine.awaitPrefetch(
            executionContext.sessionId,
            this.options.predictiveMemory?.timeout
          )
        : null;
      if (prefetchedContext?.items?.length) {
        predictiveEngine.recordUsage(executionContext.sessionId, true);
        this.metrics.lastPrefetchTimeMs = prefetchedContext.metrics.durationMs;
      }

      // Integrate with Ralph Loop for autonomous execution
      if (typeof this.nexusExecutor === 'function') {
        const result = await this.nexusExecutor(
          objective,
          {
            ...options,
            context: {
              ...options.context,
              initialContext: prefetchedContext?.items || options.context?.initialContext || [],
              predictivePrefetch: prefetchedContext,
            },
          },
          this,
          executionContext
        );
        executionContext.status = 'completed';
        return result;
      }

      const { runAutonomousTask } = await import('../agents/ralph-loop.js');
      const result = await runAutonomousTask(
        objective,
        {
          ...options,
          context: {
            ...options.context,
            initialContext: prefetchedContext?.items || options.context?.initialContext || [],
            predictivePrefetch: prefetchedContext,
          },
        },
        this,
        executionContext
      );
      executionContext.status = 'completed';
      return result;
    } catch (error) {
      executionContext.status = 'failed';
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(chalk.red(`❌ Nexus execution failed: ${message}\n`));

      // Report failure to Self-Healing
      const selfHealing = await this.getSelfHealing();
      if (selfHealing?.reportAgentError) {
        await selfHealing.reportAgentError('nexus', error, { objective, options });
      }

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
    if (
      !options.skipQueue &&
      this.queueProcessor &&
      this.activeTaskCount >= this.options.maxConcurrentAgents
    ) {
      const normalizedTask = typeof task === 'string' ? task : JSON.stringify(task);
      const queuedJob = this.queueProcessor.enqueue(
        {
          type: 'orchestrator.executeTask',
          payload: { task, options },
          priority: options.priority || 5,
          maxRetries: options.maxRetries || 1,
        },
        options.priority || 5
      );

      this.emit('task:queued', {
        jobId: queuedJob.id,
        task: normalizedTask,
        priority: queuedJob.priority,
      });

      return await new Promise((resolve, reject) => {
        const finalize = (job) => {
          if (job.id !== queuedJob.id) {
            return;
          }

          cleanup();
          if (job.status === 'completed') {
            resolve(job.result);
            return;
          }

          reject(new Error(job.error || `Queued task ${job.id} failed`));
        };

        const cleanup = () => {
          this.queueProcessor.off('job:completed', finalize);
          this.queueProcessor.off('job:failed', finalize);
        };

        this.queueProcessor.on('job:completed', finalize);
        this.queueProcessor.on('job:failed', finalize);
      });
    }

    return await this.runTaskExecution(task, options);
  }

  async runTaskExecution(task, options = {}) {
    const sessionId = `session_${Date.now()}`;
    const startedAt = Date.now();
    const normalizedTask = typeof task === 'string' ? task : JSON.stringify(task);
    const predictiveEngine = await this.getPredictiveEngine();
    this.metrics.lastPrefetchTimeMs = 0;
    if (predictiveEngine) {
      predictiveEngine.spawnBackgroundPrefetch(sessionId, normalizedTask, {
        cacheTtl: this.options.predictiveMemory?.cacheTtl,
      });
    }
    
    // Analytics: Track task start
    await this.trackMetric('execution.tasks_started', 1, { 
      sessionId, 
      taskType: options.taskType || 'coding' 
    });

    this.metrics.totalSessions++;
    this.activeTaskCount++;

    // Governance context
    const agentId = options.agentId || this.selectAgentForTask(normalizedTask, options);
    const context = {
      agentId: agentId,
      action: 'executeTask',
      resource: normalizedTask.substring(0, 100), // Truncate for resource field
      details: { task: normalizedTask, options },
    };
    const performanceTracker = await this.getPerformanceTracker();
    const performanceStart = 
      typeof performanceTracker?.startTimer === 'function' 
      ? performanceTracker.startTimer() 
      : Date.now();
    let taskSucceeded = false;
    let taskErrorMessage = null;

    this.emit('task:start', { sessionId, task: normalizedTask, options });
    if (performanceTracker) {
      this.emit('task:performance:start', { 
        sessionId, 
        agentId, 
        task: normalizedTask, 
        taskType: options.taskType || 'coding', 
      });
    }
    process.stdout.write(chalk.blue(` - Executing Task: ${normalizedTask}\n`));
    try {
      // Governance check FIRST (before loading AI or gathering context)
      const governanceResult = await this.governance.gate(context);
      if (!governanceResult.allowed) {
        throw new GovernanceDeniedException( 
          `Task execution blocked by governance policy: ${governanceResult.reason}`, 
          context 
        );
      }

      const ai = await this.getAiLayer();

      // 1. Determine Agent & Gather Context
      const prefetchedContext = predictiveEngine
        ? await predictiveEngine.awaitPrefetch(sessionId, this.options.predictiveMemory?.timeout)
        : null;
      let memoryContext = prefetchedContext?.items || null;
      if (Array.isArray(memoryContext) && memoryContext.length > 0) {
        predictiveEngine.recordUsage(sessionId, true);
        this.metrics.lastPrefetchTimeMs = prefetchedContext.metrics?.durationMs || 0;
      } else {
        if (predictiveEngine) {
          predictiveEngine.recordUsage(sessionId, false);
        }
        memoryContext = await this.memory.search(normalizedTask);
      }
      const predictiveStats = predictiveEngine?.getStats?.() || null;
      if (predictiveStats) {
        this.metrics.prefetchHitRate = predictiveStats.prefetchHitRate;
      }
      const systemPrompt = await this.registry.getAgentPrompt(agentId);

      // 2. Call AI Meta-Layer
      const firstTokenStartedAt = Date.now();
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
      this.metrics.timeToFirstTokenMs = Date.now() - firstTokenStartedAt;
      await this.trackMetric('execution.prefetch_time_ms', this.metrics.lastPrefetchTimeMs, {
        sessionId,
        agentId,
      });
      await this.trackMetric('execution.prefetch_hit_rate', this.metrics.prefetchHitRate, {
        sessionId,
        agentId,
      });

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

      // Analytics: Track task completion
      await this.trackMetric('execution.tasks_completed', 1, { 
        sessionId, 
        agentId, 
        duration: Date.now() - startedAt 
      });

      this.metrics.successfulSessions++;
      taskSucceeded = true;
      this.emit('task:complete', { sessionId, agentId, output: output.substring(0, 500) });
      return { status: 'COMPLETE', output, agentId };
    } catch (error) {
      this.metrics.failedSessions++;
      const message = error instanceof Error ? error.message : String(error);
      taskErrorMessage = message;

      // Analytics: Track task failure
      await this.trackMetric('execution.tasks_failed', 1, { 
        sessionId, 
        error: message 
      });

      let autopsyReport = null;

      try {
        const autopsy = await this.getAutopsy();
        if (autopsy) {
          autopsyReport = await autopsy.performAutopsy(context.agentId, error, { 
            sessionId, 
            task: normalizedTask, 
            taskType: options.taskType || 'coding', 
            options, 
          });

          await this.governance.audit.record({ 
            action: 'task_autopsy', 
            task: normalizedTask, 
            result: 'recorded', 
            agentId: context.agentId, 
            details: { 
              sessionId, 
              taskType: options.taskType || 'coding', 
              autopsy: autopsyReport, 
            }, 
          });

          this.emit('task:autopsy', { 
            sessionId, 
            agentId: context.agentId, 
            task: normalizedTask, 
            autopsy: autopsyReport, 
          });
        }
      } catch (autopsyError) {
        const autopsyMessage = 
          autopsyError instanceof Error ? autopsyError.message : String(autopsyError);
        this.emit('task:autopsy:error', { 
          sessionId, 
          agentId: context.agentId, 
          task: normalizedTask, 
          error: autopsyMessage, 
        });
      }

      // Audit failed execution
      await this.governance.audit.record({ 
        action: 'task_execution', 
        task: normalizedTask, 
        result: 'failure', 
        agentId: context.agentId, 
        details: { 
          options, 
          error: message, 
          autopsyId: autopsyReport?.id || null, 
          autopsySummary: autopsyReport?.summary || null, 
        }, 
      });

      process.stderr.write(chalk.red(`❌ Task execution failed (${sessionId}): ${message}\n`));
      this.emit('task:error', { sessionId, task: normalizedTask, error: message });

      // Report to Self-Healing
      const selfHealing = await this.getSelfHealing();
      if (selfHealing?.reportAgentError) {
        await selfHealing.reportAgentError(options.agentId || 'unknown', error, { 
          sessionId, 
          task: normalizedTask, 
        });
      }

      throw error;
    } finally {
      this.activeTaskCount = Math.max(0, this.activeTaskCount - 1);
      const elapsed = Date.now() - startedAt;
      this.metrics.lastTaskDurationMs = elapsed;
      const completedSessions = this.metrics.successfulSessions + this.metrics.failedSessions;
      if (completedSessions > 0) {
        this.metrics.avgResponseTime = 
          (this.metrics.avgResponseTime * (completedSessions - 1) + elapsed) / completedSessions;
      }

      if (performanceTracker) {
        const requestInfo = { 
          endpoint: 'executeTask', 
          method: 'TASK', 
          statusCode: taskSucceeded ? 200 : 500, 
          agentId, 
          taskType: options.taskType || 'coding', 
        };
        const entry = 
          typeof performanceTracker.endTimer === 'function' 
          ? performanceTracker.endTimer(performanceStart, requestInfo) 
          : performanceTracker.trackRequest?.(requestInfo, elapsed);
        this.emit('task:performance:end', { 
          sessionId, 
          agentId, 
          task: normalizedTask, 
          taskType: requestInfo.taskType, 
          durationMs: entry?.durationMs ?? elapsed, 
          success: taskSucceeded, 
          statusCode: requestInfo.statusCode, 
          error: taskErrorMessage, 
        });
      }
    }
  }

  initializeTaskRouter() {
    for (const profile of AGENT_PROFILES) {
      this.taskRouter.registerAgent(profile.agentId, profile.capabilities, {
        examples: profile.examples,
      });
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

    // Use semantic routing via TaskRouter
    const routing = this.taskRouter.route(task, options);
    return routing.agentId;
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

registerScoped(
  AgentOrchestrator,
  (scopedContainer) =>
    new AgentOrchestrator({
      memory: scopedContainer.isRegistered(DI_TOKENS.memoryManager, true)
        ? scopedContainer.resolve(DI_TOKENS.memoryManager)
        : scopedContainer.resolve(MemoryManager),
      registry: scopedContainer.isRegistered(DI_TOKENS.agentRegistry, true)
        ? scopedContainer.resolve(DI_TOKENS.agentRegistry)
        : scopedContainer.resolve(AgentRegistry),
      ai: scopedContainer.isRegistered(DI_TOKENS.aiMetaLayer, true)
        ? scopedContainer.resolve(DI_TOKENS.aiMetaLayer)
        : scopedContainer.resolve(AIMetaLayer),
      telemetry: scopedContainer.isRegistered(DI_TOKENS.telemetryService, true)
        ? scopedContainer.resolve(DI_TOKENS.telemetryService)
        : scopedContainer.resolve(EnterpriseAnalytics),
      sessionId: scopedContainer.isRegistered(DI_TOKENS.sessionId, true)
        ? scopedContainer.resolve(DI_TOKENS.sessionId)
        : null,
    })
);
registerAlias(DI_TOKENS.executionEngine, AgentOrchestrator);

export const agentOrchestrator = resolveFromContainer(AgentOrchestrator);
export const nexus = agentOrchestrator;
export { DistributedCoordinator };
export default agentOrchestrator;
