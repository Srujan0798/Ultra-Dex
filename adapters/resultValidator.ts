import { ExecutionResult } from './executionAdapter.js';

export class ResultValidator {
  static validate(result: ExecutionResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Status must be one of 4 values
    const validStatuses = ['SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED'];
    if (!validStatuses.includes(result.status)) {
      errors.push(`Invalid status: ${result.status}`);
    }

    // Cost must be present and non-negative
    if (!result.cost) {
      errors.push('cost is required');
    } else {
      if (typeof result.cost.tokens !== 'number' || result.cost.tokens < 0) errors.push('cost.tokens must be >= 0');
      if (typeof result.cost.estimatedUSD !== 'number' || result.cost.estimatedUSD < 0) errors.push('cost.estimatedUSD must be >= 0');
      if (!result.cost.provider) errors.push('cost.provider is required');
    }

    // Confidence must be 0-1
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      errors.push('confidence must be between 0 and 1');
    }

    // Logs must be string array
    if (!Array.isArray(result.logs) || !result.logs.every(l => typeof l === 'string')) {
      errors.push('logs must be string array');
    }

    // Duration must be non-negative
    if (typeof result.duration !== 'number' || result.duration < 0) {
      errors.push('duration must be >= 0');
    }

    // Timestamp must be ISO
    if (typeof result.timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(result.timestamp)) {
      errors.push('timestamp must be ISO 8601');
    }

    // If FAILED, error must be present
    if (result.status === 'FAILED' && !result.error) {
      errors.push('error required when status is FAILED');
    }

    return { valid: errors.length === 0, errors };
  }

  static serialize(result: ExecutionResult): string {
    return JSON.stringify(result);
  }

  static deserialize(json: string): ExecutionResult {
    return JSON.parse(json) as ExecutionResult;
  }
}
