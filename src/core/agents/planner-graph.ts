var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { GraphUtils } from './graph-utils.js';
let PlannerGraph = class {
  constructor() {
    this.graph = GraphUtils.createGraph();
    this.taskNodes = /* @__PURE__ */ new Map();
    this.dependencyMap = /* @__PURE__ */ new Map();
  }
  /**
   * Add task to graph
   */
  addTask(taskId, taskData) {
    GraphUtils.addNode(this.graph, taskId, {
      type: 'task',
      ...taskData,
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
      ...options,
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
    const processed = /* @__PURE__ */ new Set();
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
};
PlannerGraph = __decorateClass([singleton()], PlannerGraph);
var planner_graph_default = PlannerGraph;
export { PlannerGraph, planner_graph_default as default };
