var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (
  decorators: Function[],
  target: object,
  key: PropertyKey = '',
  kind: number = 0
) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (
        kind
          ? (decorator as (value: object, propertyKey: PropertyKey, descriptor?: unknown) => unknown)(
              target,
              key,
              result
            )
          : (decorator as (value: object) => unknown)(result as object)
      ) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { logger } from './logging.js';

interface ErrorOptions {
  code?: string;
  exitCode?: number;
  cause?: unknown;
  details?: Record<string, unknown>;
  suggestions?: string[];
}

function normalizeOptions(optionsOrSuggestions?: ErrorOptions | string[]): ErrorOptions {
  if (Array.isArray(optionsOrSuggestions)) {
    return { suggestions: optionsOrSuggestions };
  }
  if (optionsOrSuggestions && typeof optionsOrSuggestions === 'object') {
    return optionsOrSuggestions;
  }
  return {};
}
let AppError = class extends Error {
  code: string;
  exitCode: number;
  override cause: unknown;
  details?: Record<string, unknown>;
  suggestions?: string[];

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    const { code = 'APP_ERROR', exitCode = 1, cause, details, suggestions } = options;
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    this.cause = cause;
    this.details = details;
    this.suggestions = suggestions;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
AppError = __decorateClass([singleton()], AppError) as typeof AppError;
let ValidationError = class extends AppError {
  constructor(message: string, optionsOrSuggestions?: ErrorOptions | string[]) {
    const options = normalizeOptions(optionsOrSuggestions);
    super(message, {
      code: 'VALIDATION_ERROR',
      exitCode: 1,
      ...options,
    });
  }
};
ValidationError = __decorateClass([singleton()], ValidationError) as typeof ValidationError;
let SecurityError = class extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: 'SECURITY_ERROR',
      exitCode: 2,
      ...options,
    });
  }
};
SecurityError = __decorateClass([singleton()], SecurityError) as typeof SecurityError;
let NetworkError = class extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: 'NETWORK_ERROR',
      exitCode: 1,
      ...options,
    });
  }
};
NetworkError = __decorateClass([singleton()], NetworkError) as typeof NetworkError;
function _handleError(error: unknown): void {
  try {
    logger.error('[errors]', error instanceof Error ? error.message : String(error));
  } catch (_) {}
}
export { AppError, NetworkError, SecurityError, ValidationError };
