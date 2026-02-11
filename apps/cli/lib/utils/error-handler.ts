// Copyright (c) 2026 Ultra-Dex
/**
 * Enterprise Error Handler
 * Comprehensive error handling with recovery strategies
 *
 * @module utils/error-handler
 */

import chalk from 'chalk';
import { auditLogger } from '../services/audit/audit-logger.js';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error category
 */
export type ErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'external_service'
  | 'internal'
  | 'timeout'
  | 'unknown';

/**
 * Enterprise error interface
 */
export interface EnterpriseError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  details?: Record<string, any>;
  stack?: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  recoveryStrategy?: string;
}

/**
 * Error recovery strategy
 */
export interface RecoveryStrategy {
  name: string;
  description: string;
  execute: (error: EnterpriseError) => Promise<boolean>;
}

/**
 * Predefined recovery strategies
 */
export const RecoveryStrategies: Record<string, RecoveryStrategy> = {
  retry: {
    name: 'retry',
    description: 'Retry the operation with exponential backoff',
    execute: async (error) => {
      console.log(chalk.yellow(`↻ Retrying operation after error: ${error.code}`));
      // Implementation would retry the original operation
      return true;
    },
  },
  fallback: {
    name: 'fallback',
    description: 'Use fallback data or service',
    execute: async (error) => {
      console.log(chalk.yellow(`⇄ Using fallback for: ${error.code}`));
      // Implementation would use cached data or alternative service
      return true;
    },
  },
  degrade: {
    name: 'degrade',
    description: 'Degrade functionality gracefully',
    execute: async (error) => {
      console.log(chalk.yellow(`↓ Degrading functionality for: ${error.code}`));
      // Implementation would disable non-essential features
      return true;
    },
  },
  alert: {
    name: 'alert',
    description: 'Alert administrators',
    execute: async (error) => {
      console.error(chalk.red(`🚨 CRITICAL: Alerting administrators for: ${error.code}`));
      // Implementation would send alerts to ops team
      await auditLogger.logSecurityAlert('CRITICAL_ERROR', 'critical', {
        errorCode: error.code,
        errorMessage: error.message,
        userId: error.userId,
      });
      return true;
    },
  },
};

/**
 * Error codes mapping
 */
export const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: { code: 'VAL_001', category: 'validation', severity: 'low' },
  INVALID_INPUT: { code: 'VAL_002', category: 'validation', severity: 'low' },
  MISSING_REQUIRED_FIELD: { code: 'VAL_003', category: 'validation', severity: 'low' },

  // Authentication errors (401)
  UNAUTHORIZED: { code: 'AUTH_001', category: 'authentication', severity: 'high' },
  INVALID_TOKEN: { code: 'AUTH_002', category: 'authentication', severity: 'high' },
  TOKEN_EXPIRED: { code: 'AUTH_003', category: 'authentication', severity: 'medium' },

  // Authorization errors (403)
  FORBIDDEN: { code: 'FORBIDDEN_001', category: 'authorization', severity: 'high' },
  INSUFFICIENT_PERMISSIONS: { code: 'FORBIDDEN_002', category: 'authorization', severity: 'high' },

  // Not found errors (404)
  RESOURCE_NOT_FOUND: { code: 'NOT_FOUND_001', category: 'not_found', severity: 'medium' },
  USER_NOT_FOUND: { code: 'NOT_FOUND_002', category: 'not_found', severity: 'medium' },
  PROJECT_NOT_FOUND: { code: 'NOT_FOUND_003', category: 'not_found', severity: 'medium' },

  // Conflict errors (409)
  RESOURCE_EXISTS: { code: 'CONFLICT_001', category: 'conflict', severity: 'medium' },
  DUPLICATE_ENTRY: { code: 'CONFLICT_002', category: 'conflict', severity: 'medium' },

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: { code: 'RATE_001', category: 'rate_limit', severity: 'medium' },

  // External service errors
  EXTERNAL_SERVICE_ERROR: { code: 'EXT_001', category: 'external_service', severity: 'high' },
  AI_PROVIDER_ERROR: { code: 'EXT_002', category: 'external_service', severity: 'high' },
  DATABASE_ERROR: { code: 'EXT_003', category: 'external_service', severity: 'critical' },

  // Internal errors (500)
  INTERNAL_ERROR: { code: 'INT_001', category: 'internal', severity: 'critical' },
  NOT_IMPLEMENTED: { code: 'INT_002', category: 'internal', severity: 'medium' },

  // Timeout errors
  REQUEST_TIMEOUT: { code: 'TIMEOUT_001', category: 'timeout', severity: 'medium' },
  OPERATION_TIMEOUT: { code: 'TIMEOUT_002', category: 'timeout', severity: 'medium' },
};

