import { decomposeGoal } from './goal-decomposition.js';
import { loadRules, evaluateRules } from './rules-engine.js';

export async function buildPlan(goal, options = {}) {
  const steps = decomposeGoal(goal);
  const rules = await loadRules();
  const planText = steps.map(step => `- ${step.description}`).join('\n');
  const violations = evaluateRules(planText, rules.rules || []);

  return {
    goal,
    steps,
    planText,
    violations,
    approved: violations.length === 0
  };
}

export default {
  buildPlan
};
