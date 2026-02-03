import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>[];

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'internal_error',
    details?: Record<string, unknown>[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>[]) {
    super(message, 400, 'validation_error', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'unauthorized');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'not_found');
  }
}

export class RateLimitError extends AppError {
  public retryAfter: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
    super(message, 429, 'rate_limit_exceeded');
    this.retryAfter = retryAfter;
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId;
  
  if (err instanceof AppError) {
    logger.warn({
      requestId,
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack
    }, 'Application error');
    
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
        ...(err instanceof RateLimitError && { retry_after: err.retryAfter })
      }
    });
    return;
  }
  
  // Log unexpected errors
  logger.error({
    requestId,
    error: err.message,
    stack: err.stack
  }, 'Unexpected error');
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({
    error: {
      code: 'internal_error',
      message
    }
  });
};
