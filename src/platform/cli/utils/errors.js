// Copyright (c) 2026 Ultra-Dex

/**
 * Shared error primitives for CLI commands.
 */

function normalizeOptions(optionsOrSuggestions) {
  if (Array.isArray(optionsOrSuggestions)) {
    return { suggestions: optionsOrSuggestions };
  }
  if (optionsOrSuggestions && typeof optionsOrSuggestions === 'object') {
    return optionsOrSuggestions;
  }
  return {};
}

export class AppError extends Error {
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
}

export class ValidationError extends AppError {
  constructor(message, optionsOrSuggestions) {
    const options = normalizeOptions(optionsOrSuggestions);
    super(message, {
      code: 'VALIDATION_ERROR',
      exitCode: 1,
      ...options,
    });
  }
}

export class SecurityError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      code: 'SECURITY_ERROR',
      exitCode: 2,
      ...options,
    });
  }
}

export class NetworkError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      code: 'NETWORK_ERROR',
      exitCode: 1,
      ...options,
    });
  }
}

/**
 * Error handler for errors
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[errors]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
