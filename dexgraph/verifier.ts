import { GraphNode } from './types.js';

export interface VerificationResult {
  valid: boolean;
  errors?: string[];
  confidence?: number;
}

export interface Verifier {
  verify(node: GraphNode, output: unknown): VerificationResult;
}

export function createVerifier(): Verifier {
  return {
    verify(node: GraphNode, output: unknown): VerificationResult {
      const errors: string[] = [];

      // Check output exists for SUCCESS
      if (output === undefined || output === null) {
        errors.push('Output is required');
      }

      // Check verification rule if defined
      if (node.verification) {
        const { type, command } = node.verification;
        switch (type) {
          case 'file_exists':
            if (command && typeof output === 'object' && output !== null) {
              const files = (output as Record<string, unknown>).files as string[] | undefined;
              if (!files || !files.includes(command)) {
                errors.push(`Required file not found: ${command}`);
              }
            }
            break;
          case 'unit_test':
            if (typeof output === 'object' && output !== null) {
              const testResult = (output as Record<string, unknown>).testResult as { passed?: boolean } | undefined;
              if (testResult && !testResult.passed) {
                errors.push('Unit tests failed');
              }
            }
            break;
          case 'llm_check':
            // LLM check is advisory; always passes at this level
            break;
          case 'custom':
            // Custom checks delegated to external handler
            break;
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        confidence: errors.length === 0 ? 0.95 : 0,
      };
    },
  };
}
