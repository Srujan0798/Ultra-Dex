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
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logging.js';
let MCTSNode = class {
  constructor(state, parent = null, action = null) {
    this.id = uuidv4();
    this.state = state;
    this.parent = parent;
    this.action = action;
    this.children = [];
    this.visits = 0;
    this.value = 0;
    this.untriedActions = [];
  }
  /**
   * Check if the node is a terminal state (success or failure)
   */
  isTerminal() {
    return this.state.isTerminal;
  }
  /**
   * Check if the node is fully expanded (all children generated)
   */
  isFullyExpanded() {
    return this.untriedActions.length === 0 && this.children.length > 0;
  }
  /**
   * Select the best child using Upper Confidence Bound (UCB1)
   * UCB1 = (Q/N) + C * sqrt(ln(Parent_N) / N)
   */
  bestChild(c = 1.414) {
    let best = null;
    let bestScore = -Infinity;
    for (const child of this.children) {
      if (child.visits === 0)
        return child;
      const exploit = child.value / child.visits;
      const explore = c * Math.sqrt(Math.log(this.visits) / child.visits);
      const score = exploit + explore;
      if (score > bestScore) {
        bestScore = score;
        best = child;
      }
    }
    return best;
  }
  /**
   * Update stats during backpropagation
   */
  update(result) {
    this.visits++;
    this.value += result;
  }
  /**
   * Add a child node
   */
  addChild(childNode) {
    this.children.push(childNode);
    childNode.parent = this;
  }
};
MCTSNode = __decorateClass([
  singleton()
], MCTSNode);
function _handleError(error) {
  try {
    logger.error("[node]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  MCTSNode
};
