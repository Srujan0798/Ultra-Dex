/**
 * Core Planner Module
 * Goal → Task Graph Compiler
 *
 * Transforms high-level goals into executable DexGraph task graphs.
 */

import { DexGraphResult } from '../../dexgraph/types.js';

export interface Goal {
  id: string;
  description: string;
  constraints?: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface Plan {
  id: string;
  goalId: string;
  graph: DexGraphResult;
  estimatedDuration: number;
  createdAt: Date;
}

export interface PlannerConfig {
  maxTasksPerPlan: number;
  enableParallelization: boolean;
  defaultTimeout: number;
}

export class TaskGraphPlanner {
  private config: PlannerConfig;
  private plans: Map<string, Plan> = new Map();

  constructor(config: Partial<PlannerConfig> = {}) {
    this.config = {
      maxTasksPerPlan: config.maxTasksPerPlan ?? 50,
      enableParallelization: config.enableParallelization ?? true,
      defaultTimeout: config.defaultTimeout ?? 300000,
    };
  }

  /**
   * Compile a goal into an executable task graph
   */
  async compile(goal: Goal): Promise<Plan> {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Decompose goal into tasks based on role patterns
    const tasks = this.decomposeGoal(goal);

    // Build dependency graph
    const graph = this.buildGraph(tasks, goal);

    const plan: Plan = {
      id: planId,
      goalId: goal.id,
      graph,
      estimatedDuration: this.estimateDuration(graph),
      createdAt: new Date(),
    };

    this.plans.set(planId, plan);
    return plan;
  }

  /**
   * Decompose a goal into task definitions
   */
  private decomposeGoal(goal: Goal): Array<{
    id: string;
    role: 'architect' | 'engineer' | 'tester' | 'reviewer';
    instruction: string;
    dependencies: string[];
  }> {
    // Analyze goal and generate appropriate task sequence
    const tasks: Array<{
      id: string;
      role: 'architect' | 'engineer' | 'tester' | 'reviewer';
      instruction: string;
      dependencies: string[];
    }> = [];

    // Architect phase: design the approach
    const archTask = {
      id: `${goal.id}_design`,
      role: 'architect' as const,
      instruction: `Design architecture for: ${goal.description}`,
      dependencies: [] as string[],
    };
    tasks.push(archTask);

    // Engineer phase: implement
    const implTask = {
      id: `${goal.id}_implement`,
      role: 'engineer' as const,
      instruction: `Implement solution for: ${goal.description}`,
      dependencies: [archTask.id],
    };
    tasks.push(implTask);

    // Tester phase: verify
    const testTask = {
      id: `${goal.id}_test`,
      role: 'tester' as const,
      instruction: `Verify implementation: ${goal.description}`,
      dependencies: [implTask.id],
    };
    tasks.push(testTask);

    // Reviewer phase: final review
    const reviewTask = {
      id: `${goal.id}_review`,
      role: 'reviewer' as const,
      instruction: `Review deliverables for: ${goal.description}`,
      dependencies: [testTask.id],
    };
    tasks.push(reviewTask);

    return tasks;
  }

  /**
   * Build DexGraph result from tasks
   */
  private buildGraph(
    tasks: Array<{
      id: string;
      role: 'architect' | 'engineer' | 'tester' | 'reviewer';
      instruction: string;
      dependencies: string[];
    }>,
    goal: Goal
  ): DexGraphResult {
    const nodes = tasks.map((task) => ({
      id: task.id,
      role: task.role,
      instruction: task.instruction,
      dependencies: task.dependencies,
      context: { goalId: goal.id, priority: goal.priority ?? 'medium' },
      parallel: this.config.enableParallelization,
      state: 'CREATED' as const,
    }));

    const edges: Array<{ from: string; to: string }> = [];
    for (const task of tasks) {
      for (const dep of task.dependencies) {
        edges.push({ from: dep, to: task.id });
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        name: goal.description.slice(0, 50),
        description: goal.description,
        context: { goalId: goal.id },
      },
    };
  }

  /**
   * Estimate execution duration based on task complexity
   */
  private estimateDuration(graph: DexGraphResult): number {
    const baseTimePerTask = 5000; // 5 seconds base
    const parallelFactor = this.config.enableParallelization ? 0.6 : 1.0;
    return graph.nodes.length * baseTimePerTask * parallelFactor;
  }

  /**
   * Retrieve a plan by ID
   */
  getPlan(id: string): Plan | undefined {
    return this.plans.get(id);
  }

  /**
   * List all plans
   */
  listPlans(): Plan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Delete a plan
   */
  deletePlan(id: string): boolean {
    return this.plans.delete(id);
  }
}

// Export singleton instance
export const planner = new TaskGraphPlanner();

// Re-export types
export type { DexGraphResult };
