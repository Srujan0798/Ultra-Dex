/**
 * DexGraph Execution Checkers
 *
 * Pure functions that verify execution outcomes at node level.
 * Each checker returns { passed: boolean; reason: string }.
 * Used by the Verifier to determine node SUCCESS vs FAILED.
 */

import { GraphNode } from './types.js';
import { ExecutionResult } from '../adapters/executionAdapter.js';

export interface CheckResult {
  passed: boolean;
  reason: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Core checkers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Verify that execution completed without an error status.
 */
export function checkExecutionSuccess(result: ExecutionResult): CheckResult {
  if (result.status !== 'SUCCESS') {
    return {
      passed: false,
      reason: `Execution status is "${result.status}"${result.error ? `: ${result.error}` : ''}`,
    };
  }
  return { passed: true, reason: 'Execution completed successfully' };
}

/**
 * Verify that the result has a non-null, non-undefined output.
 */
export function checkOutputExists(result: ExecutionResult): CheckResult {
  if (result.output === undefined || result.output === null) {
    return { passed: false, reason: 'Output is missing (null or undefined)' };
  }
  return { passed: true, reason: 'Output is present' };
}

/**
 * Verify that a specific field exists in the output.
 */
export function checkOutputField(result: ExecutionResult, field: string): CheckResult {
  const output = result.output as Record<string, unknown> | null | undefined;
  if (output === null || output === undefined || typeof output !== 'object') {
    return { passed: false, reason: `Output is not an object; cannot check field "${field}"` };
  }
  if (!(field in output)) {
    return { passed: false, reason: `Required field "${field}" not found in output` };
  }
  if (output[field] === undefined || output[field] === null) {
    return { passed: false, reason: `Required field "${field}" is null or undefined` };
  }
  return { passed: true, reason: `Field "${field}" is present in output` };
}

/**
 * Verify that a file path is listed in the output's `files` array.
 * (Used for file_exists verification type.)
 */
export function checkFileExists(result: ExecutionResult, filePath: string): CheckResult {
  const output = result.output as Record<string, unknown> | null | undefined;
  if (!output || typeof output !== 'object') {
    return { passed: false, reason: 'Output is not an object; cannot check file list' };
  }
  const files = output.files as string[] | undefined;
  if (!Array.isArray(files)) {
    return { passed: false, reason: 'Output.files is not an array' };
  }
  if (!files.includes(filePath)) {
    return { passed: false, reason: `Required file "${filePath}" not found in output.files` };
  }
  return { passed: true, reason: `File "${filePath}" is present` };
}

/**
 * Verify that unit tests passed according to the output's `testResult` field.
 */
export function checkTestsPassed(result: ExecutionResult): CheckResult {
  const output = result.output as Record<string, unknown> | null | undefined;
  if (!output || typeof output !== 'object') {
    return { passed: false, reason: 'Output is not an object; cannot check test result' };
  }
  const testResult = output.testResult as { passed?: boolean; total?: number; failed?: number } | undefined;
  if (!testResult) {
    return { passed: false, reason: 'Output.testResult is missing' };
  }
  if (testResult.passed === false || testResult.failed) {
    return {
      passed: false,
      reason: `Tests failed${testResult.failed ? ` (${testResult.failed} failed)` : ''}`,
    };
  }
  return { passed: true, reason: 'All tests passed' };
}

/**
 * Verify that execution confidence meets the minimum threshold.
 */
export function checkConfidence(result: ExecutionResult, minConfidence: number): CheckResult {
  if (result.confidence < minConfidence) {
    return {
      passed: false,
      reason: `Confidence ${result.confidence.toFixed(2)} is below minimum ${minConfidence.toFixed(2)}`,
    };
  }
  return {
    passed: true,
    reason: `Confidence ${result.confidence.toFixed(2)} meets threshold`,
  };
}

/**
 * Verify execution duration was within acceptable bounds.
 */
export function checkDuration(result: ExecutionResult, maxMs: number): CheckResult {
  if (result.duration > maxMs) {
    return {
      passed: false,
      reason: `Duration ${result.duration}ms exceeded maximum ${maxMs}ms`,
    };
  }
  return { passed: true, reason: `Duration ${result.duration}ms is within limit` };
}

// ──────────────────────────────────────────────────────────────────────────────
// Composite checker — runs all applicable checks for a node
// ──────────────────────────────────────────────────────────────────────────────

export interface CompositeCheckResult {
  passed: boolean;
  checks: CheckResult[];
  failedChecks: CheckResult[];
}

export function runNodeChecks(node: GraphNode, result: ExecutionResult): CompositeCheckResult {
  const checks: CheckResult[] = [];

  // Always check execution success
  checks.push(checkExecutionSuccess(result));

  if (node.verification) {
    const { type, command } = node.verification;

    switch (type) {
      case 'file_exists':
        if (command) {
          checks.push(checkFileExists(result, command));
        }
        break;

      case 'unit_test':
        checks.push(checkTestsPassed(result));
        break;

      case 'llm_check':
        // LLM checks are advisory at this layer; confidence threshold applied
        checks.push(checkConfidence(result, 0.7));
        break;

      case 'custom':
        // Custom checks are delegated; output existence is the minimum gate
        checks.push(checkOutputExists(result));
        break;
    }
  }

  const failedChecks = checks.filter(c => !c.passed);
  return {
    passed: failedChecks.length === 0,
    checks,
    failedChecks,
  };
}
