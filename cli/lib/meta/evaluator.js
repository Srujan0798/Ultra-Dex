import { loadOutcomes } from './learner.js';

export async function evaluatePerformance() {
  const outcomes = await loadOutcomes();
  if (outcomes.length === 0) {
    return { total: 0, successRate: 0, averageRating: null };
  }
  const success = outcomes.filter((o) => o.outcome === 'success').length;
  const ratings = outcomes.map((o) => o.rating).filter((r) => typeof r === 'number');
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  return {
    total: outcomes.length,
    successRate: success / outcomes.length,
    averageRating: avgRating
  };
}
