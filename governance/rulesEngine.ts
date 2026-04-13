// Re-export from the canonical rules module.
// rulesEngine.ts is kept for backwards-compat but all rule logic lives in rules.ts.
export { RequireTests as RequireTestsRule, CostBudget as CostBudgetRule, ConfidenceThreshold as ConfidenceThresholdRule } from './rules.js';
export { RuleEngine } from './rules.js';
