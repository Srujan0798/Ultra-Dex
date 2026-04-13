/**
 * Core Scheduler Module
 * Task Ordering + Dependency Resolution
 *
 * Determines optimal execution order for tasks based on dependencies
 * and resource constraints.
 */

import { DexGraph } from '../../dexgraph/graph.js';
import { GraphNode, NodeState } from '../../dexgraph/types.js';

export interface ScheduleEntry {
  nodeId: string;
  priority: number;
  estimatedStartTime: number;
  estimatedEndTime: number;
  dependencies: string[];
}

export interface Schedule {
  id: string;
  entries: ScheduleEntry[];
  totalDuration: number;
  criticalPath: string[];
  parallelism: number;
}

export interface SchedulerOptions {
  maxParallelism: number;
  priorityWeights: Record<string, number>;
  enableWorkStealing: boolean;
}

export class DependencyScheduler {
  private options: SchedulerOptions;
  private schedules: Map<string, Schedule> = new Map();

  constructor(options: Partial<SchedulerOptions> = {}) {
    this.options = {
      maxParallelism: options.maxParallelism ?? 4,
      priorityWeights: options.priorityWeights ?? {
        architect: 10,
        engineer: 8,
        tester: 5,
        reviewer: 3,
      },
      enableWorkStealing: options.enableWorkStealing ?? true,
    };
  }

  /**
   * Calculate optimal schedule for a DexGraph
   */
  calculateSchedule(graph: DexGraph, scheduleId?: string): Schedule {
    const id = scheduleId ?? `sched_${Date.now()}`;
    const nodes = graph.getAllNodes();

    // Topological sort for base ordering
    const executionOrder = graph.topologicalSort();

    // Calculate priorities based on role and dependency depth
    const priorities = this.calculatePriorities(graph, executionOrder);

    // Build schedule entries with timing estimates
    const entries: ScheduleEntry[] = [];
    const startTimes = new Map<string, number>();
    const endTimes = new Map<string, number>();

    let currentTime = 0;

    for (const nodeId of executionOrder) {
      const node = graph.getNode(nodeId);
      const deps = graph.getDependencies(nodeId);

      // Calculate earliest possible start time
      let earliestStart = 0;
      for (const depId of deps) {
        const depEndTime = endTimes.get(depId) ?? 0;
        earliestStart = Math.max(earliestStart, depEndTime);
      }

      const startTime = earliestStart;
      const duration = this.estimateTaskDuration(node);
      const endTime = startTime + duration;

      startTimes.set(nodeId, startTime);
      endTimes.set(nodeId, endTime);
      currentTime = Math.max(currentTime, endTime);

      entries.push({
        nodeId,
        priority: priorities.get(nodeId) ?? 0,
        estimatedStartTime: startTime,
        estimatedEndTime: endTime,
        dependencies: deps,
      });
    }

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(graph, entries, endTimes);

    // Estimate parallelism factor
    const parallelism = this.calculateParallelism(entries);

    const schedule: Schedule = {
      id,
      entries,
      totalDuration: currentTime,
      criticalPath,
      parallelism,
    };

    this.schedules.set(id, schedule);
    return schedule;
  }

  /**
   * Calculate priority scores for each node
   */
  private calculatePriorities(graph: DexGraph, executionOrder: string[]): Map<string, number> {
    const priorities = new Map<string, number>();

    // Calculate depth from leaves (reverse topological)
    const reverseOrder = [...executionOrder].reverse();
    const depths = new Map<string, number>();

    for (const nodeId of reverseOrder) {
      const dependents = graph.getDependents(nodeId);
      let maxDepDepth = 0;
      for (const dep of dependents) {
        maxDepDepth = Math.max(maxDepDepth, depths.get(dep) ?? 0);
      }
      depths.set(nodeId, maxDepDepth + 1);
    }

    // Combine depth with role priority
    for (const nodeId of executionOrder) {
      const node = graph.getNode(nodeId);
      const depth = depths.get(nodeId) ?? 0;
      const roleWeight = this.options.priorityWeights[node.role] ?? 5;
      priorities.set(nodeId, depth * 10 + roleWeight);
    }

    return priorities;
  }

  /**
   * Estimate task duration based on role
   */
  private estimateTaskDuration(node: GraphNode): number {
    const baseDurations: Record<string, number> = {
      architect: 30000,
      engineer: 60000,
      tester: 20000,
      reviewer: 15000,
    };
    return baseDurations[node.role] ?? 30000;
  }

  /**
   * Calculate critical path (longest dependency chain)
   */
  private calculateCriticalPath(
    graph: DexGraph,
    entries: ScheduleEntry[],
    endTimes: Map<string, number>
  ): string[] {
    const path: string[] = [];
    let currentNode: string | null = null;
    let maxEndTime = -1;

    // Find leaf with maximum end time
    for (const entry of entries) {
      const endTime = endTimes.get(entry.nodeId) ?? 0;
      if (endTime > maxEndTime && graph.getDependents(entry.nodeId).length === 0) {
        maxEndTime = endTime;
        currentNode = entry.nodeId;
      }
    }

    // Trace back through dependencies
    while (currentNode) {
      path.unshift(currentNode);
      const deps = graph.getDependencies(currentNode);
      if (deps.length === 0) break;

      // Find dependency with latest end time
      let maxDepEndTime = -1;
      let nextNode: string | null = null;
      for (const dep of deps) {
        const depEndTime = endTimes.get(dep) ?? 0;
        if (depEndTime > maxDepEndTime) {
          maxDepEndTime = depEndTime;
          nextNode = dep;
        }
      }
      currentNode = nextNode;
    }

    return path;
  }

  /**
   * Calculate average parallelism level
   */
  private calculateParallelism(entries: ScheduleEntry[]): number {
    if (entries.length === 0) return 0;

    const timeSlices = new Map<number, number>();

    for (const entry of entries) {
      for (let t = entry.estimatedStartTime; t < entry.estimatedEndTime; t += 1000) {
        const second = Math.floor(t / 1000);
        timeSlices.set(second, (timeSlices.get(second) ?? 0) + 1);
      }
    }

    if (timeSlices.size === 0) return 0;

    const total = Array.from(timeSlices.values()).reduce((a, b) => a + b, 0);
    return total / timeSlices.size;
  }

  /**
   * Get next batch of executable tasks
   */
  getExecutableBatch(
    graph: DexGraph,
    maxBatchSize: number = this.options.maxParallelism
  ): GraphNode[] {
    const executable: GraphNode[] = [];
    const nodes = graph.getAllNodes();

    for (const node of nodes) {
      if (node.state !== 'READY') continue;

      const deps = graph.getDependencies(node.id);
      const allDepsCompleted = deps.every((depId) => graph.getNode(depId).state === 'SUCCESS');

      if (allDepsCompleted) {
        executable.push(node);
      }
    }

    // Sort by priority (descending) and take top N
    return executable
      .sort((a, b) => this.getNodePriority(b) - this.getNodePriority(a))
      .slice(0, maxBatchSize);
  }

  /**
   * Get priority score for a node
   */
  private getNodePriority(node: GraphNode): number {
    return this.options.priorityWeights[node.role] ?? 5;
  }

  /**
   * Retrieve schedule by ID
   */
  getSchedule(id: string): Schedule | undefined {
    return this.schedules.get(id);
  }

  /**
   * List all schedules
   */
  listSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }
}

// Export singleton
export const scheduler = new DependencyScheduler();

// Re-export types
export type { GraphNode, NodeState };
