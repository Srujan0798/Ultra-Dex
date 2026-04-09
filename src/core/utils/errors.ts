var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { logger } from './logging.js';
function normalizeOptions(optionsOrSuggestions) {
  if (Array.isArray(optionsOrSuggestions)) {
    return { suggestions: optionsOrSuggestions };
  }
  if (optionsOrSuggestions && typeof optionsOrSuggestions === 'object') {
    return optionsOrSuggestions;
  }
  return {};
}
let AppError = class extends Error {
  constructor(message, options = {}) {
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
AppError = __decorateClass([singleton()], AppError);
let ValidationError = class extends AppError {
  constructor(message, optionsOrSuggestions) {
    const options = normalizeOptions(optionsOrSuggestions);
    super(message, {
      code: 'VALIDATION_ERROR',
      exitCode: 1,
      ...options,
    });
  }
};
ValidationError = __decorateClass([singleton()], ValidationError);
let SecurityError = class extends AppError {
  constructor(message, options = {}) {
    super(message, {
      code: 'SECURITY_ERROR',
      exitCode: 2,
      ...options,
    });
  }
};
SecurityError = __decorateClass([singleton()], SecurityError);
let NetworkError = class extends AppError {
  constructor(message, options = {}) {
    super(message, {
      code: 'NETWORK_ERROR',
      exitCode: 1,
      ...options,
    });
  }
};
NetworkError = __decorateClass([singleton()], NetworkError);
function _handleError(error) {
  try {
    logger.error('[errors]', error instanceof Error ? error.message : String(error));
  } catch (_) {}
}
export { AppError, NetworkError, SecurityError, ValidationError };
