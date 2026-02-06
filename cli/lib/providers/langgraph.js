// Copyright (c) 2026 Ultra-Dex

/**
 * LangGraph Native Integration for Ultra-Dex
 * Provides a state-machine based graph executor for complex agent swarms
 */

import { LangChainAdapter } from './langchain.js';

export class LangGraphExecutor {
  constructor(options = {}) {
    this.adapter = new LangChainAdapter(options);
    this.nodes = new Map();
    this.edges = [];
    this.state = {};
  }

  /**
   * Add a node to the graph (an agent or a function)
   */
  addNode(name, action) {
    this.nodes.set(name, action);
    return this;
  }

  /**
   * Add a directed edge between nodes
   */
  addEdge(from, to) {
    this.edges.push({ from, to });
    return this;
  }

  /**
   * Set initial state
   */
  setInitialState(state) {
    this.state = state;
    return this;
  }

  /**
   * Execute the graph until completion or max iterations
   */
  async execute(input, maxIterations = 10) {
    await this.adapter.initialize();

    let currentNode = 'start';
    this.state.input = input;
    let iterations = 0;

    while (currentNode !== 'end' && iterations < maxIterations) {
      iterations++;

      const nodeAction = this.nodes.get(currentNode);
      if (!nodeAction) {
        throw new Error(`Node "${currentNode}" not found in graph.`);
      }

      // Execute node
      console.log(`[LangGraph] Executing node: ${currentNode}`);
      const result = await this.runNode(currentNode, nodeAction);

      // Update state
      this.state = { ...this.state, ...result };

      // Find next node (simplified logic for prototype)
      const edge = this.edges.find((e) => e.from === currentNode);
      if (edge) {
        currentNode = edge.to;
      } else {
        currentNode = 'end';
      }
    }

    return this.state;
  }

  async runNode(name, action) {
    if (typeof action === 'function') {
      return await action(this.state);
    }

    // If action is an agent name, run via adapter
    return await this.adapter.runAgent(name, this.state.input);
  }

  /**
   * Export Ultra-Dex swarm pipeline as a LangGraph compatible definition
   */
  exportAsJSON() {
    return {
      nodes: Array.from(this.nodes.keys()),
      edges: this.edges,
      initialState: this.state,
    };
  }
}

export default LangGraphExecutor;
