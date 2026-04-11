// Type declarations for error handler

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT_ERROR';

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface ErrorHandler {
  createError(code: ErrorCode, message: string, details?: Record<string, unknown>): AppError;
  handleError(error: Error | AppError): { code: ErrorCode; message: string; statusCode: number };
}

export const errorHandler: ErrorHandler;
export default errorHandler;
