// Copyright (c) 2026 Ultra-Dex

export function decomposeGoal(goal = '') {
  const steps = goal
    .split(/,|and|then/gi)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step, index) => ({
      id: `step-${index + 1}`,
      description: step,
      dependencies: index === 0 ? [] : [`step-${index}`],
    }));
  return steps;
}

export default {
  decomposeGoal,
};
