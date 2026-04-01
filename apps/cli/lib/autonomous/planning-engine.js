// Copyright (c) 2026 Ultra-Dex
// Planning Engine - AI-powered goal decomposition for autonomous loops

import { EventEmitter } from 'events';
import { createProvider } from '../providers/index.js';

/**
 * @typedef {Object} PlanTask
 * @property {string} id - Unique task identifier
 * @property {string} description - Human-readable task description
 * @property {string[]} dependencies - Array of task IDs this task depends on
 * @property {number} priority - Priority score (1-10, higher = more urgent)
 * @property {string} complexity - Complexity level: 'low' | 'medium' | 'high' | 'critical'
 * @property {string} [assignedLane] - Suggested execution lane
 * @property {Object} [metadata] - Additional task metadata
 */

/**
 * @typedef {Object} Plan
 * @property {string} id - Unique plan identifier
 * @property {string} goal - Original goal description
 * @property {PlanTask[]} tasks - Decomposed tasks
 * @property {Date} createdAt - Plan creation timestamp
 * @property {Object} metadata - Plan metadata (model, tokens, etc.)
 */

/**
 * PlanningEngine - AI-powered planning for autonomous agent loops
 *
 * Accepts a goal description and uses AI providers to decompose it into
 * structured, executable tasks with dependencies and priorities.
 *
 * @extends EventEmitter
 * @example
 * const engine = new PlanningEngine({ provider: 'claude' });
 * const plan = await engine.generatePlan('Refactor authentication module');
 */
export class PlanningEngine extends EventEmitter {
  /**
   * Create a new PlanningEngine
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.provider='claude'] - AI provider to use
   * @param {string} [options.model] - Specific model override
   * @param {number} [options.maxRetries=3] - Maximum retry attempts
   * @param {number} [options.baseDelay=1000] - Base delay for exponential backoff (ms)
   * @param {number} [options.maxTasks=20] - Maximum tasks per plan
   * @param {Object} [options.providerInstance] - Pre-initialized provider instance
   */
  constructor(options = {}) {
    super();
    this.options = {
      provider: options.provider || 'claude',
      model: options.model,
      maxRetries: options.maxRetries ?? 3,
      baseDelay: options.baseDelay ?? 1000,
      maxTasks: options.maxTasks ?? 20,
      providerInstance: options.providerInstance,
      ...options,
    };

    this.metrics = {
      plansGenerated: 0,
      totalTasks: 0,
      avgTasksPerPlan: 0,
      failures: 0,
      retries: 0,
    };

    this._provider = null;
  }

  /**
   * Initialize the AI provider (lazy loading)
   * @private
   * @returns {Promise<Object>} Provider instance
   */
  async _getProvider() {
    // Use custom provider instance if provided
    if (this.options.providerInstance) {
      this._provider = this.options.providerInstance;
      return this._provider;
    }

    if (!this._provider) {
      try {
        this._provider = await createProvider(this.options.provider);
        this.emit('provider:initialized', { provider: this.options.provider });
      } catch (error) {
        this.emit('provider:error', { error: error.message });
        throw new Error(`Failed to initialize provider: ${error.message}`);
      }
    }
    return this._provider;
  }

  /**
   * Initialize the AI provider (lazy loading)
   * @private
   * @returns {Promise<Object>} Provider instance
   */
  async _getProvider() {
    if (!this._provider) {
      // Use custom provider instance if provided
      if (this.options.providerInstance) {
        this._provider = this.options.providerInstance;
        return this._provider;
      }

      try {
        this._provider = await createProvider(this.options.provider);
        this.emit('provider:initialized', { provider: this.options.provider });
      } catch (error) {
        this.emit('provider:error', { error: error.message });
        throw new Error(`Failed to initialize provider: ${error.message}`);
      }
    }
    return this._provider;
  }