/**
 * Enterprise Error Handler class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: EnterpriseError[] = [];
  private maxLogSize: number = 1000;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create enterprise error
   */
  createError(
    errorKey: keyof typeof ErrorCodes,
    message?: string,
    details?: Record<string, any>,
    userId?: string
  ): EnterpriseError {
    const errorDef = ErrorCodes[errorKey];

    const error: EnterpriseError = {
      code: errorDef.code,
      message: message || this.getDefaultMessage(errorKey),
      category: errorDef.category,
      severity: errorDef.severity,
      details,
      timestamp: new Date(),
      userId,
      recoveryStrategy: this.suggestRecoveryStrategy(errorDef.category, errorDef.severity),
    };

    return error;
  }

  /**
   * Get default error message
   */
  private getDefaultMessage(errorKey: string): string {
    const messages: Record<string, string> = {
      VALIDATION_ERROR: 'The provided data is invalid.',
      INVALID_INPUT: 'Invalid input provided.',
      UNAUTHORIZED: 'You are not authorized to perform this action.',
      FORBIDDEN: 'Access to this resource is forbidden.',
      RESOURCE_NOT_FOUND: 'The requested resource was not found.',
      INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
      EXTERNAL_SERVICE_ERROR: 'External service error. Please try again later.',
    };

    return messages[errorKey] || 'An error occurred.';
  }

  /**
   * Suggest recovery strategy
   */
  private suggestRecoveryStrategy(category: ErrorCategory, severity: ErrorSeverity): string {
    if (severity === 'critical') {
      return 'alert';
    }

    if (category === 'external_service' || category === 'timeout') {
      return 'retry';
    }

    if (category === 'internal') {
      return 'degrade';
    }

    return 'fallback';
  }

  /**
   * Handle error with recovery
   */
  async handleError(
    error: Error | EnterpriseError,
    context?: { userId?: string; requestId?: string }
  ): Promise<{ success: boolean; error: EnterpriseError; recovered: boolean }> {
    // Convert to EnterpriseError if needed
    let enterpriseError: EnterpriseError;

    if ('code' in error && 'category' in error) {
      enterpriseError = error as EnterpriseError;
    } else {
      enterpriseError = this.wrapError(error, context);
    }

    // Add context
    if (context) {
      enterpriseError.userId = context.userId;
      enterpriseError.requestId = context.requestId;
    }

    // Log error
    this.logError(enterpriseError);

    // Attempt recovery
    let recovered = false;
    if (enterpriseError.recoveryStrategy) {
      const strategy = RecoveryStrategies[enterpriseError.recoveryStrategy];
      if (strategy) {
        try {
          recovered = await strategy.execute(enterpriseError);
        } catch (recoveryError) {
          console.error('Recovery strategy failed:', recoveryError);
        }
      }
    }

    // Log to audit system for high/critical severity
    if (enterpriseError.severity === 'high' || enterpriseError.severity === 'critical') {
      await auditLogger.log({
        type: 'security.alert',
        severity: enterpriseError.severity === 'critical' ? 'critical' : 'error',
        userId: enterpriseError.userId,
        action: `ERROR_${enterpriseError.code}`,
        resource: 'error-handling',
        resourceId: enterpriseError.code,
        details: {
          category: enterpriseError.category,
          message: enterpriseError.message,
          recovered,
        },
      });
    }

    return {
      success: false,
      error: enterpriseError,
      recovered,
    };
  }

  /**
   * Wrap standard error to EnterpriseError
   */
  private wrapError(error: Error, context?: { userId?: string }): EnterpriseError {
    // Determine category based on error type
    let category: ErrorCategory = 'unknown';
    let severity: ErrorSeverity = 'medium';

    if (error.name === 'ValidationError') {
      category = 'validation';
      severity = 'low';
    } else if (error.name === 'UnauthorizedError') {
      category = 'authentication';
      severity = 'high';
    } else if (error.name === 'TimeoutError') {
      category = 'timeout';
      severity = 'medium';
    }

    return {
      code: 'UNKNOWN_001',
      message: error.message,
      category,
      severity,
      stack: error.stack,
      timestamp: new Date(),
      userId: context?.userId,
      details: { originalError: error.name },
    };
  }

  /**
   * Log error
   */
  private logError(error: EnterpriseError): void {
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console output based on severity
    const timestamp = error.timestamp.toISOString();
    const prefix = `[${timestamp}] [${error.severity.toUpperCase()}] [${error.code}]`;

    switch (error.severity) {
      case 'critical':
        console.error(chalk.red(`${prefix} ${error.message}`));
        break;
      case 'high':
        console.error(chalk.red(`${prefix} ${error.message}`));
        break;
      case 'medium':
        console.warn(chalk.yellow(`${prefix} ${error.message}`));
        break;
      case 'low':
        console.log(chalk.gray(`${prefix} ${error.message}`));
        break;
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): EnterpriseError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const error of this.errorLog) {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    }

    return {
      total: this.errorLog.length,
      byCategory,
      bySeverity,
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
export default errorHandler;
