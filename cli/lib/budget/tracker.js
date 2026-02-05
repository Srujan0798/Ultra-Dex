import fs from 'fs/promises';
import path from 'path';

const BUDGET_PATH = path.resolve(process.cwd(), '.ultra', 'budget.json');

export async function loadBudgetState() {
  try {
    const raw = await fs.readFile(BUDGET_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { limits: { daily: 0, monthly: 0 }, usage: { daily: 0, monthly: 0 } };
  }
}

export async function saveBudgetState(state) {
  await fs.mkdir(path.dirname(BUDGET_PATH), { recursive: true });
  await fs.writeFile(BUDGET_PATH, JSON.stringify(state, null, 2), 'utf8');
}

export async function recordUsage(amount) {
  const state = await loadBudgetState();
  state.usage.daily += amount;
  state.usage.monthly += amount;
  await saveBudgetState(state);
  return state;
}

export function getBudgetWarnings(state) {
  const warnings = [];
  if (state.limits.daily && state.usage.daily >= state.limits.daily * 0.8) warnings.push('daily');
  if (state.limits.monthly && state.usage.monthly >= state.limits.monthly * 0.8) warnings.push('monthly');
  return warnings;
}
