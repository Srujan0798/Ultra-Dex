import { printWarning } from '../utils/output.js';

export function enforceAtomicTasks(tasks = []) {
  const violations = [];
  tasks.forEach(task => {
    if (task.estimateHours && task.estimateHours > 9) {
      violations.push({ task, reason: 'Estimate exceeds 9 hours' });
    }
    if (!task.description || task.description.length < 20) {
      violations.push({ task, reason: 'Task description too vague' });
    }
  });

  if (violations.length) {
    printWarning('⚠️ Atomic task enforcement violations detected:');
    violations.forEach(v => printWarning(`- ${v.reason}`));
  }

  return { ok: violations.length === 0, violations };
}
