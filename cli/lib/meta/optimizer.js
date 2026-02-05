import { evaluatePerformance } from './evaluator.js';

export async function suggestOptimization() {
  const metrics = await evaluatePerformance();
  if (metrics.total === 0) {
    return { recommendation: 'Collect more outcomes to tune prompts.', metrics };
  }

  if (metrics.successRate < 0.7) {
    return { recommendation: 'Increase review steps and add stricter validation.', metrics };
  }

  if (metrics.averageRating !== null && metrics.averageRating < 3.5) {
    return { recommendation: 'Refine prompt tone and add more examples.', metrics };
  }

  return { recommendation: 'Performance healthy. Keep monitoring.', metrics };
}
