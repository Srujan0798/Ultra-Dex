/**
 * Ultra-Dex Swarm Coordination System v3.0
 * Main entry point for agent orchestration.
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { 
  AgentMessage, 
  HandoffPayload, 
  ExecutionTrace,
  AgentSchemas,
  createMessage,
  createHandover
} from './protocol.js';
import {
  TIERS,
  AGENTS,
  TIER_FLOW,
  getAgent,
  getAgentsByTier,
  getTier,
  getExecutionOrder,
  findParallelGroups,
  validatePipeline,
  getAgentDependencies
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
    this.options = {
      verbose: options.verbose || false,
      saveArtifacts: options.saveArtifacts !== false,
      artifactDir: options.artifactDir || '.ultra-dex/swarm',
      maxRetries: options.maxRetries || 3,
      enableRollback: options.enableRollback !== false
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
        handler: null // Will be set when agent is loaded
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
    const normalized = name.toLowerCase().replace('@', '');
    const existing = this.agents.get(normalized) || {};
    
    this.agents.set(normalized, {
      ...existing,
      ...config,
      name: config.name || existing.name || normalized
    });

    if (this.options.verbose) {
      console.log(chalk.gray(`[Swarm] Registered agent: ${normalized}`));
    }

    return this;
  }

  /**
   * Get an agent by name.
   */
  getAgent(name) {
    const normalized = name.toLowerCase().replace('@', '');
    return this.agents.get(normalized) || null;
  }

  /**
   * List all registered agents.
   */
  listAgents() {
    return Array.from(this.agents.entries()).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  /**
   * Check if an agent is registered.
   */
  hasAgent(name) {
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
    const { goal, steps, parallel = false } = options;
    
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
      console.log(chalk.red('\n❌ Pipeline validation failed:'));
      validation.errors.forEach(err => {
        console.log(chalk.red(`   Step ${err.step} (${err.agent}): ${err.error}`));
      });
      trace.status = 'failed';
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

    for (const step of steps) {
      const stepNum = steps.indexOf(step) + 1;
      spinner.text = `Step ${stepNum}/${steps.length}: [${step.agent}] ${step.task}`;
      trace.startStep(stepNum);

      try {
        // Create checkpoint before execution
        if (this.options.enableRollback) {
          trace.createCheckpoint(`before-step-${stepNum}`, { previousResult });
        }

        // Execute step
        const result = await this._executeStep(step, previousResult, trace);
        trace.recordResult(step.agent, result, true);
        previousResult = result;

        // Create handoff for next step
        if (stepNum < steps.length) {
          const nextStep = steps[stepNum];
          const handoff = new HandoffPayload(step.agent, nextStep.agent, {
            summary: `Completed: ${step.task}`,
            artifacts: result.artifacts || [],
            nextTask: nextStep.task
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
    const agents = steps.map(s => s.agent);
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
      const groupSteps = steps.filter(s => 
        group.includes(s.agent.toLowerCase().replace('@', ''))
      );

      // Execute in parallel
      const promises = groupSteps.map(async (step) => {
        const stepNum = steps.indexOf(step) + 1;
        trace.startStep(stepNum);

        try {
          const result = await this._executeStep(step, previousResults, trace);
          trace.recordResult(step.agent, result, true);
          return { agent: step.agent, result, success: true };
        } catch (error) {
          trace.recordResult(step.agent, error.message, false);
          return { agent: step.agent, error, success: false };
        }
      });

      const results = await Promise.all(promises);

      // Check for failures
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        const failedAgents = failures.map(f => f.agent).join(', ');
        throw new Error(`Parallel execution failed for: ${failedAgents}`);
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
   * Execute a single step.
   */
  async _executeStep(step, context, trace) {
    const agent = this.getAgent(step.agent);
    if (!agent) {
      throw new Error(`Unknown agent: ${step.agent}`);
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
      timestamp: new Date().toISOString()
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
      console.log(chalk.yellow('  No checkpoint available for rollback'));
      return;
    }

    console.log(chalk.yellow(`  Rolling back to checkpoint: ${checkpoint.name}`));
    
    try {
      const state = trace.rollbackTo(checkpoint.id);
      console.log(chalk.green(`  Rollback successful`));
      return state;
    } catch (error) {
      console.log(chalk.red(`  Rollback failed: ${error.message}`));
    }
  }

  /**
   * Manual rollback to a specific checkpoint.
   */
  rollback(taskId, checkpointId) {
    const trace = this.traces.get(taskId);
    if (!trace) {
      throw new Error(`No trace found for task: ${taskId}`);
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
        console.log(chalk.gray(`  Trace saved to ${filename}`));
      }
    } catch (error) {
      if (this.options.verbose) {
        console.log(chalk.yellow(`  Failed to save trace: ${error.message}`));
      }
    }
  }

  /**
   * Load trace from disk.
   */
  async loadTrace(taskId) {
    const filename = `${this.options.artifactDir}/trace-${taskId}.json`;
    
    try {
      const content = await fs.readFile(filename, 'utf-8');
      const data = JSON.parse(content);
      const trace = ExecutionTrace.fromJSON(data);
      this.traces.set(taskId, trace);
      return trace;
    } catch (error) {
      throw new Error(`Failed to load trace: ${error.message}`);
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
    const spinner = ora('🧠 Planning feature implementation...').start();

    const plannerPrompt = `
You are the Hive Mind Planner.
Break down the feature "${feature}" into sequential atomic tasks for other agents.

Available Agents:
${Object.entries(AGENTS)
  .filter(([_, a]) => a.tier > 0)
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

      const plan = JSON.parse(jsonStr);
      spinner.succeed(`Plan generated: ${plan.tasks.length} tasks identified.`);
      return plan.tasks;
    } catch (error) {
      spinner.fail('Planning failed.');
      console.error(chalk.red(error.message));
      return null;
    }
  }

  /**
   * Execute a pre-planned set of tasks.
   */
  async execute(tasks) {
    return this.runPipeline({
      goal: 'Execute planned tasks',
      steps: tasks.map(t => ({
        agent: t.agent,
        task: t.task,
        context: t.context,
        dependencies: t.dependencies
      })),
      parallel: false
    });
  }

  /**
   * Run a single agent task.
   */
  async runAgent(agent, task, context = {}) {
    return this.runPipeline({
      goal: task,
      steps: [{ agent, task, context }],
      parallel: false
    });
  }

  /**
   * Get suggested agents for a task description.
   */
  suggestAgents(taskDescription) {
    const keywords = {
      backend: ['api', 'endpoint', 'server', 'route', 'controller', 'service'],
      frontend: ['ui', 'component', 'page', 'button', 'form', 'css', 'react', 'vue'],
      database: ['schema', 'table', 'migration', 'query', 'sql', 'model'],
      auth: ['login', 'authentication', 'authorization', 'password', 'session', 'jwt'],
      security: ['vulnerability', 'audit', 'secure', 'encryption', 'xss', 'csrf'],
      testing: ['test', 'spec', 'coverage', 'jest', 'mocha', 'e2e'],
      devops: ['deploy', 'ci', 'cd', 'docker', 'kubernetes', 'aws', 'pipeline'],
      performance: ['slow', 'optimize', 'cache', 'speed', 'latency', 'memory'],
      debugger: ['bug', 'fix', 'error', 'crash', 'issue', 'debug'],
      documentation: ['docs', 'readme', 'guide', 'api docs', 'comment'],
      refactoring: ['refactor', 'clean', 'reorganize', 'pattern', 'simplify'],
      planner: ['plan', 'break down', 'tasks', 'sprint', 'estimate'],
      cto: ['architecture', 'tech stack', 'design', 'decision'],
      research: ['compare', 'evaluate', 'research', 'options', 'alternatives'],
      reviewer: ['review', 'approve', 'check', 'quality']
    };

    const lower = taskDescription.toLowerCase();
    const matches = [];

    for (const [agent, words] of Object.entries(keywords)) {
      const matchCount = words.filter(w => lower.includes(w)).length;
      if (matchCount > 0) {
        matches.push({ agent, score: matchCount });
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .map(m => m.agent);
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
  TIER_FLOW
};
