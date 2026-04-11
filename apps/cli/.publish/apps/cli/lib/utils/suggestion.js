// Copyright (c) 2026 Ultra-Dex

/**
 * Command Suggestion Utilities for Ultra-Dex CLI
 * Provides "Did you mean?" functionality using Levenshtein distance
 */

import chalk from '../../../../src/utils/chalk.js';

/**
 * Calculates the Levenshtein distance between two strings
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function getLevenshteinDistance(a, b) {
  const matrix = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Suggests the closest matching command from a list
 * @param {string} input - The mistyped command
 * @param {string[]} commands - List of available command names
 * @param {number} [threshold=2] - Maximum distance to consider a match
 * @returns {string|null} The suggested command or null
 */
export function suggestCommand(input, commands, threshold = 2) {
  if (!input || !commands || commands.length === 0) return null;

  let minDistance = Infinity;
  let suggestion = null;

  for (const command of commands) {
    const distance = getLevenshteinDistance(input, command);

    // If exact match or within threshold
    if (distance < minDistance && distance <= threshold) {
      minDistance = distance;
      suggestion = command;
    }
  }

  return suggestion;
}

/**
 * Formats a "Did you mean?" message
 * @param {string} suggestion - The suggested command
 * @returns {string} Styled suggestion message
 */
export function formatSuggestion(suggestion) {
  return `\n${chalk.yellow('Did you mean?')} ${chalk.cyan(suggestion)}\n`;
}

export default {
  getLevenshteinDistance,
  suggestCommand,
  formatSuggestion,
};
