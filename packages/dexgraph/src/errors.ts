/**
 * DexGraph Structured Error System
 * Production-grade error handling with context and actionable messages
 */

// Error categories for structured handling
export enum ErrorCategory {
  SYNTAX = 'SYNTAX_ERROR', // YAML parsing, malformed syntax
  SCHEMA = 'SCHEMA_ERROR', // Invalid fields, missing required
  DEPENDENCY = 'DEPENDENCY_ERROR', // Unknown dependencies, cycles
  VALIDATION = 'VALIDATION_ERROR', // Business rule violations
  RUNTIME = 'RUNTIME_ERROR', // Execution-time failures
  CONFIGURATION = 'CONFIG_ERROR', // Configuration issues
}

// Error severity levels
export enum ErrorSeverity {
  FATAL = 'FATAL', // Cannot proceed, workflow invalid
  ERROR = 'ERROR', // Serious issue but recoverable
  WARNING = 'WARNING', // Non-blocking issue
  INFO = 'INFO', // Informational message
}

// Position information for error location
export interface ErrorPosition {
  filePath: string;
  line: number;
  column: number;
  charOffset?: number;
}

// Base error interface
export interface DexGraphErrorDetails {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  position?: ErrorPosition;
  context?: Record<string, unknown>;
  suggestion?: string;
  code?: string;
}

/**
 * Base error class for all DexGraph errors
 * Provides structured error information for debugging and user feedback
 */
export class DexGraphError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly position?: ErrorPosition;
  public readonly context?: Record<string, unknown>;
  public readonly suggestion?: string;
  public readonly code?: string;

  constructor(details: DexGraphErrorDetails) {
    super(details.message);
    this.name = 'DexGraphError';
    this.category = details.category;
    this.severity = details.severity;
    this.position = details.position;
    this.context = details.context;
    this.suggestion = details.suggestion;
    this.code = details.code;

    // Capture stack trace (V8-specific)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DexGraphError);
    }
  }

  /**
   * Format error for CLI display
   */
  toCLIString(): string {
    const parts: string[] = [];

    if (this.position) {
      parts.push(`File: ${this.position.filePath}`);
      if (this.position.line) {
        parts.push(`Line: ${this.position.line}:${this.position.column || 1}`);
      }
    }

    parts.push(`Category: ${this.category}`);
    parts.push(`Severity: ${this.severity}`);
    parts.push(`Message: ${this.message}`);

    if (this.suggestion) {
      parts.push(`Suggestion: ${this.suggestion}`);
    }

    if (this.code) {
      parts.push(`Error Code: ${this.code}`);
    }

    return parts.join('\n');
  }

  /**
   * Format error for JSON API response
   */
  toJSON(): DexGraphErrorDetails & { name: string; stack?: string } {
    return {
      name: this.name,
      category: this.category,
      severity: this.severity,
      message: this.message,
      position: this.position,
      context: this.context,
      suggestion: this.suggestion,
      code: this.code,
      ...(this.stack ? { stack: this.stack } : {}),
    };
  }
}

// Specialized error classes

/**
 * Syntax errors in workflow files (YAML parsing)
 */
export class SyntaxError extends DexGraphError {
  constructor(message: string, position?: ErrorPosition, context?: Record<string, unknown>) {
    super({
      category: ErrorCategory.SYNTAX,
      severity: ErrorSeverity.FATAL,
      message,
      position,
      context,
      suggestion: 'Check YAML syntax and indentation',
      code: 'SYNTAX_001',
    });
    this.name = 'SyntaxError';
  }
}

/**
 * Schema validation errors
 */
export class SchemaError extends DexGraphError {
  constructor(message: string, position?: ErrorPosition, context?: Record<string, unknown>) {
    super({
      category: ErrorCategory.SCHEMA,
      severity: ErrorSeverity.FATAL,
      message,
      position,
      context,
      suggestion: 'Review the workflow schema documentation',
      code: 'SCHEMA_001',
    });
    this.name = 'SchemaError';
  }
}

/**
 * Dependency-related errors
 */
export class DependencyError extends DexGraphError {
  constructor(message: string, position?: ErrorPosition, context?: Record<string, unknown>) {
    super({
      category: ErrorCategory.DEPENDENCY,
      severity: ErrorSeverity.FATAL,
      message,
      position,
      context,
      suggestion: 'Check task IDs and dependency references',
      code: 'DEPENDENCY_001',
    });
    this.name = 'DependencyError';
  }
}

/**
 * Circular dependency errors
 */
export class CycleError extends DependencyError {
  constructor(cyclePath: string[], position?: ErrorPosition) {
    const pathStr = cyclePath.join(' → ');
    super(`Circular dependency detected: ${pathStr}`, position, { cyclePath });
    this.name = 'CycleError';
    // Note: code and suggestion are set via super constructor
  }
}

/**
 * Validation errors for business rules
 */
