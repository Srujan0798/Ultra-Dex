// Copyright (c) 2026 Ultra-Dex

import { printWarning } from '../utils/output.js';

/**
 * Enforce atomic task constraints (max 9 hours, min 20 char description)
 * @param {Array<Object>} [tasks=[]] - Tasks to validate
 * @param {number} [tasks[].estimateHours] - Estimated hours for the task
 * @param {string} [tasks[].description] - Task description
 * @returns {{ok: boolean, violations: Array<Object>}} Validation result
 */
export function enforceAtomicTasks(tasks = []) {
  const violations = [];
  tasks.forEach((task) => {
    if (task.estimateHours && task.estimateHours > 9) {
      violations.push({ task, reason: 'Estimate exceeds 9 hours' });
    }
    if (!task.description || task.description.length < 20) {
      violations.push({ task, reason: 'Task description too vague' });
    }
  });

  if (violations.length) {
    printWarning('⚠️ Atomic task enforcement violations detected:');
    violations.forEach((v) => printWarning(`- ${v.reason}`));
  }

  return { ok: violations.length === 0, violations };
}

/**
 * Handle errors in planner module
 * @param {Error} error - The error to handle
 * @param {string} [context='planner'] - Error context
 */
function handleModuleError(error, context = 'planner') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
