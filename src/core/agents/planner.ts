var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { EventEmitter } from "events";
let Planner = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.plans = /* @__PURE__ */ new Map();
    this.strategies = /* @__PURE__ */ new Map();
    this.config = {
      maxPlanDepth: options.maxPlanDepth || 5,
      enableOptimization: options.enableOptimization !== false,
      enableParallelization: options.enableParallelization !== false,
      ...options
    };
    this.state = "idle";
    this.registerDefaultStrategies();
  }
  /**
   * Register default planning strategies
   */
  registerDefaultStrategies() {
    this.strategies.set("simple", this.strategySimple.bind(this));
    this.strategies.set("hierarchical", this.strategyHierarchical.bind(this));
    this.strategies.set("dependency-based", this.strategyDependencyBased.bind(this));
    this.strategies.set("constraint-based", this.strategyConstraintBased.bind(this));
  }
  /**
   * Register a custom planning strategy
   */
  registerStrategy(name, strategyFunction) {
    this.strategies.set(name, strategyFunction);
    this.emit("strategy.registered", { strategyName: name });
    return this;
  }
  /**
   * Create a plan for a task
   */
  async createPlan(task, options = {}) {
    const planId = this.generateId();
    const strategy = options.strategy || "hierarchical";
    this.emit("plan.creation.started", { planId, task, strategy });
    try {
      const strategyFn = this.strategies.get(strategy);
      if (!strategyFn) {
        throw new Error(`Unknown planning strategy: ${strategy}`);
      }
      const plan = await strategyFn(task, options);
      plan.id = planId;
      plan.strategy = strategy;
      plan.createdAt = Date.now();
      plan.status = "created";
      if (this.config.enableOptimization && options.optimize !== false) {
        this.optimizePlan(plan);
      }
      this.plans.set(planId, plan);
      this.emit("plan.creation.succeeded", { planId, plan });
      return plan;
    } catch (error) {
      this.emit("plan.creation.failed", { planId, task, error });
      throw error;
    }
  }
  /**
   * Simple strategy - create flat task list
   */
  async strategySimple(task, options) {
    return {
      mainTask: task,
      subtasks: [],
      dependencies: [],
      parallelizable: true,
      estimatedDuration: task.estimatedDuration || 0
    };
  }
  /**
   * Hierarchical strategy - decompose into subtasks recursively
   */
  async strategyHierarchical(task, options = {}) {
    const depth = options.depth || 0;
    if (depth >= this.config.maxPlanDepth) {
      return {
        mainTask: task,
        subtasks: [],
        dependencies: [],
        parallelizable: true
      };
    }
    const subtasks = this.decomposeTask(task);
    const plan = {
      mainTask: task,
      subtasks: [],
      dependencies: [],
      parallelizable: false,
      estimatedDuration: 0
    };
    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];
      const subplan = await this.strategyHierarchical(
        subtask,
        { ...options, depth: depth + 1 }
      );
      plan.subtasks.push(subplan);
      plan.estimatedDuration += subplan.estimatedDuration || 0;
      if (i > 0) {
        plan.dependencies.push({
          from: subtasks[i - 1].id || `subtask-${i - 1}`,
          to: subtask.id || `subtask-${i}`
        });
      }
    }
    return plan;
  }
  /**
   * Dependency-based strategy - respects explicit task dependencies
   */
  async strategyDependencyBased(task, options) {
    const dependencyGraph = this.buildDependencyGraph(task);
    const topologicalOrder = this.topologicalSort(dependencyGraph);
    return {
      mainTask: task,
      subtasks: topologicalOrder,
      dependencies: dependencyGraph,
      parallelizable: true,
      estimatedDuration: this.estimateExecutionTime(topologicalOrder)
    };
  }
  /**
   * Constraint-based strategy - considers resource and time constraints
   */
  async strategyConstraintBased(task, options = {}) {
    const constraints = options.constraints || {};
    const subtasks = this.decomposeTask(task);
    const partitions = this.partitionByConstraints(subtasks, constraints);
    return {
      mainTask: task,
      subtasks: partitions,
      dependencies: this.buildConstraintDependencies(partitions),
      parallelizable: true,
      constraints,
      estimatedDuration: this.estimateConstrainedExecution(partitions, constraints)
    };
  }
  /**
   * Decompose task into subtasks
   */
  decomposeTask(task) {
    const subtasks = [];
    if (task.type === "analysis") {
      subtasks.push(
        { type: "data-collection", data: task.data },
        { type: "preprocessing", data: task.data },
        { type: "analysis-execution", data: task.data },
        { type: "result-compilation", data: task.data }
      );
    } else if (task.type === "workflow") {
      subtasks.push(...task.steps || []);
    } else if (task.subtasks) {
      subtasks.push(...task.subtasks);
    } else {
      subtasks.push(task);
    }
    return subtasks;
  }
  /**
   * Build dependency graph
   */
  buildDependencyGraph(task) {
    const graph = /* @__PURE__ */ new Map();
    if (task.dependencies) {
      for (const dep of task.dependencies) {
        if (!graph.has(dep.from)) {
          graph.set(dep.from, []);
        }
        graph.get(dep.from).push(dep.to);
      }
    }
    return graph;
  }
  /**
   * Topological sort of task dependencies
   */
  topologicalSort(graph) {
    const visited = /* @__PURE__ */ new Set();
    const result = [];
    const visit = (node) => {
      if (visited.has(node))
        return;
      visited.add(node);
      if (graph.has(node)) {
        for (const neighbor of graph.get(node)) {
          visit(neighbor);
        }
      }
      result.push(node);
    };
    for (const node of graph.keys()) {
      visit(node);
    }
    return result;
  }
  /**
   * Partition tasks by constraints
   */
  partitionByConstraints(tasks, constraints = {}) {
    const partitions = [[], [], []];
    for (const task of tasks) {
      let priority = 1;
      if (task.priority) {
        priority = task.priority < 3 ? 0 : task.priority > 6 ? 2 : 1;
      }
      if (constraints.cpuIntensive && task.cpuIntensive) {
        priority = 0;
      }
      partitions[priority].push(task);
    }
    return partitions.flat();
  }
  /**
   * Build constraint-based dependencies
   */
  buildConstraintDependencies(partitions) {
    const deps = [];
    for (let i = 0; i < partitions.length - 1; i++) {
      if (partitions[i].length > 0 && partitions[i + 1].length > 0) {
        deps.push({
          from: partitions[i][partitions[i].length - 1],
          to: partitions[i + 1][0],
          type: "sequential"
        });
      }
    }
    return deps;
  }
  /**
   * Optimize plan for faster execution
   */
  optimizePlan(plan) {
    plan = this.removeRedundancy(plan);
    if (this.config.enableParallelization) {
      plan = this.identifyParallelTasks(plan);
    }
    plan = this.reorderOptimal(plan);
    return plan;
  }
  /**
   * Remove redundant tasks
   */
  removeRedundancy(plan) {
    const seen = /* @__PURE__ */ new Set();
    plan.subtasks = plan.subtasks.filter((task) => {
      const key = JSON.stringify(task);
      if (seen.has(key))
        return false;
      seen.add(key);
      return true;
    });
    return plan;
  }
  /**
   * Identify tasks that can run in parallel
   */
  identifyParallelTasks(plan) {
    const parallelGroups = [];
    const processed = /* @__PURE__ */ new Set();
    for (const task of plan.subtasks) {
      if (processed.has(task))
        continue;
      const group = [task];
      processed.add(task);
      for (const other of plan.subtasks) {
        if (!processed.has(other) && this.canRunInParallel(task, other, plan)) {
          group.push(other);
          processed.add(other);
        }
      }
      parallelGroups.push(group);
    }
    plan.parallelGroups = parallelGroups;
    return plan;
  }
  /**
   * Check if two tasks can run in parallel
   */
  canRunInParallel(task1, task2, plan) {
    for (const dep of plan.dependencies || []) {
      if (dep.from === task1 && dep.to === task2 || dep.from === task2 && dep.to === task1) {
        return false;
      }
    }
    return true;
  }
  /**
   * Reorder tasks for optimal execution
   */
  reorderOptimal(plan) {
    plan.subtasks.sort(
      (a, b) => (b.estimatedDuration || 0) - (a.estimatedDuration || 0)
    );
    return plan;
  }
  /**
   * Estimate execution time
   */
  estimateExecutionTime(tasks) {
    return tasks.reduce((sum, task) => sum + (task.estimatedDuration || 1e3), 0);
  }
  /**
   * Estimate constrained execution time
   */
  estimateConstrainedExecution(partitions, constraints = {}) {
    let totalTime = 0;
    for (const partition of partitions) {
      const maxTime = Math.max(
        ...partition.map((t) => t.estimatedDuration || 1e3)
      );
      totalTime += maxTime;
    }
    return totalTime;
  }
  /**
   * Refine an existing plan
   */
  async refinePlan(planId, refinements = {}) {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }
    this.emit("plan.refinement.started", { planId });
    try {
      if (refinements.addSubtasks) {
        plan.subtasks.push(...refinements.addSubtasks);
      }
      if (refinements.updateDependencies) {
        plan.dependencies = refinements.updateDependencies;
      }
      if (refinements.updateConstraints) {
        plan.constraints = { ...plan.constraints, ...refinements.updateConstraints };
      }
      plan.refinedAt = Date.now();
      plan.refinementCount = (plan.refinementCount || 0) + 1;
      this.emit("plan.refinement.succeeded", { planId, plan });
      return plan;
    } catch (error) {
      this.emit("plan.refinement.failed", { planId, error });
      throw error;
    }
  }
  /**
   * Get plan details
   */
  getPlan(planId) {
    return this.plans.get(planId);
  }
  /**
   * List all plans
   */
  listPlans(filter = {}) {
    let plans = Array.from(this.plans.values());
    if (filter.status) {
      plans = plans.filter((p) => p.status === filter.status);
    }
    if (filter.strategy) {
      plans = plans.filter((p) => p.strategy === filter.strategy);
    }
    return plans;
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Shutdown planner
   */
  async shutdown() {
    this.state = "shutdown";
    this.emit("planner.shutdown");
  }
};
Planner = __decorateClass([
  singleton()
], Planner);
var planner_default = Planner;
export {
  Planner,
  planner_default as default
};
