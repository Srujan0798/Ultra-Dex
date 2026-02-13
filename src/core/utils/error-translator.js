/**
 * Error Translation Layer for Ultra-Dex
 * Maps technical errors to human-friendly messages with solutions
 */

import { logger } from './logging.js';

// Common error patterns and their human-readable translations
const ERROR_PATTERNS = {
  // Database errors
  'SQLITE_ERROR: no such table': {
    message: 'Database table not found',
    solution: "💡 Database not initialized. Run 'ultra-dex init' to set up.",
    category: 'database'
  },
  'SQLITE_BUSY: database is locked': {
    message: 'Database is busy',
    solution: '🔒 Another process is using the database. Wait a moment and try again.',
    category: 'database'
  },
  'SQLITE_CONSTRAINT': {
    message: 'Database constraint violation',
    solution: '🚫 Invalid data provided. Check your input format and try again.',
    category: 'database'
  },
  
  // Network errors
  'ECONNREFUSED': {
    message: 'Connection refused',
    solution: '🌐 Service is not responding. Check if the required service is running.',
    category: 'network'
  },
  'ENOTFOUND': {
    message: 'Host not found',
    solution: '🌐 DNS lookup failed. Check your internet connection and host configuration.',
    category: 'network'
  },
  'ETIMEDOUT': {
    message: 'Connection timed out',
    solution: '⏰ Request took too long. Check your network connection and try again.',
    category: 'network'
  },
  
  // File system errors
  'ENOENT': {
    message: 'File or directory not found',
    solution: '📁 Path does not exist. Verify the file path is correct.',
    category: 'filesystem'
  },
  'EACCES': {
    message: 'Permission denied',
    solution: '🔐 Insufficient permissions. Run with appropriate privileges or check file permissions.',
    category: 'filesystem'
  },
  'EPERM': {
    message: 'Operation not permitted',
    solution: '🔐 Permission error. Check file/directory permissions and ownership.',
    category: 'filesystem'
  },
  
  // AI Provider errors
  '401': {
    message: 'Unauthorized access',
    solution: '🔑 Invalid API key. Check your provider configuration with `ultra-dex config --wizard`.',
    category: 'provider'
  },
  '403': {
    message: 'Access forbidden',
    solution: '🔐 Access denied by provider. Verify your API key and permissions.',
    category: 'provider'
  },
  '429': {
    message: 'Rate limit exceeded',
    solution: '⏱️ Too many requests. Wait before trying again or upgrade your provider plan.',
    category: 'provider'
  },
  '500': {
    message: 'Internal server error',
    solution: '🔧 Provider server error. Try again later or contact provider support.',
    category: 'provider'
  },
  
  // Memory errors
  'MEMORY_LIMIT_EXCEEDED': {
    message: 'Memory limit exceeded',
    solution: '💾 Too much data processed at once. Try breaking your task into smaller chunks.',
    category: 'memory'
  },
  
  // Configuration errors
  'CONFIG_NOT_FOUND': {
    message: 'Configuration not found',
    solution: "⚙️ Configuration file missing. Run 'ultra-dex init' to create default configuration.",
    category: 'configuration'
  },
  
  // Agent errors
  'AGENT_UNAVAILABLE': {
    message: 'Agent unavailable',
    solution: '🤖 Requested agent is not available. Check agent status or try a different agent.',
    category: 'agent'
  },
  
  // General errors
  'UNKNOWN_ERROR': {
    message: 'An unexpected error occurred',
    solution: '⚠️ Something went wrong. Check the logs for details and try again.',
    category: 'general'
  }
};

// Additional context-specific error mappings
const CONTEXTUAL_ERRORS = {
  // Specific error contexts that need special handling
  'init': {
    'EACCES': {
      message: 'Cannot create configuration directory',
      solution: '🔐 Permission denied when creating .ultra-dex directory. Check parent directory permissions.',
      category: 'configuration'
    }
  },
  
  'memory': {
    'SQLITE_ERROR': {
      message: 'Memory system error',
      solution: '🧠 Memory system failed to initialize. Run `ultra-dex init` to reset memory system.',
      category: 'memory'
    }
  },
  
  'provider': {
    'MISSING_API_KEY': {
      message: 'API key not configured',
      solution: '🔑 No API key found for provider. Run `ultra-dex config --wizard` to set up providers.',
      category: 'provider'
    }
  }
};

export class ErrorTranslator {
  constructor() {
    this.patterns = ERROR_PATTERNS;
    this.contextualErrors = CONTEXTUAL_ERRORS;
    this.customHandlers = new Map();
  }

