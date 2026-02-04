/**
 * PostToolUse Quality Hooks
 * Executes verification checklist after tool operations.
 */

import { AppError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';
import { runVerificationChecklist } from './checklist.js';

function formatFailures(failures) {
  return failures.map(f => `- [${f.step}] ${f.message}`).join('\n');
}

export async function runPostToolUseHooks({
  projectDir = process.cwd(),
  tool = 'unknown',
  mutates = false,
  blockOnFailure = false,
  fast = true,
  context = {}
} = {}) {
  const results = await runVerificationChecklist(projectDir, {
    fast,
    context: { ...context, tool }
  });

  if (results.failures.length > 0) {
    logger.warn(`Quality gates detected ${results.failures.length} failure(s) after ${tool}`);
    logger.debug(formatFailures(results.failures));

    if (blockOnFailure) {
      throw new AppError('Quality gates failed after tool execution', {
        code: 'QUALITY_GATE_FAILED',
        details: results.failures
      });
    }
  } else {
    logger.debug(`Quality gates passed after ${tool}`);
  }

  return results;
}
