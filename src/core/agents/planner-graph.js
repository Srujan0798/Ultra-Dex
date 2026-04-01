// Copyright (c) 2026 Ultra-Dex
// Planner Graph - Task planning graph structures

import { GraphUtils } from './graph-utils.js';

/**
 * PlannerGraph
 * Graph-based task planning and decomposition
 */
export class PlannerGraph {
  constructor() {
    this.graph = GraphUtils.createGraph();
    this.taskNodes = new Map();
    this.dependencyMap = new Map();
  }

  /**
   * Add task to graph
   */
  addTask(taskId, taskData) {
    GraphUtils.addNode(this.graph, taskId, {
      type: 'task',
      ...taskData
    });

    this.taskNodes.set(taskId, taskData);
    return this;
  }

  /**
   * Add task dependency
   */
  addDependency(fromTaskId, toTaskId, options = {}) {
    GraphUtils.addEdge(this.graph, fromTaskId, toTaskId, {
      type: 'dependency',
      ...options
    });

    if (!this.dependencyMap.has(toTaskId)) {
      this.dependencyMap.set(toTaskId, []);
    }

    this.dependencyMap.get(toTaskId).push(fromTaskId);
    return this;
  }

  /**
   * Get task dependencies
   */
  getTaskDependencies(taskId) {
    return this.dependencyMap.get(taskId) || [];
  }

  /**
   * Find critical path
   */
  findCriticalPath() {
    const paths = [];

    for (const nodeId of this.graph.nodes.keys()) {
      const path = GraphUtils.shortestPath(this.graph, nodeId, null);
      if (path) paths.push(path);
    }

    return paths.length > 0 ? paths[paths.length - 1] : [];
  }

  /**
   * Get execution order
   */
  getExecutionOrder() {
    return GraphUtils.topologicalSort(this.graph);
  }

  /**
   * Parallelize independent tasks
   */
  identifyParallelTasks() {
    const groups = [];
    const processed = new Set();

    for (const nodeId of this.graph.nodes.keys()) {
      if (processed.has(nodeId)) continue;

      const group = [nodeId];
      processed.add(nodeId);

      for (const otherId of this.graph.nodes.keys()) {
        if (processed.has(otherId)) continue;

        if (this.canRunInParallel(nodeId, otherId)) {
          group.push(otherId);
          processed.add(otherId);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Check if tasks can run in parallel
   */
  canRunInParallel(task1Id, task2Id) {
    const path1to2 = GraphUtils.shortestPath(this.graph, task1Id, task2Id);
    const path2to1 = GraphUtils.shortestPath(this.graph, task2Id, task1Id);

    return !path1to2 && !path2to1;
  }

  /**
   * Estimate total execution time
   */
  estimateExecutionTime() {
    let totalTime = 0;
    const taskNodes = Array.from(this.taskNodes.values());

    for (const task of taskNodes) {
      totalTime += task.estimatedDuration || 0;
    }

    return totalTime;
  }
}

export default PlannerGraph;
