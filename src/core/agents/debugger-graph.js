// Copyright (c) 2026 Ultra-Dex
// Debugger Graph - Debugging and tracing graph

import { GraphUtils } from './graph-utils.js';

/**
 * DebuggerGraph
 * Traces agent execution paths for debugging
 */
export class DebuggerGraph {
  constructor() {
    this.graph = GraphUtils.createGraph();
    this.traces = new Map();
    this.breakpoints = new Set();
    this.watchpoints = new Map();
  }

  /**
   * Add debug point
   */
  addDebugPoint(pointId, metadata = {}) {
    GraphUtils.addNode(this.graph, pointId, {
      type: 'debug-point',
      ...metadata
    });

    this.traces.set(pointId, []);
    return this;
  }

  /**
   * Add debug flow
   */
  addDebugFlow(fromPointId, toPointId) {
    GraphUtils.addEdge(this.graph, fromPointId, toPointId, {
      type: 'debug-flow'
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
      stackTrace: new Error().stack
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
      totalTraces: Array.from(this.traces.values()).reduce((sum, traces) => sum + traces.length, 0)
    };
  }
}

export default DebuggerGraph;
