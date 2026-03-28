/**
 * Error Translation Layer for Ultra-Dex
 * Maps technical errors to human-friendly messages with solutions
 */

import { logger } from './logging.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from '../../utils/chalk.js';
import { colors, gradients } from '../../../apps/cli/lib/colors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_PATH = path.join(__dirname, 'error-messages.json');

// Common error patterns and their human-readable translations (Fallback)
const DEFAULT_ERROR_PATTERNS = {
  'SQLITE_ERROR: no such table': {
    message: 'Database table not found',
    solution: "💡 Database not initialized. Run 'ultra-dex init' to set up.",
    category: 'database'
  }
};

export class ErrorTranslator {
  constructor() {
    this.patterns = this.loadMessages();
    this.contextualErrors = {};
    this.customHandlers = new Map();
  }

  loadMessages() {
    try {
      if (fs.existsSync(MESSAGES_PATH)) {
        const data = fs.readFileSync(MESSAGES_PATH, 'utf8');
        const json = JSON.parse(data);
        
        // Flatten the nested categories from JSON into a single lookup map
        const flattened = {};
        for (const category of Object.values(json)) {
          for (const [key, val] of Object.entries(category)) {
            // Use the key or part of it as the pattern
            const pattern = key.replace(/_/g, ': ').replace(/([A-Z])/g, ' $1').trim();
            flattened[pattern] = val;
            // Also add the raw key
            flattened[key] = val;
          }
        }
        return { ...DEFAULT_ERROR_PATTERNS, ...flattened };
      }
    } catch (error) {
      console.error('Failed to load error messages JSON:', error.message);
    }
    return DEFAULT_ERROR_PATTERNS;
  }

  /**
   * Translate a technical error to a human-friendly message
   */
  translate(error, context = null) {
    const errorMessage = this.getErrorMessage(error);
    const errorType = this.getErrorType(error);
    
    // Check general patterns
    for (const [pattern, translation] of Object.entries(this.patterns)) {
      if (errorMessage.includes(pattern) || errorType.includes(pattern) || pattern.includes(errorType)) {
        return this.buildErrorResult(translation, error, errorMessage);
      }
    }
    
    // Fallback
    return this.buildErrorResult({
      message: 'An unexpected error occurred',
      solution: '⚠️ Something went wrong. Check the logs for details.',
      category: 'general'
    }, error, errorMessage);
  }

  getErrorMessage(error) {
    if (typeof error === 'string') return error;
    return error?.message || error?.code || String(error || 'Unknown error');
  }

  getErrorType(error) {
    if (typeof error === 'string') return error;
    return error?.name || error?.code || 'GenericError';
  }

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

  extractSuggestedAction(solution) {
    const commandMatch = solution.match(/'(.*?)'/);
    return commandMatch ? commandMatch[1] : null;
  }

  getDocumentationLink(category) {
    return `https://docs.ultradex.ai/troubleshooting/${category}`;
  }

  /**
   * Format error for CLI display with enhanced visual polish
   */
  formatCliError(error, context = null) {
    const translated = this.translate(error, context);
    
    let output = '\n' + gradients.error(' ──────── ERROR ──────── ') + '\n';
    output += ` ${chalk.red.bold('✖')} ${chalk.white.bold(translated.translatedMessage)}\n`;
    output += `   ${chalk.gray(translated.originalMessage)}\n\n`;
    output += ` ${chalk.cyan('💡')} ${chalk.cyan(translated.solution)}\n`;
    
    if (translated.suggestedAction) {
      output += `\n ${chalk.green('➜')}  Suggested command: ${chalk.green.bold(translated.suggestedAction)}\n`;
    }
    
    if (translated.documentationLink) {
      output += ` ${chalk.blue('📖')} More info: ${chalk.blue.underline(translated.documentationLink)}\n`;
    }
    
    output += gradients.error(' ─────────────────────── ') + '\n';
    
    return output;
  }
}

// Export singleton instance
export const errorTranslator = new ErrorTranslator();
export const formatCliError = (error, context = null) => errorTranslator.formatCliError(error, context);