  /**
   * Generate a unique plan ID
   * @private
   * @returns {string} UUID-like identifier
   */
  _generatePlanId() {
    return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Sanitize ID to prevent path traversal attacks
   * @private
   * @param {string} inputId - Raw ID from AI response
   * @returns {string} Sanitized ID
   * @throws {Error} If ID is empty after sanitization
   */
  _sanitizeId(inputId) {
    if (!inputId || typeof inputId !== 'string') {
      throw new Error('Invalid ID: must be a non-empty string');
    }

    // Strip path traversal patterns
    let sanitized = inputId
      .replace(/\./g, '_') // Replace dots
      .replace(/[/\\]/g, '_') // Replace path separators
      .replace(/[<>:"|?*]/g, '_') // Replace unsafe filename chars
      .replace(/\s+/g, '_') // Replace whitespace
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores

    // Limit length
    sanitized = sanitized.substring(0, 64);

    // Throw if empty after sanitization
    if (!sanitized) {
      throw new Error(`ID becomes empty after sanitization: "${inputId}"`);
    }

    return sanitized;
  }

  /**
   * Generate a unique task ID
   * @private
   * @param {number} index - Task index
   * @returns {string} Task identifier
   */
  _generateTaskId(index) {
    return `task_${index + 1}_${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * Build the planning prompt for the AI
   * @private
   * @param {string} goal - Goal description
   * @param {Object} [context={}] - Additional context
   * @returns {string} Formatted prompt
   */
  _buildPlanningPrompt(goal, context = {}) {
    const contextStr = context.projectType ? `\nProject Type: ${context.projectType}` : '';
    const constraintsStr = context.constraints?.length
      ? `\nConstraints: ${context.constraints.join(', ')}`
      : '';
    const existingFilesStr = context.existingFiles?.length
      ? `\nExisting Files: ${context.existingFiles.slice(0, 10).join(', ')}`
      : '';

    return `You are an expert software architect and project planner. Decompose the following goal into atomic, executable tasks.

GOAL: ${goal}
${contextStr}${constraintsStr}${existingFilesStr}

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown):
{
  "tasks": [
    {
      "description": "Clear, actionable task description",
      "dependencies": [],
      "priority": 8,
      "complexity": "medium",
      "assignedLane": "gemini",
      "rationale": "Why this task is needed"
    }
  ],
  "summary": "Brief plan summary",
  "estimatedEffort": "low|medium|high",
  "risks": ["potential risk 1"]
}

RULES:
1. Each task must be atomic (completable in one session)
2. Dependencies reference task indices (0-based)
3. Priority: 1-10 (10 = critical/blocking)
4. Complexity: low, medium, high, critical
5. Lane suggestions: claude (complex), codex (implementation), gemini (utilities), qwen (repetitive)
6. Maximum ${this.options.maxTasks} tasks
7. Order tasks logically (dependencies come first)`;
  }

  /**
   * Parse AI response into structured plan
   * @private
   * @param {string} response - Raw AI response
   * @param {string} goal - Original goal
   * @returns {Plan} Parsed plan object
   */
  _parseResponse(response, goal) {
    // Clean response - remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Try to extract JSON from response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse planning response as JSON');
      }
    }

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Invalid plan format: missing tasks array');
    }

    // Transform tasks with IDs
    const tasks = parsed.tasks.slice(0, this.options.maxTasks).map((task, index) => ({
      id: this._generateTaskId(index),
      description: task.description || `Task ${index + 1}`,
      dependencies: (task.dependencies || []).map((depIdx) =>
        typeof depIdx === 'number' ? this._generateTaskId(depIdx) : this._sanitizeId(depIdx)
      ),
      priority: Math.min(10, Math.max(1, task.priority || 5)),
      complexity: ['low', 'medium', 'high', 'critical'].includes(task.complexity)
        ? task.complexity
        : 'medium',
      assignedLane: task.assignedLane || 'gemini',
      metadata: {
        rationale: task.rationale,
        originalIndex: index,
      },
    }));

    // Fix task ID references in dependencies (convert indices to actual IDs)
    const taskIds = tasks.map((t) => t.id);
    tasks.forEach((task) => {
      task.dependencies = task.dependencies.filter((depId) => taskIds.includes(depId));
    });

    return {
      id: this._generatePlanId(),
      goal,
      tasks,
      createdAt: new Date(),
      metadata: {
        summary: parsed.summary || '',
        estimatedEffort: parsed.estimatedEffort || 'medium',
        risks: parsed.risks || [],
        model: this.options.model || this.options.provider,
        taskCount: tasks.length,
      },
    };
  }

  /**
   * Sleep for exponential backoff
   * @private
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {Promise<void>}
   */
  async _backoff(attempt) {
    const delay = this.options.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * delay;
    await new Promise((resolve) => setTimeout(resolve, delay + jitter));
  }

  /**
   * Generate a structured plan from a goal description
   *
   * @param {string} goal - Goal to decompose into tasks
   * @param {Object} [context={}] - Additional context for planning
   * @param {string} [context.projectType] - Type of project
   * @param {string[]} [context.constraints] - Constraints to consider
   * @param {string[]} [context.existingFiles] - Existing files in project
   * @returns {Promise<Plan>} Generated plan with tasks
   * @throws {Error} If planning fails after all retries
   *
   * @example
   * const plan = await engine.generatePlan('Add user authentication', {
   *   projectType: 'Node.js API',
   *   constraints: ['Use JWT', 'No external auth providers']
   * });
   */
  async generatePlan(goal, context = {}) {
    if (!goal || typeof goal !== 'string') {
      throw new Error('Goal must be a non-empty string');
    }

    this.emit('planning:start', { goal, context });

    const prompt = this._buildPlanningPrompt(goal, context);
    let lastError = null;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.metrics.retries++;
          this.emit('planning:retry', { attempt, goal });
          await this._backoff(attempt - 1);
        }

        const provider = await this._getProvider();

        // Call provider with structured prompt
        const response = await provider.generate({
          systemPrompt: 'You are a precise planning assistant. Output only valid JSON.',
          userPrompt: prompt,
          options: {
            temperature: 0.3, // Lower temperature for structured output
            maxTokens: 2000,
          },
        });

        const content =
          typeof response === 'string'
            ? response
            : response?.content || response?.text || JSON.stringify(response);

        const plan = this._parseResponse(content, goal);

        // Update metrics
        this.metrics.plansGenerated++;
        this.metrics.totalTasks += plan.tasks.length;
        this.metrics.avgTasksPerPlan = this.metrics.totalTasks / this.metrics.plansGenerated;

        this.emit('planning:complete', { plan });
        return plan;
      } catch (error) {
        lastError = error;
        this.emit('planning:error', {
          attempt,
          error: error.message,
          willRetry: attempt < this.options.maxRetries,
        });
      }
    }

    this.metrics.failures++;
    throw new Error(
      `Planning failed after ${this.options.maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Validate an existing plan structure
   *
   * @param {Plan} plan - Plan to validate
   * @returns {{valid: boolean, errors: string[]}} Validation result
   */
  validatePlan(plan) {
    const errors = [];

    if (!plan?.id) errors.push('Missing plan ID');
    if (!plan?.goal) errors.push('Missing goal');
    if (!Array.isArray(plan?.tasks)) errors.push('Tasks must be an array');

    if (plan?.tasks) {
      const taskIds = new Set(plan.tasks.map((t) => t.id));

      plan.tasks.forEach((task, index) => {
        if (!task.id) errors.push(`Task ${index}: missing ID`);
        if (!task.description) errors.push(`Task ${index}: missing description`);

        // Check for invalid dependencies
        task.dependencies?.forEach((dep) => {
          if (!taskIds.has(dep)) {
            errors.push(`Task ${task.id}: invalid dependency "${dep}"`);
          }
        });
      });

      // Check for circular dependencies
      const visited = new Set();
      const recursionStack = new Set();

      const hasCycle = (taskId) => {
        if (recursionStack.has(taskId)) return true;
        if (visited.has(taskId)) return false;

        visited.add(taskId);
        recursionStack.add(taskId);

        const task = plan.tasks.find((t) => t.id === taskId);
        for (const dep of task?.dependencies || []) {
          if (hasCycle(dep)) return true;
        }

        recursionStack.delete(taskId);
        return false;
      };

      for (const task of plan.tasks) {
        if (hasCycle(task.id)) {
          errors.push(`Circular dependency detected involving task ${task.id}`);
          break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get current planning metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset metrics counters
   */
  resetMetrics() {
    this.metrics = {
      plansGenerated: 0,
      totalTasks: 0,
      avgTasksPerPlan: 0,
      failures: 0,
      retries: 0,
    };
  }
}

export default PlanningEngine;

