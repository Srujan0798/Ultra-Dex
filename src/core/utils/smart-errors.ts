/**
 * Smart Error Utility
 * Provides rich error context and retry logic for AI operations
 */

export interface ErrorContext {
  userId?: string;
  operation?: string;
  provider?: string;
  model?: string;
  [key: string]: unknown;
}

export class SmartError extends Error {
  public code: string;
  public context: ErrorContext;
  public suggestion?: string;
  public isRetryable: boolean;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    context: ErrorContext = {},
    suggestion?: string,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'SmartError';
    this.code = code;
    this.context = context;
    this.suggestion = suggestion;
    this.isRetryable = isRetryable;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SmartError);
    }
  }

  /**
   * Formats error for user-facing output
   */
  format(): string {
    let msg = `[${this.code}] ${this.message}`;
    if (this.suggestion) {
      msg += `\nSuggestion: ${this.suggestion}`;
    }
    return msg;
  }
}

/**
 * Utility function to wrap standard errors into SmartErrors
 */
export function formatError(error: unknown): string {
  if (error instanceof SmartError) return error.format();
  if (error instanceof Error) return `[ERROR] ${error.message}`;
  return `[ERROR] ${String(error)}`;
}

/**
 * Determines if an error is transient and should be retried
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof SmartError) return error.isRetryable;

  const errorMessage = String(error).toLowerCase();
  const retryableMessages = [
    'rate limit',
    'timeout',
    'overloaded',
    '503',
    '504',
    '429',
    'connection error',
    'network error',
  ];

  return retryableMessages.some((m) => errorMessage.includes(m));
}
