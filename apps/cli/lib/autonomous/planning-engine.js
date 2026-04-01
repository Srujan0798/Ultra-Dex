/**
 * Planning Engine
 * AI-powered goal decomposition into structured task plans
 * @module autonomous/planning-engine
 */

import { EventEmitter } from 'events';

/**
 * Planning Engine for autonomous task decomposition
 * @extends EventEmitter
 */
export class PlanningEngine extends EventEmitter {
  /**
   * @param {object} options - Engine options
   * @param {object} options.provider - AI provider instance
   * @param {number} options.maxRetries - Max retry attempts (default: 3)
   * @param {number} options.retryDelay - Base delay between retries in ms (default: 1000)
   */
  constructor(options = {}) {
    super();
    this.provider = options.provider || null;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.planHistory = [];
  }

  /**
   * Generate a structured plan from a goal description
   * @param {string} goal - Goal description
   * @param {object} context - Additional context
   * @returns {Promise<object>} Structured plan
   */
  async plan(goal, context = {}) {
    this.emit('plan:start', { goal, context });

    const prompt = this.buildPlanningPrompt(goal, context);
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callProvider(prompt);
        const plan = this.parsePlanResponse(response, goal);
        
        this.planHistory.push({
          goal,
          plan,
          timestamp: new Date().toISOString(),
          attempts: attempt
        });

        this.emit('plan:complete', plan);
        return plan;
      } catch (error) {
        lastError = error;
        this.emit('plan:retry', { attempt, error: error.message });
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    this.emit('plan:error', lastError);
    throw new Error(`Planning failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Build the planning prompt
   * @param {string} goal - Goal description
   * @param {object} context - Additional context
   * @returns {string} Formatted prompt
   */
  buildPlanningPrompt(goal, context) {
    const contextStr = context.history 
      ? `\n\nPrevious context:\n${JSON.stringify(context.history, null, 2)}`
      : '';
    
    return `You are a planning engine. Break down the following goal into atomic, executable tasks.

GOAL: ${goal}
${contextStr}

Return a JSON object with this structure:
{
  "tasks": [
    {
      "id": "task-1",
      "description": "Clear description of what to do",
      "dependencies": [],
      "priority": 1-10,
      "estimatedComplexity": "low|medium|high",
      "type": "code|research|test|doc|config"
    }
  ],
  "summary": "Brief plan summary",
  "estimatedDuration": "time estimate"
}

Rules:
- Tasks must be atomic (single action)
- Dependencies reference other task IDs
- Higher priority = more important (10 is highest)
- Order tasks logically

Return ONLY valid JSON.`;
  }

  /**
   * Call the AI provider
   * @param {string} prompt - Prompt to send
   * @returns {Promise<string>} Provider response
   */
  async callProvider(prompt) {
    if (!this.provider) {
      // Return mock response for testing without provider
      return JSON.stringify({
        tasks: [
          {
            id: 'task-1',
            description: 'Analyze requirements',
            dependencies: [],
            priority: 10,
            estimatedComplexity: 'low',
            type: 'research'
          },
          {
            id: 'task-2',
            description: 'Implement solution',
            dependencies: ['task-1'],
            priority: 8,
            estimatedComplexity: 'high',
            type: 'code'
          },
          {
            id: 'task-3',
            description: 'Write tests',
            dependencies: ['task-2'],
            priority: 7,
            estimatedComplexity: 'medium',
            type: 'test'
          }
        ],
        summary: 'Standard implementation workflow',
        estimatedDuration: '2-4 hours'
      });
    }

    // Real provider call
    if (typeof this.provider.complete === 'function') {
      return await this.provider.complete(prompt);
    } else if (typeof this.provider.chat === 'function') {
      const response = await this.provider.chat([{ role: 'user', content: prompt }]);
      return response.content || response.message?.content || JSON.stringify(response);
    } else if (typeof this.provider.generate === 'function') {
      return await this.provider.generate(prompt);
    }

    throw new Error('Provider does not have a compatible interface');
  }

  /**
   * Parse and validate plan response
   * @param {string} response - Raw response
   * @param {string} goal - Original goal
   * @returns {object} Validated plan
   */
  parsePlanResponse(response, goal) {
    let parsed;
    
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(response);
      }
    } catch (error) {
      throw new Error(`Failed to parse plan response: ${error.message}`);
    }

    // Validate required fields
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Plan must contain tasks array');
    }

    // Enrich with metadata
    return {
      id: `plan-${Date.now()}`,
      goal,
      tasks: parsed.tasks.map((task, index) => ({
        id: task.id || `task-${index + 1}`,
        description: task.description || 'No description',
        dependencies: task.dependencies || [],
        priority: task.priority || 5,
        estimatedComplexity: task.estimatedComplexity || 'medium',
        type: task.type || 'code',
        status: 'pending'
      })),
      summary: parsed.summary || 'No summary provided',
      estimatedDuration: parsed.estimatedDuration || 'Unknown',
      createdAt: new Date().toISOString(),
      metadata: {
        taskCount: parsed.tasks.length,
        hasParallelizable: this.hasParallelizableTasks(parsed.tasks)
      }
    };
  }

  /**
   * Check if plan has parallelizable tasks
   * @param {Array} tasks - Task list
   * @returns {boolean}
   */
  hasParallelizableTasks(tasks) {
    const taskIds = new Set(tasks.map(t => t.id));
    return tasks.some(task => 
      task.dependencies.length === 0 || 
      task.dependencies.every(dep => !taskIds.has(dep))
    );
  }

  /**
   * Delay helper for retries
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get planning history
   * @returns {Array} Plan history
   */
  getHistory() {
    return [...this.planHistory];
  }

  /**
   * Clear planning history
   */
  clearHistory() {
    this.planHistory = [];
  }
}

export default PlanningEngine;
