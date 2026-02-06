// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Swarm Coordination System v3.0
 * Main entry point for agent orchestration.
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';
import {
  AgentMessage,
  HandoffPayload,
  ExecutionTrace,
  AgentSchemas,
  createMessage,
  createHandover,
} from './protocol.js';
import {
  TIERS,
  AGENTS,
  TIER_FLOW,
  getAgent,
  getAgentsByTier,
  getTier,
  findParallelGroups,
  validatePipeline,
} from './tiers.js';

// Re-export from protocol for convenience
export { AgentMessage, HandoffPayload, ExecutionTrace, AgentSchemas };
export { createMessage, createHandover };

// Re-export from tiers
export { TIERS, AGENTS, TIER_FLOW, getAgent, getAgentsByTier, getTier };

// ============================================================================
// SWARM COORDINATOR CLASS
// ============================================================================

/**
 * Main coordinator class for managing agent swarms.
 */
export class SwarmCoordinator {
  constructor(provider, options = {}) {
    this.provider = provider;
    this.agents = new Map();
    this.history = [];
    this.traces = new Map();
    this.currentTrace = null;
    this.isRunning = false;
    this.options = {
      verbose: options.verbose || false,
      saveArtifacts: options.saveArtifacts !== false,
      artifactDir: options.artifactDir || '.ultra-dex/swarm',
      maxRetries: options.maxRetries || 3,
      enableRollback: options.enableRollback !== false,
    };

    // Register default agents from tiers
    this._registerDefaultAgents();
  }

  /**
   * Register default agents from the tier system.
   */
  _registerDefaultAgents() {
    for (const [name, config] of Object.entries(AGENTS)) {
      this.agents.set(name, {
        ...config,
        handler: null, // Will be set when agent is loaded
      });
    }
  }

  // ==========================================================================
  // AGENT MANAGEMENT
  // ==========================================================================

  /**
   * Add or update an agent in the swarm.
   */
  addAgent(name, config) {
    if (!name) throw new ValidationError('Agent name is required');
    const normalized = name.toLowerCase().replace('@', '');
    const existing = this.agents.get(normalized) || {};

    this.agents.set(normalized, {
      ...existing,
      ...config,
      name: config.name || existing.name || normalized,
    });

    if (this.options.verbose) {
      logger.debug(`[Swarm] Registered agent: ${normalized}`);
    }

    return this;
  }

  /**
   * Get an agent by name.
   */
  getAgent(name) {
    if (!name) return null;
    const normalized = name.toLowerCase().replace('@', '');
    return this.agents.get(normalized) || null;
  }

  /**
   * List all registered agents.
   */
  listAgents() {
    return Array.from(this.agents.entries()).map(([name, config]) => ({
      name,
      ...config,
    }));
  }

  /**
   * Check if an agent is registered.
   */
  hasAgent(name) {
    if (!name) return false;
    const normalized = name.toLowerCase().replace('@', '');
    return this.agents.has(normalized);
  }

  // ==========================================================================
  // PIPELINE EXECUTION
  // ==========================================================================

  /**
   * Run a pipeline of agent tasks.
   * @param {Object} options - Pipeline configuration
   * @param {string} options.goal - The goal of the pipeline
   * @param {Array} options.steps - Array of step objects { agent, task, context? }
   * @param {boolean} options.parallel - Enable parallel execution where possible
   */
  async runPipeline(options) {
    if (this.isRunning) {
      throw new AppError('A pipeline is already running in this coordinator', {
        code: 'SWARM_ALREADY_RUNNING',
      });
    }

    if (!options || typeof options !== 'object') {
      throw new ValidationError('Pipeline options are required');
    }

    const { goal, steps, parallel = false } = options;

    if (!goal || typeof goal !== 'string') {
      throw new ValidationError('Pipeline goal is required');
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new ValidationError('Pipeline steps must be a non-empty array');
    }

    this.isRunning = true;

    // Create execution trace
    const trace = new ExecutionTrace(null, goal);
    this.currentTrace = trace;
    this.traces.set(trace.taskId, trace);

    // Add steps to trace
    steps.forEach((step, index) => {
      trace.addStep(index + 1, step.agent, step.task, step.dependencies || []);
    });

    // Validate pipeline
    const validation = validatePipeline(steps);
    if (!validation.valid) {
      logger.error('Pipeline validation failed');
      validation.errors.forEach((err) => {
        logger.warn(`   Step ${err.step} (${err.agent}): ${err.error}`);
      });
      trace.status = 'failed';
      this.isRunning = false;
      return trace;
    }

    // Start execution
    trace.start();
    const spinner = ora(`🐝 Swarm: Executing pipeline for "${goal}"`).start();

    try {
      if (parallel) {
        await this._executeParallel(steps, trace, spinner);
      } else {
        await this._executeSequential(steps, trace, spinner);
      }

      trace.complete(true);
      spinner.succeed(chalk.green(`Pipeline completed: ${goal}`));
    } catch (error) {
      trace.complete(false);
      spinner.fail(chalk.red(`Pipeline failed: ${error.message}`));

      if (this.options.enableRollback) {
        await this._attemptRollback(trace);
      }
    } finally {
      this.isRunning = false;
    }

    // Save trace
    await this._saveTrace(trace);
    this.history.push(trace);

    return trace;
  }

