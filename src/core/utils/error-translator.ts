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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from '../../utils/chalk.js';
import { gradients } from '../../utils/colors.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_PATH = path.join(__dirname, 'error-messages.json');
const DEFAULT_ERROR_PATTERNS = {
  'SQLITE_ERROR: no such table': {
    message: 'Database table not found',
    solution: "\u{1F4A1} Database not initialized. Run 'ultra-dex init' to set up.",
    category: 'database',
  },
};
let ErrorTranslator = class {
  constructor() {
    this.patterns = this.loadMessages();
    this.contextualErrors = {};
    this.customHandlers = /* @__PURE__ */ new Map();
  }
  loadMessages() {
    try {
      if (fs.existsSync(MESSAGES_PATH)) {
        const data = fs.readFileSync(MESSAGES_PATH, 'utf8');
        const json = JSON.parse(data);
        const flattened = {};
        for (const category of Object.values(json)) {
          for (const [key, val] of Object.entries(category)) {
            const pattern = key
              .replace(/_/g, ': ')
              .replace(/([A-Z])/g, ' $1')
              .trim();
            flattened[pattern] = val;
            flattened[key] = val;
          }
        }
        return { ...DEFAULT_ERROR_PATTERNS, ...flattened };
      }
    } catch (error) {
      logger.error('Failed to load error messages JSON:', error.message);
    }
    return DEFAULT_ERROR_PATTERNS;
  }
  /**
   * Translate a technical error to a human-friendly message
   */
  translate(error, context = null) {
    const errorMessage = this.getErrorMessage(error);
    const errorType = this.getErrorType(error);
    for (const [pattern, translation] of Object.entries(this.patterns)) {
      if (
        errorMessage.includes(pattern) ||
        errorType.includes(pattern) ||
        pattern.includes(errorType)
      ) {
        return this.buildErrorResult(translation, error, errorMessage);
      }
    }
    return this.buildErrorResult(
      {
        message: 'An unexpected error occurred',
        solution: '\u26A0\uFE0F Something went wrong. Check the logs for details.',
        category: 'general',
      },
      error,
      errorMessage
    );
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
      documentationLink: this.getDocumentationLink(translation.category),
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
    let output =
      '\n' +
      gradients.error(
        ' \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 ERROR \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 '
      ) +
      '\n';
    output += ` ${chalk.red.bold('\u2716')} ${chalk.white.bold(translated.translatedMessage)}
`;
    output += `   ${chalk.gray(translated.originalMessage)}

`;
    output += ` ${chalk.cyan('\u{1F4A1}')} ${chalk.cyan(translated.solution)}
`;
    if (translated.suggestedAction) {
      output += `
 ${chalk.green('\u279C')}  Suggested command: ${chalk.green.bold(translated.suggestedAction)}
`;
    }
    if (translated.documentationLink) {
      output += ` ${chalk.blue('\u{1F4D6}')} More info: ${chalk.blue.underline(translated.documentationLink)}
`;
    }
    output +=
      gradients.error(
        ' \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 '
      ) + '\n';
    return output;
  }
};
ErrorTranslator = __decorateClass([singleton()], ErrorTranslator);
const errorTranslator = new ErrorTranslator();
const formatCliError = (error, context = null) => errorTranslator.formatCliError(error, context);
export { ErrorTranslator, errorTranslator, formatCliError };
