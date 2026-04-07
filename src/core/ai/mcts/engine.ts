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
import { MCTSNode } from './node.js';
import { logger } from '../../utils/logging.js';
let MCTSEngine = class {
  constructor(rootState, simulator) {
    this.root = new MCTSNode(rootState);
    this.simulator = simulator;
  }
  /**
   * Run the MCTS for a set number of iterations
   */
  run(iterations = 100) {
    for (let i = 0; i < iterations; i++) {
      let node = this.select(this.root);
      if (!node.isTerminal() && !node.isFullyExpanded()) {
        node = this.expand(node);
      }
      const result = this.simulate(node);
      this.backpropagate(node, result);
    }
    return this.bestAction();
  }
  select(node) {
    while (!node.isTerminal() && node.isFullyExpanded()) {
      node = node.bestChild();
      if (!node)
        break;
    }
    return node;
  }
  expand(node) {
    const actions = this.simulator.getPossibleActions(node.state);
    if (!node.untriedActions || node.untriedActions.length === 0) {
      node.untriedActions = actions;
    }
    for (const action of actions) {
      const exists = node.children.find((c) => c.action === action);
      if (!exists) {
        const nextState = this.simulator.applyAction(node.state, action);
        const child = new MCTSNode(nextState, node, action);
        node.addChild(child);
        return child;
      }
    }
    return node;
  }
  simulate(node) {
    let currentState = node.state;
    let depth = 0;
    while (!currentState.isTerminal && depth < 50) {
      const actions = this.simulator.getPossibleActions(currentState);
      if (actions.length === 0)
        break;
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      currentState = this.simulator.applyAction(currentState, randomAction);
      depth++;
    }
    return this.simulator.evaluate(currentState);
  }
  backpropagate(node, result) {
    while (node) {
      node.update(result);
      node = node.parent;
    }
  }
  bestAction() {
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
};
MCTSEngine = __decorateClass([
  singleton()
], MCTSEngine);
function _handleError(error) {
  try {
    logger.error("[engine]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  MCTSEngine
};
