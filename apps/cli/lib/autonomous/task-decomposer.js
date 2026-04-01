/**
 * Task Decomposer
 * Breaks down plans into dependency graphs and parallelizable batches
 * @module autonomous/task-decomposer
 */

/**
 * Task Decomposer for dependency analysis and batch grouping
 */
export class TaskDecomposer {
  constructor() {
    this.dependencyGraph = new Map();
    this.priorityWeights = {
      dependencies: 0.3,
      complexity: 0.4,
      urgency: 0.3
    };
  }

  /**
   * Decompose a plan into ordered tasks and batches
   * @param {object} plan - Plan from PlanningEngine
   * @returns {object} Decomposed plan with batches
   */
  decompose(plan) {
    const tasks = plan.tasks || [];
    
    // Build dependency graph
    this.buildGraph(tasks);
    
    // Check for cycles
    const cycleCheck = this.detectCycles(tasks);
    if (cycleCheck.hasCycle) {
      throw new Error(`Circular dependency detected: ${cycleCheck.cycle.join(' -> ')}`);
    }

    // Topological sort
    const orderedTasks = this.topologicalSort(tasks);
    
    // Calculate priority scores
    const scoredTasks = this.calculatePriorityScores(orderedTasks);
    
    // Group into parallelizable batches
    const batches = this.createBatches(scoredTasks);

    return {
      planId: plan.id,
      orderedTasks: scoredTasks,
      batches,
      dependencyGraph: Object.fromEntries(this.dependencyGraph),
      metadata: {
        totalTasks: tasks.length,
        batchCount: batches.length,
        maxParallelism: Math.max(...batches.map(b => b.tasks.length)),
        criticalPath: this.findCriticalPath(scoredTasks)
      }
    };
  }

  /**
   * Build adjacency list for dependency graph
   * @param {Array} tasks - Task list
   */
  buildGraph(tasks) {
    this.dependencyGraph.clear();
    
    for (const task of tasks) {
      this.dependencyGraph.set(task.id, {
        task,
        dependencies: task.dependencies || [],
        dependents: []
      });
    }

    // Build reverse edges (dependents)
    for (const task of tasks) {
      for (const depId of task.dependencies || []) {
        const depNode = this.dependencyGraph.get(depId);
        if (depNode) {
          depNode.dependents.push(task.id);
        }
      }
    }
  }

  /**
   * Detect cycles in dependency graph using DFS
   * @param {Array} tasks - Task list
   * @returns {object} Cycle detection result
   */
  detectCycles(tasks) {
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];

    const dfs = (taskId) => {
      visited.add(taskId);
      recursionStack.add(taskId);
      path.push(taskId);

      const node = this.dependencyGraph.get(taskId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            const result = dfs(depId);
            if (result.hasCycle) return result;
          } else if (recursionStack.has(depId)) {
            const cycleStart = path.indexOf(depId);
            return {
              hasCycle: true,
              cycle: [...path.slice(cycleStart), depId]
            };
          }
        }
      }

      path.pop();
      recursionStack.delete(taskId);
      return { hasCycle: false };
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        const result = dfs(task.id);
        if (result.hasCycle) return result;
      }
    }

    return { hasCycle: false, cycle: [] };
  }

  /**
   * Topological sort using Kahn's algorithm
   * @param {Array} tasks - Task list
   * @returns {Array} Sorted tasks
   */
  topologicalSort(tasks) {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const inDegree = new Map();
    const result = [];

    // Initialize in-degrees
    for (const task of tasks) {
      inDegree.set(task.id, (task.dependencies || []).filter(d => taskMap.has(d)).length);
    }

    // Find all tasks with no dependencies
    const queue = tasks
      .filter(t => inDegree.get(t.id) === 0)
      .map(t => t.id);

    while (queue.length > 0) {
      const taskId = queue.shift();
      const task = taskMap.get(taskId);
      if (task) {
        result.push(task);

        // Reduce in-degree for dependents
        const node = this.dependencyGraph.get(taskId);
        if (node) {
          for (const dependentId of node.dependents) {
            const newDegree = inDegree.get(dependentId) - 1;
            inDegree.set(dependentId, newDegree);
            if (newDegree === 0) {
              queue.push(dependentId);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Calculate priority scores for tasks
   * @param {Array} tasks - Ordered tasks
   * @returns {Array} Tasks with priority scores
   */
  calculatePriorityScores(tasks) {
    const complexityMap = { low: 1, medium: 2, high: 3 };

    return tasks.map(task => {
      const depCount = (task.dependencies || []).length;
      const complexity = complexityMap[task.estimatedComplexity] || 2;
      const urgency = task.priority || 5;

      const score = 
        (10 - depCount) * this.priorityWeights.dependencies +
        (4 - complexity) * this.priorityWeights.complexity +
        urgency * this.priorityWeights.urgency;

      return {
        ...task,
        priorityScore: Math.round(score * 100) / 100
      };
    });
  }

  /**
   * Group tasks into parallelizable batches
   * @param {Array} tasks - Scored tasks
   * @returns {Array} Batches of tasks
   */
  createBatches(tasks) {
    const batches = [];
    const completed = new Set();
    const remaining = [...tasks];

    while (remaining.length > 0) {
      const batch = {
        id: `batch-${batches.length + 1}`,
        tasks: [],
        canParallelize: true
      };

      // Find tasks whose dependencies are all completed
      const ready = remaining.filter(task =>
        (task.dependencies || []).every(dep => completed.has(dep))
      );

      if (ready.length === 0 && remaining.length > 0) {
        // Shouldn't happen after cycle detection, but handle gracefully
        batch.tasks.push(remaining.shift());
        batch.canParallelize = false;
      } else {
        // Sort by priority score (descending)
        ready.sort((a, b) => b.priorityScore - a.priorityScore);
        
        for (const task of ready) {
          batch.tasks.push(task);
          completed.add(task.id);
          const idx = remaining.indexOf(task);
          if (idx > -1) remaining.splice(idx, 1);
        }
      }

      batches.push(batch);
    }

    return batches;
  }

  /**
   * Find the critical path (longest dependency chain)
   * @param {Array} tasks - Task list
   * @returns {Array} Critical path task IDs
   */
  findCriticalPath(tasks) {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const memo = new Map();

    const longestPath = (taskId) => {
      if (memo.has(taskId)) return memo.get(taskId);

      const task = taskMap.get(taskId);
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        memo.set(taskId, [taskId]);
        return [taskId];
      }

      let longest = [];
      for (const depId of task.dependencies) {
        if (taskMap.has(depId)) {
          const path = longestPath(depId);
          if (path.length > longest.length) {
            longest = path;
          }
        }
      }

      const result = [...longest, taskId];
      memo.set(taskId, result);
      return result;
    };

    let criticalPath = [];
    for (const task of tasks) {
      const path = longestPath(task.id);
      if (path.length > criticalPath.length) {
        criticalPath = path;
      }
    }

    return criticalPath;
  }
}

export default TaskDecomposer;
