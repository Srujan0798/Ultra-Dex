// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Budget Checker module
 * @module perf/budget-checker
 */

import fs from 'fs/promises';
import path from 'path';
import { getStatistics } from '../utils/profiler.js';

const DEFAULT_BUDGETS = {
  'file-scan': 1000,
  'graph-build': 3000,
  'api-call': 5000,
};

const BUDGET_PATH = path.join(process.cwd(), '.ultra-dex', 'perf-budgets.json');

async function loadBudgets() {
  try {
    const content = await fs.readFile(BUDGET_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return { budgets: { ...DEFAULT_BUDGETS } };
  }
}

async function saveBudgets(data) {
  await fs.mkdir(path.dirname(BUDGET_PATH), { recursive: true });
  await fs.writeFile(BUDGET_PATH, JSON.stringify(data, null, 2));
}

export async function setBudget(operation, ms) {
  const data = await loadBudgets();
  data.budgets[operation] = Number(ms);
  await saveBudgets(data);
}

export async function checkBudgets() {
  const data = await loadBudgets();
  const stats = getStatistics();
  const violations = [];

  for (const [operation, limit] of Object.entries(data.budgets)) {
    const stat = stats[operation];
    if (!stat) continue;
    if (stat.max > limit) {
      violations.push({ operation, max: stat.max, limit });
    }
  }

  return { budgets: data.budgets, violations };
}

export async function getBudgets() {
  const data = await loadBudgets();
  return data.budgets;
}