  /**
   * Translate a technical error to a human-friendly message
   * @param {Error|string} error - The error to translate
   * @param {string} context - Context where error occurred (optional)
   * @returns {object} Translated error information
   */
  translate(error, context = null) {
    const errorMessage = this.getErrorMessage(error);
    const errorType = this.getErrorType(error);
    
    // Check for custom handlers first
    if (this.customHandlers.has(errorType)) {
      const customHandler = this.customHandlers.get(errorType);
      const result = customHandler(error, context);
      if (result) return result;
    }
    
    // Check contextual errors if context is provided
    if (context && this.contextualErrors[context]) {
      for (const [pattern, translation] of Object.entries(this.contextualErrors[context])) {
        if (errorMessage.includes(pattern) || errorType.includes(pattern)) {
          return this.buildErrorResult(translation, error, errorMessage);
        }
      }
    }
    
    // Check general patterns
    for (const [pattern, translation] of Object.entries(this.patterns)) {
      if (errorMessage.includes(pattern) || errorType.includes(pattern)) {
        return this.buildErrorResult(translation, error, errorMessage);
      }
    }
    
    // If no specific pattern matched, return generic error
    const unknownTranslation = this.patterns.UNKNOWN_ERROR;
    return this.buildErrorResult(unknownTranslation, error, errorMessage);
  }

  /**
   * Get the error message from an error object or string
   * @param {Error|string} error - The error
   * @returns {string} Error message
   */
  getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object') {
      // Handle different error object structures
      return error.message || error.errmsg || error.detail || String(error);
    }
    
    return String(error || 'Unknown error');
  }

  /**
   * Get the error type/name
   * @param {Error|string} error - The error
   * @returns {string} Error type
   */
  getErrorType(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object') {
      return error.name || error.code || 'GenericError';
    }
    
    return 'UnknownError';
  }

  /**
   * Build the error result object
   * @param {object} translation - The translation object
   * @param {Error} originalError - Original error
   * @param {string} errorMessage - Error message
   * @returns {object} Error result
   */
  buildErrorResult(translation, originalError, errorMessage) {
    return {
      originalError,
      originalMessage: errorMessage,
      translatedMessage: translation.message,
      solution: translation.solution,
      category: translation.category,
      suggestedAction: this.extractSuggestedAction(translation.solution),
      documentationLink: this.getDocumentationLink(translation.category)
    };
  }

  /**
   * Extract suggested action from solution text
   * @param {string} solution - Solution text
   * @returns {string} Suggested action
   */
  extractSuggestedAction(solution) {
    // Extract command suggestions from solution
    const commandMatch = solution.match(/'(.*?)'/);
    return commandMatch ? commandMatch[1] : 'Check documentation';
  }

  /**
   * Get documentation link based on error category
   * @param {string} category - Error category
   * @returns {string} Documentation link
   */
  getDocumentationLink(category) {
    const links = {
      'database': 'https://docs.ultradex.ai/troubleshooting/database-errors',
      'network': 'https://docs.ultradex.ai/troubleshooting/network-errors',
      'filesystem': 'https://docs.ultradex.ai/troubleshooting/filesystem-errors',
      'provider': 'https://docs.ultradex.ai/providers/configuration',
      'memory': 'https://docs.ultradex.ai/features/memory-system',
      'configuration': 'https://docs.ultradex.ai/getting-started/configuration',
      'agent': 'https://docs.ultradex.ai/features/agents',
      'general': 'https://docs.ultradex.ai/troubleshooting/common-issues'
    };
    
    return links[category] || 'https://docs.ultradex.ai';
  }

  /**
   * Add a custom error handler
   * @param {string} errorType - Type of error to handle
   * @param {Function} handler - Handler function
   */
  addCustomHandler(errorType, handler) {
    this.customHandlers.set(errorType, handler);
  }

  /**
   * Log a translated error
   * @param {Error|string} error - The error to log
   * @param {string} context - Context where error occurred
   */
  logError(error, context = null) {
    const translated = this.translate(error, context);
    
    logger.error('Ultra-Dex Error', {
      category: translated.category,
      message: translated.translatedMessage,
      solution: translated.solution,
      original: translated.originalMessage,
      context: context
    });
    
    return translated;
  }

  /**
   * Format error for CLI display
   * @param {Error|string} error - The error to format
   * @param {string} context - Context where error occurred
   * @returns {string} Formatted error message
   */
  formatCliError(error, context = null) {
    const translated = this.translate(error, context);
    
    let output = `\n❌ ${translated.translatedMessage}\n`;
    output += `   ${translated.originalMessage}\n\n`;
    output += `💡 ${translated.solution}\n`;
    
    if (translated.documentationLink) {
      output += `📖 Learn more: ${translated.documentationLink}\n`;
    }
    
    return output;
  }

  /**
   * Format error for API response
   * @param {Error|string} error - The error to format
   * @param {string} context - Context where error occurred
   * @returns {object} Formatted error object
   */
  formatApiError(error, context = null) {
    const translated = this.translate(error, context);
    
    return {
      error: {
        type: translated.category,
        message: translated.translatedMessage,
        solution: translated.solution,
        documentation: translated.documentationLink,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
export const errorTranslator = new ErrorTranslator();

// Convenience function for direct use
export const translateError = (error, context = null) => {
  return errorTranslator.translate(error, context);
};

// Export for CLI use
export const formatCliError = (error, context = null) => {
  return errorTranslator.formatCliError(error, context);
};

// Export for API use
export const formatApiError = (error, context = null) => {
  return errorTranslator.formatApiError(error, context);
};