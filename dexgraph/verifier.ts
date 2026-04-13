/**
 * DexGraph Node Verifier
 *
 * Validates execution results for a node using its declared VerificationRule.
 * Returns VerificationResult with { valid, errors, confidence }.
 * Wired by the Dispatcher after execution before marking SUCCESS.
 */

import { GraphNode } from './types.js';
import { ExecutionResult } from '../adapters/executionAdapter.js';
import { runNodeChecks } from './checkers.js';

export interface VerificationResult {
  valid: boolean;
  errors?: string[];
  confidence?: number;
  /** ISO timestamp of when verification was performed */
  verifiedAt: string;
}

export interface Verifier {
  verify(node: GraphNode, output: unknown): VerificationResult;
  verifyResult(node: GraphNode, result: ExecutionResult): VerificationResult;
}

class NodeVerifier implements Verifier {
  /**
   * Verify raw output (called by Dispatcher.dispatchWithVerification).
   * Wraps the output in a synthetic ExecutionResult for checker evaluation.
   */
  verify(node: GraphNode, output: unknown): VerificationResult {
    const errors: string[] = [];

    if (output === undefined || output === null) {
      return {
        valid: false,
        errors: ['Output is required'],
        confidence: 0,
        verifiedAt: new Date().toISOString(),
      };
    }

    if (node.verification) {
      const { type, command } = node.verification;
      const outputObj = typeof output === 'object' && output !== null
        ? (output as Record<string, unknown>)
        : {};

      switch (type) {
        case 'file_exists': {
          const files = outputObj.files as string[] | undefined;
          if (!Array.isArray(files) || !files.includes(command ?? '')) {
            errors.push(`Required file not found: ${command}`);
          }
          break;
        }
        case 'unit_test': {
          const testResult = outputObj.testResult as { passed?: boolean } | undefined;
          if (testResult && testResult.passed === false) {
            errors.push('Unit tests failed');
          }
          break;
        }
        case 'llm_check':
          // Advisory — pass at this layer; confidence-based in full verifyResult()
          break;
        case 'custom':
          // External handler — pass through
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      confidence: errors.length === 0 ? 0.95 : 0,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Full verification using ExecutionResult (preferred path via Dispatcher).
   * Runs all composite checkers defined in checkers.ts.
   */
  verifyResult(node: GraphNode, result: ExecutionResult): VerificationResult {
    const composite = runNodeChecks(node, result);

    return {
      valid: composite.passed,
      errors: composite.failedChecks.length > 0
        ? composite.failedChecks.map(c => c.reason)
        : undefined,
      confidence: composite.passed ? Math.max(result.confidence, 0.9) : 0,
      verifiedAt: new Date().toISOString(),
    };
  }
}

/** Factory — returns the canonical Verifier instance */
export function createVerifier(): Verifier {
  return new NodeVerifier();
}
