// @ts-check
/**
 * Colors utility for Ultra-Dex CLI
 * Provides consistent color schemes and formatting
 */

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m'
};

/**
 * Check if colors should be disabled
 */
const shouldDisableColors = () => {
  return process.env.NO_COLOR || 
         process.env.NODE_ENV === 'test' ||
         !process.stdout.isTTY;
};

/**
 * Apply color if colors are enabled
 */
const colorize = (text, ...codes) => {
  if (shouldDisableColors()) {
    return text;
  }
  const colorCodes = codes.join('');
  return `${colorCodes}${text}${COLORS.reset}`;
};

/**
 * Color utility functions
 */
export const colors = {
  red: (text) => colorize(text, COLORS.red),
  green: (text) => colorize(text, COLORS.green),
  yellow: (text) => colorize(text, COLORS.yellow),
  blue: (text) => colorize(text, COLORS.blue),
  cyan: (text) => colorize(text, COLORS.cyan),
  gray: (text) => colorize(text, COLORS.gray),
  
  bold: (text) => colorize(text, COLORS.bold),
  dim: (text) => colorize(text, COLORS.dim),
  underline: (text) => colorize(text, COLORS.underline),
  
  error: (text) => colorize(text, COLORS.bold, COLORS.brightRed),
  success: (text) => colorize(text, COLORS.bold, COLORS.brightGreen),
  warning: (text) => colorize(text, COLORS.bold, COLORS.brightYellow),
  info: (text) => colorize(text, COLORS.bold, COLORS.brightBlue),
  
  brand: (text) => colorize(text, COLORS.bold, COLORS.brightCyan),
  accent: (text) => colorize(text, COLORS.brightMagenta)
};

export { COLORS, colorize, shouldDisableColors };