export class ValidationError extends DexGraphError {
  constructor(message: string, position?: ErrorPosition, context?: Record<string, unknown>) {
    super({
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
      message,
      position,
      context,
      suggestion: 'Review workflow constraints and requirements',
      code: 'VALIDATION_001',
    });
    this.name = 'ValidationError';
  }
}

/**
 * Runtime execution errors
 */
export class RuntimeError extends DexGraphError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      category: ErrorCategory.RUNTIME,
      severity: ErrorSeverity.ERROR,
      message,
      context,
      suggestion: 'Check task implementation and dependencies',
      code: 'RUNTIME_001',
    });
    this.name = 'RuntimeError';
  }
}

/**
 * Configuration errors
 */
export class ConfigError extends DexGraphError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.FATAL,
      message,
      context,
      suggestion: 'Review configuration files and environment variables',
      code: 'CONFIG_001',
    });
    this.name = 'ConfigError';
  }
}

/**
 * Error builder utility for creating consistent errors
 */
export class ErrorBuilder {
  static syntax(
    message: string,
    position?: ErrorPosition,
    context?: Record<string, unknown>
  ): SyntaxError {
    return new SyntaxError(message, position, context);
  }

  static schema(
    message: string,
    position?: ErrorPosition,
    context?: Record<string, unknown>
  ): SchemaError {
    return new SchemaError(message, position, context);
  }

  static dependency(
    message: string,
    position?: ErrorPosition,
    context?: Record<string, unknown>
  ): DependencyError {
    return new DependencyError(message, position, context);
  }

  static cycle(cyclePath: string[], position?: ErrorPosition): CycleError {
    return new CycleError(cyclePath, position);
  }

  static validation(
    message: string,
    position?: ErrorPosition,
    context?: Record<string, unknown>
  ): ValidationError {
    return new ValidationError(message, position, context);
  }

  static runtime(message: string, context?: Record<string, unknown>): RuntimeError {
    return new RuntimeError(message, context);
  }

  static config(message: string, context?: Record<string, unknown>): ConfigError {
    return new ConfigError(message, context);
  }

  /**
   * Create error position from YAML parsing information
   */
  static positionFromYAML(
    filePath: string,
    line: number,
    column: number,
    charOffset?: number
  ): ErrorPosition {
    return { filePath, line, column, charOffset };
  }
}

/**
 * Aggregate multiple errors into a single report
 */
export class AggregateError extends DexGraphError {
  public readonly errors: DexGraphError[];

  constructor(errors: DexGraphError[], message = 'Multiple errors occurred') {
    super({
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.FATAL,
      message,
      context: { errorCount: errors.length },
      suggestion: 'Fix all listed errors below',
      code: 'AGGREGATE_001',
    });
    this.name = 'AggregateError';
    this.errors = errors;
  }

  /**
   * Get all error messages as a single string
   */
  getCombinedMessage(): string {
    return this.errors.map((err, idx) => `Error ${idx + 1}: ${err.message}`).join('\n');
  }

  /**
   * Filter errors by category
   */
  filterByCategory(category: ErrorCategory): DexGraphError[] {
    return this.errors.filter((err) => err.category === category);
  }

  /**
   * Filter errors by severity
   */
  filterBySeverity(severity: ErrorSeverity): DexGraphError[] {
    return this.errors.filter((err) => err.severity === severity);
  }
}

/**
 * Error reporter for collecting and reporting multiple errors
 */
export class ErrorReporter {
  private errors: DexGraphError[] = [];

  /**
   * Add an error to the reporter
   */
  report(error: DexGraphError): void {
    this.errors.push(error);
  }

  /**
   * Add multiple errors
   */
  reportAll(errors: DexGraphError[]): void {
    this.errors.push(...errors);
  }

  /**
   * Check if any errors have been reported
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get all reported errors
   */
  getErrors(): DexGraphError[] {
    return [...this.errors];
  }

  /**
   * Clear all reported errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Throw if any errors have been reported
   */
  throwIfAny(): void {
    if (this.errors.length === 0) return;

    if (this.errors.length === 1) {
      throw this.errors[0];
    }

    throw new AggregateError(this.errors);
  }

  /**
   * Get errors grouped by category
   */
  getErrorsByCategory(): Record<ErrorCategory, DexGraphError[]> {
    const result: Record<ErrorCategory, DexGraphError[]> = {
      [ErrorCategory.SYNTAX]: [],
      [ErrorCategory.SCHEMA]: [],
      [ErrorCategory.DEPENDENCY]: [],
      [ErrorCategory.VALIDATION]: [],
      [ErrorCategory.RUNTIME]: [],
      [ErrorCategory.CONFIGURATION]: [],
    };

    for (const error of this.errors) {
      result[error.category].push(error);
    }

    return result;
  }

  /**
   * Get total error count
   */
  get count(): number {
    return this.errors.length;
  }
}

// Export error utilities
export const errors = {
  builder: ErrorBuilder,
  reporter: new ErrorReporter(),
};
