import { runStructuralGates } from './structural.js';
import { runFunctionalGates } from './functional.js';
import { runArchitecturalGates } from './architectural.js';

export async function runAllGates(projectDir, config = {}) {
  const structural = await runStructuralGates(projectDir, config.gates || {});
  const functional = await runFunctionalGates(projectDir, config.gates || {});
  const architectural = await runArchitecturalGates(projectDir, config.gates?.architecture || {});
  return [...structural, ...functional, ...architectural];
}

export default { runAllGates };
