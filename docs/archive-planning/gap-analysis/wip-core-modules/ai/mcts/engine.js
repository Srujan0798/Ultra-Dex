// Copyright (c) 2026 Ultra-Dex
// v5.1 Cognitive Core: MCTS Engine

import { MCTSNode } from './node.js';

export class MCTSEngine {
  constructor(rootState, simulator) {
    this.root = new MCTSNode(rootState);
    this.simulator = simulator; // The "World Model" that knows rules/transitions
  }

  /**
   * Run the MCTS for a set number of iterations
   */
  run(iterations = 100) {
    for (let i = 0; i < iterations; i++) {
      // 1. Selection
      let node = this.select(this.root);

      // 2. Expansion
      if (!node.isTerminal() && !node.isFullyExpanded()) {
        node = this.expand(node);
      }

      // 3. Simulation
      const result = this.simulate(node);

      // 4. Backpropagation
      this.backpropagate(node, result);
    }

    return this.bestAction();
  }

  select(node) {
    while (!node.isTerminal() && node.isFullyExpanded()) {
      node = node.bestChild();
      if (!node) break; // Should not happen if fully expanded
    }
    return node;
  }

  expand(node) {
    // Get possible actions from the simulator
    const actions = this.simulator.getPossibleActions(node.state);

    // Filter out actions already tried (not strictly needed if untriedActions is managed)
    // For simplicity, we assume we pick one untried action here

    // In a full implementation, `node.untriedActions` would be populated on creation.
    // Here we generate a child for a new action.

    // Optimization: If untriedActions is empty but we are expanding, populate it
    if (!node.untriedActions || node.untriedActions.length === 0) {
      node.untriedActions = actions; // For this simplified engine
    }

    // Pick a random untried action (or first)
    // In real MCTS, we pop from untriedActions
    // For this engine, we'll iterate actions and add a child if it doesn't exist

    // Simplified Expansion:
    // 1. Execute action on state -> consistent next state
    // 2. Create child node

    for (const action of actions) {
      // Check if child for this action exists
      const exists = node.children.find((c) => c.action === action);
      if (!exists) {
        const nextState = this.simulator.applyAction(node.state, action);
        const child = new MCTSNode(nextState, node, action);
        node.addChild(child);
        return child;
      }
    }

    return node; // Should ideally return a new child
  }

  simulate(node) {
    let currentState = node.state;
    // Perform a rollout (random walk) until terminal
    // Limit depth to prevent infinite loops
    let depth = 0;
    while (!currentState.isTerminal && depth < 50) {
      const actions = this.simulator.getPossibleActions(currentState);
      if (actions.length === 0) break;
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      currentState = this.simulator.applyAction(currentState, randomAction);
      depth++;
    }

    // Evaluate the final state
    return this.simulator.evaluate(currentState);
  }

  backpropagate(node, result) {
    while (node) {
      node.update(result);
      node = node.parent;
    }
  }

  bestAction() {
    // Robust child: action with most visits
    let best = null;
    let maxVisits = -1;

    for (const child of this.root.children) {
      if (child.visits > maxVisits) {
        maxVisits = child.visits;
        best = child.action;
      }
    }
    return best;
  }
}

/**
 * Error handler for engine
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[engine]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
