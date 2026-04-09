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
import { aiMetaLayer } from '../ai-meta-layer.js';
let ArchitectSimulator = class {
  constructor(objective, context) {
    this.objective = objective;
    this.context = context;
  }
  getPossibleActions(state) {
    return state.remainingOptions || [];
  }
  applyAction(state, action) {
    return {
      objective: this.objective,
      history: [...(state.history || []), action],
      remainingOptions: state.remainingOptions.filter((o) => o !== action),
      isTerminal: state.remainingOptions.length <= 1,
    };
  }
  async evaluate(state) {
    const response = await aiMetaLayer.call(null, [
      {
        role: 'system',
        content:
          'You are an Architect Evaluator. Rate the following sequence of development steps from 0.0 to 1.0 based on efficiency, completeness, and logical flow. Return ONLY the number.',
      },
      {
        role: 'user',
        content: `Objective: ${this.objective}
Plan Sequence: ${JSON.stringify(state.history)}`,
      },
    ]);
    const score = parseFloat(response.text);
    return isNaN(score) ? 0.5 : score;
  }
};
ArchitectSimulator = __decorateClass([singleton()], ArchitectSimulator);
export { ArchitectSimulator };
