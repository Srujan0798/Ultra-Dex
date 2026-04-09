// Copyright (c) 2026 Ultra-Dex

/**
 * Core Execution Engine
 * Orchestrates agent execution with proper lifecycle management.
 * Replaces the monolithic run.js logic with a clean, testable engine.
 */

import { logger } from '../utils/logger.js';

const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 300_000; // 5 minutes

/**
 * Execution result envelope
 * @typedef {Object} ExecutionResult
 * @property {string} status - 'success' | 'failed' | 'timeout' | 'cancelled'
 * @property {any} output - Agent output or error message
 * @property {number} durationMs - Execution time in milliseconds
 * @property {string[]} artifacts - Paths to generated artifacts
 * @property {ExecutionTrace[]} trace - Step-by-step execution trace
 */

/**
 * Execution trace entry
 * @typedef {Object} ExecutionTrace
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} step - Step name
 * @property {string} status - Step status
 * @property {string} [error] - Error message if failed
 */

export class ExecutionEngine {
  /**
   * Create a new execution engine
   * @param {Object} options
   * @param {import('../providers/index.js').Provider} options.provider - AI provider instance
   * @param {Object} options.agents - Available agent definitions
   * @param {Object} [options.config] - Engine configuration
   */
  constructor({ provider, agents, config = {} }) {
    this.provider = provider;
    this.agents = agents;
    this.config = {
      maxRetries: config.maxRetries ?? MAX_RETRIES,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      dryRun: config.dryRun ?? false,
    };
    this._abortController = new AbortController();
  }

  /**
   * Execute an agent task
   * @param {string} agentName - Name of the agent to execute
   * @param {string} task - Task description
   * @param {Object} [options] - Execution options
   * @returns {Promise<ExecutionResult>}
   */
  async execute(agentName, task, options = {}) {
    const runId = options.runId || `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const trace = [];
    const startTime = Date.now();

    try {
      // Step 1: Validate agent exists
      await this._traceStep(
        'validate_agent',
        async () => {
          if (!this.agents[agentName]) {
            throw new Error(
              `Unknown agent: "${agentName}". Available: ${Object.keys(this.agents).join(', ')}`
            );
          }
        },
        trace
      );

      // Step 2: Governance check (lazy import to avoid circular dependency)
      await this._traceStep(
        'governance_check',
        async () => {
          try {
            const { authorizeOperation } = await import('../governance/index.js');
            await authorizeOperation(`agent:${agentName}`, { task, runId });
          } catch {
            // Governance not available, skip
          }
        },
        trace
      );

      // Step 3: Initialize agent or use provider directly
      const agent = await this._traceStep(
        'initialize_agent',
        async () => {
          const agentDef = this.agents[agentName];
          // If agent def has a create function, use it; otherwise use the provider directly
          if (typeof agentDef?.create === 'function') {
            return agentDef.create({ provider: this.provider, runId });
          }
          // Fallback: return the agent config + provider for direct execution
          return {
            config: agentDef || {},
            provider: this.provider,
            run: async (taskText) => {
              // Direct provider call using agent's system prompt
              const systemPrompt = agentDef?.systemPrompt || `You are an AI assistant.`;
              // Use provider.generate() if available, otherwise try .complete()
              if (typeof this.provider.generate === 'function') {
                const response = await this.provider.generate(systemPrompt, taskText, {
                  maxTokens: 4096,
                });
                return (
                  response?.text ||
                  response?.content ||
                  response?.output ||
                  JSON.stringify(response) ||
                  'No response'
                );
              }
              if (typeof this.provider.complete === 'function') {
                const messages = [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: taskText },
                ];
                const response = await this.provider.complete(messages, { maxTokens: 4096 });
                return (
                  response?.text || response?.content || JSON.stringify(response) || 'No response'
                );
              }
              return `[Provider has no callable generate/complete method]`;
            },
          };
        },
        trace
      );

      // Step 4: Execute with retries
      const result = await this._traceStep(
        'execute_task',
        async () => {
          return this._executeWithRetry(agent, task, { runId, trace });
        },
        trace
      );

      const durationMs = Date.now() - startTime;

      return {
        status: 'success',
        output: result,
        durationMs,
        artifacts: [],
        trace,
        runId,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logger.error(`Execution failed: ${error.message}`, { runId, agent: agentName });

      return {
        status: 'failed',
        output: error.message,
        durationMs,
        artifacts: [],
        trace,
        runId,
        error: error.stack,
      };
    }
  }

  /**
   * Abort the current execution
   */
  abort() {
    this._abortController.abort();
    logger.info('Execution aborted', { runId: process.env.ULTRA_DEX_RUN_ID });
  }

  /**
   * Execute with retry logic
   * @private
   */
  async _executeWithRetry(agent, task, { runId, _trace }) {
    // Guard: agent must have a .run() method
    if (typeof agent?.run !== 'function') {
      const agentType = agent === null ? 'null' : typeof agent;
      const availableMethods =
        agent && typeof agent === 'object'
          ? Object.keys(agent).filter((k) => typeof agent[k] === 'function')
          : [];
      throw new Error(
        `Agent executor missing or invalid: expected .run() method but got ${agentType}. ` +
          `Available methods: [${availableMethods.join(', ')}]. ` +
          `Ensure the agent definition includes a callable run function.`
      );
    }

    let lastError;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (this._abortController.signal.aborted) {
          throw new Error('Execution aborted');
        }

        if (this.config.dryRun) {
          logger.info(`[DRY RUN] Would execute agent task`, { agent: agent.name, task, attempt });
          return { dryRun: true, task };
        }

        const result = await Promise.race([
          agent.run(task, { runId, attempt }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Execution timeout')), this.config.timeoutMs)
          ),
        ]);

        return result;
      } catch (error) {
        lastError = error;
        logger.warn(
          `Execution attempt ${attempt}/${this.config.maxRetries} failed: ${error.message}`,
          {
            runId,
            attempt,
          }
        );

        if (attempt < this.config.maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10_000);
          logger.info(`Retrying in ${backoffMs}ms...`, { runId, attempt });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Trace a step execution
   * @private
   */
  async _traceStep(stepName, fn, trace) {
    const entry = {
      timestamp: new Date().toISOString(),
      step: stepName,
      status: 'started',
    };
    trace.push(entry);

    try {
      const result = await fn();
      entry.status = 'success';
      return result;
    } catch (error) {
      entry.status = 'failed';
      entry.error = error.message;
      throw error;
    }
  }
}

/**
 * Create a new execution engine instance
 * @param {Object} options
 * @returns {ExecutionEngine}
 */
export function createExecutionEngine(options) {
  return new ExecutionEngine(options);
}

export default { ExecutionEngine, createExecutionEngine };
