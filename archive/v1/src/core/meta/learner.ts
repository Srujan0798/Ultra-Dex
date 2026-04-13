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
import { ppmManager } from '../memory/manager.js';
import { aiMetaLayer } from '../ai/ai-meta-layer.js';
import chalk from 'chalk';
let Learner = class {
  async selfOptimize() {
    console.log(chalk.magenta('\u{1F9E0} Learner: Initiating Self-Optimization Cycle...'));
    const failures = await ppmManager.search('failed', 10);
    if (failures.length === 0) return 'No failure patterns detected.';
    const analysis = await aiMetaLayer.call(null, [
      {
        role: 'system',
        content:
          'You are the Meta-Optimizer. Analyze these execution failures and suggest a prompt improvement for the specialized agents.',
      },
      { role: 'user', content: JSON.stringify(failures) },
    ]);
    await ppmManager.add({
      content: `Self-Optimization Proposal: ${analysis.text}`,
      type: 'decision',
      importance: 9,
    });
    console.log(chalk.green('\u2705 Optimization proposal secured in Cold Memory.'));
    return analysis.text;
  }
};
Learner = __decorateClass([singleton()], Learner);
const learner = new Learner();
export { Learner, learner };