  /**
   * Execute steps sequentially.
   */
  async _executeSequential(steps, trace, spinner) {
    let previousResult = null;

    for (const [index, step] of steps.entries()) {
      const stepNum = index + 1;
      spinner.text = `Step ${stepNum}/${steps.length}: [${step.agent}] ${step.task}`;
      trace.startStep(stepNum);

      try {
        // Create checkpoint before execution
        if (this.options.enableRollback) {
          trace.createCheckpoint(`before-step-${stepNum}`, { previousResult });
        }

        // Execute step with timeout protection
        const result = await this._executeStepWithTimeout(step, previousResult, trace);
        trace.recordResult(step.agent, result, true);
        previousResult = result;

        // Create handoff for next step
        if (stepNum < steps.length) {
          const nextStep = steps[stepNum];
          const handoff = new HandoffPayload(step.agent, nextStep.agent, {
            summary: `Completed: ${step.task}`,
            artifacts: result.artifacts || [],
            nextTask: nextStep.task,
          });
          this.history.push(handoff.toMessage());
        }
      } catch (error) {
        trace.recordResult(step.agent, error.message, false);
        throw error;
      }
    }
  }

  /**
   * Execute steps in parallel where possible.
   */
  async _executeParallel(steps, trace, spinner) {
    const agents = steps.map((s) => s.agent);
    const groups = findParallelGroups(agents);

    let groupNum = 0;
    let previousResults = {};

    for (const group of groups) {
      groupNum++;
      spinner.text = `Group ${groupNum}/${groups.length}: Running ${group.join(', ')} in parallel`;

      // Create checkpoint before group
      if (this.options.enableRollback) {
        trace.createCheckpoint(`before-group-${groupNum}`, { previousResults });
      }

      // Find steps for this group
      const groupSteps = steps.filter((s) =>
        group.includes(s.agent.toLowerCase().replace('@', ''))
      );

      // Execute in parallel
      const promises = groupSteps.map(async (step) => {
        const stepNum = steps.indexOf(step) + 1;
        trace.startStep(stepNum);

        try {
          const result = await this._executeStepWithTimeout(step, previousResults, trace);
          trace.recordResult(step.agent, result, true);
          return { agent: step.agent, result, success: true };
        } catch (error) {
          trace.recordResult(step.agent, error.message, false);
          return { agent: step.agent, error, success: false };
        }
      });

      const results = await Promise.all(promises);

      // Check for failures
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        const failedAgents = failures.map((f) => f.agent).join(', ');
        throw new AppError(`Parallel execution failed for: ${failedAgents}`, {
          code: 'SWARM_PARALLEL_FAIL',
        });
      }

      // Update previous results
      for (const { agent, result } of results) {
        previousResults[agent] = result;
      }

      // Track parallel execution count
      if (group.length > 1) {
        trace.metadata.parallelExecutions++;
      }
    }
  }

  /**
   * Execute a single step with timeout protection.
   */
  async _executeStepWithTimeout(step, context, trace, timeoutMs = 120000) {
    // 2 minute default timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await Promise.race([
        this._executeStep(step, context, trace),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Step timeout after ${timeoutMs}ms`)), timeoutMs);
        }),
      ]);

      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new AppError(
          `Step execution timed out: ${step.agent} - ${step.task.substring(0, 50)}...`,
          { code: 'SWARM_STEP_TIMEOUT' }
        );
      }
      throw error;
    }
  }

  /**
   * Execute a single step.
   */
  async _executeStep(step, context, trace) {
    const agent = this.getAgent(step.agent);
    if (!agent) {
      throw new ValidationError(`Unknown agent: ${step.agent}`);
    }

    // If agent has a handler, use it
    if (agent.handler) {
      return await agent.handler(step.task, context, trace);
    }

    // Otherwise, use provider to generate response
    const systemPrompt = this._buildSystemPrompt(agent);
    const userPrompt = this._buildUserPrompt(step, context);

    const result = await this.provider.generate(systemPrompt, userPrompt);

    // Parse result
    return {
      output: result.content,
      artifacts: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build system prompt for an agent.
   */
  _buildSystemPrompt(agent) {
    return `You are the ${agent.name} agent in the Ultra-Dex swarm.
Role: ${agent.role}
Capabilities: ${agent.capabilities?.join(', ') || 'General'}

Respond with actionable output. Be concise and specific.
If creating files, list them clearly.
If making decisions, explain the reasoning briefly.`;
  }

  /**
   * Build user prompt for a step.
   */
  _buildUserPrompt(step, context) {
    let prompt = `Task: ${step.task}`;

    if (context && typeof context === 'object') {
      const contextStr = Object.entries(context)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');
      prompt += `\n\nContext from previous steps:\n${contextStr}`;
    }

    return prompt;
  }

  // ==========================================================================
  // ROLLBACK SUPPORT
  // ==========================================================================

  /**
   * Attempt rollback on failure.
   */
  async _attemptRollback(trace) {
    const checkpoint = trace.getLastCheckpoint();
    if (!checkpoint) {
      logger.warn('No checkpoint available for rollback');
      return;
    }

    logger.info(`Rolling back to checkpoint: ${checkpoint.name}`);

    try {
      const state = trace.rollbackTo(checkpoint.id);
      logger.success(`Rollback successful`);
      return state;
    } catch (error) {
      logger.error(`Rollback failed`, error);
    }
  }

  /**
   * Manual rollback to a specific checkpoint.
   */
  rollback(taskId, checkpointId) {
    const trace = this.traces.get(taskId);
    if (!trace) {
      throw new AppError(`No trace found for task: ${taskId}`, { code: 'SWARM_TRACE_NOT_FOUND' });
    }

    return trace.rollbackTo(checkpointId);
  }

  // ==========================================================================
  // HISTORY & PERSISTENCE
  // ==========================================================================

  /**
   * Get execution history.
   */
  getHistory() {
    return this.history;
  }

  /**
   * Get a specific trace by task ID.
   */
  getTrace(taskId) {
    return this.traces.get(taskId) || null;
  }

  /**
   * Get all traces.
   */
  getAllTraces() {
    return Array.from(this.traces.values());
  }

  /**
   * Save trace to disk.
   */
  async _saveTrace(trace) {
    if (!this.options.saveArtifacts) return;

    try {
      await fs.mkdir(this.options.artifactDir, { recursive: true });
      const filename = `${this.options.artifactDir}/trace-${trace.taskId}.json`;
      await fs.writeFile(filename, JSON.stringify(trace.toJSON(), null, 2));

      if (this.options.verbose) {
        logger.debug(`Trace saved to ${filename}`);
      }
    } catch (error) {
      if (this.options.verbose) {
        logger.warn(`Failed to save trace: ${error.message}`);
      }
    }
  }

  /**
   * Load trace from disk.
   */
  async loadTrace(taskId) {
    if (!taskId) throw new ValidationError('taskId is required');
    const filename = `${this.options.artifactDir}/trace-${taskId}.json`;

    try {
      const content = await fs.readFile(filename, 'utf-8');
      const data = JSON.parse(content);
      const trace = ExecutionTrace.fromJSON(data);
      this.traces.set(taskId, trace);
      return trace;
    } catch (error) {
      throw new AppError(`Failed to load trace: ${error.message}`, { cause: error });
    }
  }

  /**
   * Clear history.
   */
  clearHistory() {
    this.history = [];
    this.traces.clear();
    this.currentTrace = null;
  }

  // ==========================================================================
  // CONVENIENCE METHODS
  // ==========================================================================

  /**
   * Plan a feature using the planner agent.
   */
  async plan(feature) {
    if (!feature || typeof feature !== 'string' || feature.trim().length === 0) {
      throw new ValidationError('Feature parameter is required and must be a non-empty string');
    }

    const spinner = ora('🧠 Planning feature implementation...').start();

    const plannerPrompt = `
You are the Hive Mind Planner.
Break down the feature "${feature}" into sequential atomic tasks for other agents.

Available Agents:
${Object.entries(AGENTS)
  .filter(([, a]) => a.tier > 0)
  .map(([name, a]) => `- @${name} (${a.role})`)
  .join('\n')}

Output STRICT JSON format only:
{
  "tasks": [
    {
      "id": 1,
      "agent": "agentname",
      "task": "Description of the task",
      "context": "Additional context",
      "dependencies": []
    }
  ]
}`;

    try {
      const result = await this.provider.generate(plannerPrompt, `Feature: ${feature}`);

      let jsonStr = result.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      let plan;
      try {
        plan = JSON.parse(jsonStr);
      } catch (parseError) {
        throw new AppError(`Failed to parse planner response as JSON: ${parseError.message}`, {
          cause: parseError,
        });
      }

      if (!Array.isArray(plan.tasks)) {
        throw new AppError('Invalid plan format: missing tasks array');
      }

      spinner.succeed(`Plan generated: ${plan.tasks.length} tasks identified.`);
      return plan.tasks;
    } catch (error) {
      spinner.fail('Planning failed.');
      logger.error('Swarm planning failed', error);
      throw error; // Re-throw to allow caller to handle appropriately
    }
  }

  /**
   * Execute a pre-planned set of tasks.
   */
  async execute(tasks) {
    if (!Array.isArray(tasks)) throw new ValidationError('tasks must be an array');
    return this.runPipeline({
      goal: 'Execute planned tasks',
      steps: tasks.map((t) => ({
        agent: t.agent,
        task: t.task,
        context: t.context,
        dependencies: t.dependencies,
      })),
      parallel: false,
    });
  }

  /**
   * Run a single agent task.
   */
  async runAgent(agent, task, context = {}, options = {}) {
    if (!agent) throw new ValidationError('agent is required');
    if (!task) throw new ValidationError('task is required');
    return this.runPipeline({
      goal: task,
      steps: [{ agent, task, context }],
      parallel: false,
      ...options,
    });
  }

  /**
   * Get suggested agents for a task description.
   */
  suggestAgents(taskDescription) {
    if (!taskDescription || typeof taskDescription !== 'string') {
      return [];
    }

    const keywords = {
      backend: [
        'api',
        'endpoint',
        'server',
        'route',
        'controller',
        'service',
        'rest',
        'graphql',
        'middleware',
      ],
      frontend: [
        'ui',
        'component',
        'page',
        'button',
        'form',
        'css',
        'react',
        'vue',
        'angular',
        'html',
        'javascript',
        'typescript',
      ],
      database: [
        'schema',
        'table',
        'migration',
        'query',
        'sql',
        'model',
        'orm',
        'prisma',
        'sequelize',
        'mongodb',
      ],
      auth: [
        'login',
        'authentication',
        'authorization',
        'password',
        'session',
        'jwt',
        'oauth',
        'sso',
        'permissions',
      ],
      security: [
        'vulnerability',
        'audit',
        'secure',
        'encryption',
        'xss',
        'csrf',
        'cors',
        'ssl',
        'tls',
        'penetration',
      ],
      testing: [
        'test',
        'spec',
        'coverage',
        'jest',
        'mocha',
        'cypress',
        'playwright',
        'e2e',
        'unit',
        'integration',
      ],
      devops: [
        'deploy',
        'ci',
        'cd',
        'docker',
        'kubernetes',
        'aws',
        'pipeline',
        'jenkins',
        'github actions',
        'terraform',
      ],
      performance: [
        'slow',
        'optimize',
        'cache',
        'speed',
        'latency',
        'memory',
        'profiling',
        'monitoring',
        'scalability',
      ],
      debugger: [
        'bug',
        'fix',
        'error',
        'crash',
        'issue',
        'debug',
        'stack trace',
        'exception',
        'logging',
      ],
      documentation: [
        'docs',
        'readme',
        'guide',
        'api docs',
        'comment',
        'tutorial',
        'manual',
        'specification',
      ],
      refactoring: [
        'refactor',
        'clean',
        'reorganize',
        'pattern',
        'simplify',
        'modularize',
        'deprecate',
        'upgrade',
      ],
      planner: [
        'plan',
        'break down',
        'tasks',
        'sprint',
        'estimate',
        'timeline',
        'milestone',
        'roadmap',
      ],
      cto: [
        'architecture',
        'tech stack',
        'design',
        'decision',
        'strategy',
        'infrastructure',
        'scaling',
      ],
      research: [
        'compare',
        'evaluate',
        'research',
        'options',
        'alternatives',
        'analysis',
        'study',
        'investigation',
      ],
      reviewer: [
        'review',
        'approve',
        'check',
        'quality',
        'code review',
        'approval',
        'verification',
        'validation',
      ],
    };

    const lower = taskDescription.toLowerCase();
    const matches = [];

    for (const [agent, words] of Object.entries(keywords)) {
      // Count matches with weighted scoring
      let score = 0;
      for (const word of words) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi'); // Word boundary matching
        const matches = lower.match(regex);
        if (matches) {
          score += matches.length; // Add count of matches
        }
      }

      if (score > 0) {
        matches.push({ agent, score });
      }
    }

    return matches.sort((a, b) => b.score - a.score).map((m) => m.agent);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new SwarmCoordinator instance.
 */
export function createSwarm(provider, options = {}) {
  return new SwarmCoordinator(provider, options);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  SwarmCoordinator,
  createSwarm,
  AgentMessage,
  HandoffPayload,
  ExecutionTrace,
  AgentSchemas,
  TIERS,
  AGENTS,
  TIER_FLOW,
};
