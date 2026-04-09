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
let DebuggerGraph = class {
  constructor() {
    this.graph = GraphUtils.createGraph();
    this.traces = /* @__PURE__ */ new Map();
    this.breakpoints = /* @__PURE__ */ new Set();
    this.watchpoints = /* @__PURE__ */ new Map();
  }
  /**
   * Add debug point
   */
  addDebugPoint(pointId, metadata = {}) {
    GraphUtils.addNode(this.graph, pointId, {
      type: 'debug-point',
      ...metadata,
    });
    this.traces.set(pointId, []);
    return this;
  }
  /**
   * Add debug flow
   */
  addDebugFlow(fromPointId, toPointId) {
    GraphUtils.addEdge(this.graph, fromPointId, toPointId, {
      type: 'debug-flow',
    });
    return this;
  }
  /**
   * Record trace
   */
  recordTrace(pointId, data) {
    if (!this.traces.has(pointId)) {
      this.traces.set(pointId, []);
    }
    this.traces.get(pointId).push({
      timestamp: Date.now(),
      data,
      stackTrace: new Error().stack,
    });
  }
  /**
   * Set breakpoint
   */
  setBreakpoint(pointId) {
    this.breakpoints.add(pointId);
  }
  /**
   * Remove breakpoint
   */
  removeBreakpoint(pointId) {
    this.breakpoints.delete(pointId);
  }
  /**
   * Is breakpoint set
   */
  hasBreakpoint(pointId) {
    return this.breakpoints.has(pointId);
  }
  /**
   * Add watchpoint
   */
  addWatchpoint(variableName, condition) {
    this.watchpoints.set(variableName, { condition, triggered: false });
  }
  /**
   * Check watchpoints
   */
  checkWatchpoints(variables) {
    const triggered = [];
    for (const [varName, watchpoint] of this.watchpoints) {
      if (varName in variables) {
        if (watchpoint.condition(variables[varName])) {
          if (!watchpoint.triggered) {
            triggered.push(varName);
            watchpoint.triggered = true;
          }
        } else {
          watchpoint.triggered = false;
        }
      }
    }
    return triggered;
  }
  /**
   * Get execution path
   */
  getExecutionPath(startPointId) {
    return GraphUtils.shortestPath(this.graph, startPointId, null) || [];
  }
  /**
   * Get traces for point
   */
  getTraces(pointId) {
    return this.traces.get(pointId) || [];
  }
  /**
   * Get all traces
   */
  getAllTraces() {
    return Object.fromEntries(this.traces);
  }
  /**
   * Analyze execution flow
   */
  analyzeFlow() {
    return {
      debugPoints: this.graph.nodes.size,
      connections: this.graph.edges.size,
      breakpoints: this.breakpoints.size,
      watchpoints: this.watchpoints.size,
      totalTraces: Array.from(this.traces.values()).reduce((sum, traces) => sum + traces.length, 0),
    };
  }
};
DebuggerGraph = __decorateClass([singleton()], DebuggerGraph);
var debugger_graph_default = DebuggerGraph;
export { DebuggerGraph, debugger_graph_default as default };
