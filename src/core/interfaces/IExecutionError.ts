export type ErrorType =
  | 'timeout'
  | 'provider-error'
  | 'sandbox-error'
  | 'governance-violation'
  | 'invalid-input'
  | 'execution-failed'
  | 'unknown';

export interface IExecutionError {
  type: ErrorType;
  message: string;
  stack?: string;
  code?: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
}
