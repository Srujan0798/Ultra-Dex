// Copyright (c) 2026 Ultra-Dex
// Meta Orchestrator - High-level agent orchestration

import { EventEmitter } from 'events';
import { SwarmEngine } from './swarm-engine.js';
import { Executor } from './executor.js';
import { Planner } from './planner.js';
import { Scheduler } from './scheduler.js';

/**
 * MetaOrchestrator
 * High-level orchestration of multiple agent systems
 */
export class MetaOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.swarmEngine = new SwarmEngine(options.swarm);
    this.executor = new Executor(options.executor);
    this.planner = new Planner(options.planner);
    this.scheduler = new Scheduler(options.scheduler);
    this.workflows = new Map();
    this.config = {
      enableAutoOrchestration: options.enableAutoOrchestration !== false,
      orchestrationInterval: options.orchestrationInterval || 5000,
      ...options
    };
    this.state = 'idle';
    this.orchestrationTimer = null;
  }

  /**
   * Initialize meta orchestrator
   */
  async initialize() {
    this.state = 'initializing';

    this.emit('meta-orchestrator.initializing');

    await Promise.all([
      this.swarmEngine.initialize(),
      this.executor.initialize(),
      this.planner.initialize(),
      this.scheduler.initialize()
    ]);

    this.state = 'ready';

    if (this.config.enableAutoOrchestration) {
      this.startAutoOrchestration();
    }

    this.emit('meta-orchestrator.ready');
    return this;
  }

  /**
   * Create and execute a complex workflow
   */
  async executeWorkflow(workflowDefinition, options = {}) {
    const workflowId = this.generateId();
    const workflow = {
      id: workflowId,
      definition: workflowDefinition,
      status: 'created',
      startedAt: Date.now(),
      steps: [],
      results: []
    };

    this.workflows.set(workflowId, workflow);

    this.emit('workflow.created', { workflowId, definition: workflowDefinition });

    try {
      // Step 1: Plan the workflow
      const plan = await this.planner.createPlan(workflowDefinition, {
        strategy: options.planningStrategy || 'hierarchical'
      });

      workflow.plan = plan;
      workflow.status = 'planned';

      this.emit('workflow.planned', { workflowId, plan });

      // Step 2: Execute planned tasks
      const result = await this.executePlan(workflowId, plan, options);

      workflow.status = 'completed';
      workflow.result = result;
      workflow.completedAt = Date.now();

      this.emit('workflow.completed', { workflowId, result });

      return result;
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error;
      workflow.failedAt = Date.now();

      this.emit('workflow.failed', { workflowId, error });
      throw error;
    }
  }

  /**
   * Execute a planned workflow
   */
  async executePlan(workflowId, plan, options = {}) {
    const workflow = this.workflows.get(workflowId);

    // Execute subtasks based on plan structure
    const results = await this.executeTaskHierarchy(plan, options);

    return {
      workflowId,
      results,
      executedAt: Date.now(),
      duration: Date.now() - workflow.startedAt
    };
  }

  /**
   * Execute task hierarchy
   */
  async executeTaskHierarchy(plan, options = {}, depth = 0) {
    const results = [];

    if (plan.parallelGroups && depth === 0) {
      // Execute parallel groups
      for (const group of plan.parallelGroups) {
        const groupResults = await Promise.all(
          group.map(task => this.executeTask(task, options))
        );
        results.push(...groupResults);
      }
    } else if (plan.subtasks && plan.subtasks.length > 0) {
      // Execute subtasks recursively
      if (options.strategy === 'parallel') {
        const parallelResults = await Promise.all(
          plan.subtasks.map(subtask => this.executeTaskHierarchy(subtask, options, depth + 1))
        );
        results.push(...parallelResults);
      } else {
        for (const subtask of plan.subtasks) {
          const result = await this.executeTaskHierarchy(subtask, options, depth + 1);
          results.push(result);
        }
      }
    } else {
      // Execute leaf task
      const result = await this.executeTask(plan, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute individual task
   */
  async executeTask(task, options = {}) {
    // Determine execution strategy
    if (task.strategy === 'swarm') {
      return await this.executeInSwarm(task, options);
    } else if (task.schedule) {
      return await this.scheduleTask(task, options);
    } else {
      return await this.executor.execute(task, options);
    }
  }

  /**
   * Execute task in swarm
   */
  async executeInSwarm(task, options = {}) {
    const swarmId = task.swarmId || this.generateId();

    // Execute task across swarm
    return await this.swarmEngine.executeInSwarm(
      swarmId,
      task,
      options
    );
  }

  /**
   * Schedule a task
   */
  async scheduleTask(task, options = {}) {
    const taskId = this.generateId();

    return this.scheduler.scheduleRecurring(
      taskId,
      task,
      task.schedule,
      options
    );
  }

  /**
   * Start auto orchestration
   */
  startAutoOrchestration() {
    if (this.orchestrationTimer) {
      clearInterval(this.orchestrationTimer);
    }

    this.orchestrationTimer = setInterval(() => {
      this.performAutoOrchestration();
    }, this.config.orchestrationInterval);
  }

  /**
   * Perform auto orchestration
   */
  async performAutoOrchestration() {
    // Monitor and adjust running workflows
    for (const [workflowId, workflow] of this.workflows) {
      if (workflow.status === 'completed' || workflow.status === 'failed') {
        // Clean up completed workflows after retention period
        if (Date.now() - (workflow.completedAt || workflow.failedAt) > 3600000) {
          this.workflows.delete(workflowId);
        }
      }
    }

    this.emit('orchestration.cycle-complete', { workflowCount: this.workflows.size });
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      state: this.state,
      swarmEngine: this.swarmEngine.state,
      executor: this.executor.state,
      planner: this.planner.state,
      scheduler: this.scheduler.state,
      activeWorkflows: this.workflows.size,
      executorStats: this.executor.getStats(),
      registryStats: this.getRegistryStats()
    };
  }

  /**
   * Get registry statistics
   */
  getRegistryStats() {
    return {
      swarms: Array.from(this.swarmEngine.swarms.keys()).length,
      scheduledTasks: this.scheduler.scheduledTasks.size,
      plans: this.planner.plans.size
    };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown meta orchestrator
   */
  async shutdown() {
    if (this.orchestrationTimer) {
      clearInterval(this.orchestrationTimer);
    }

    this.emit('meta-orchestrator.shutting-down');

    await Promise.all([
      this.swarmEngine.shutdown(),
      this.executor.shutdown(),
      this.planner.shutdown(),
      this.scheduler.shutdown()
    ]);

    this.state = 'shutdown';
    this.emit('meta-orchestrator.shutdown');
  }
}

export default MetaOrchestrator;
