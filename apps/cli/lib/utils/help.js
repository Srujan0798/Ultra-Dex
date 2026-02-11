// Copyright (c) 2026 Ultra-Dex

/**
 * Styled Help Utilities for Ultra-Dex CLI
 * Provides consistent, visually enhanced help sections across all commands
 */

import chalk from 'chalk';
import boxen from 'boxen';
import { theme } from '../ui/theme.js';

/**
 * Format command usage with styled presentation
 */
export function formatUsage(commandName, options = []) {
  const usage = `ultra-dex ${commandName} ${theme.dim('[options]')}`;

  return boxen(usage, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#000',
  });
}

/**
 * Format command description with styled presentation
 */
export function formatDescription(description) {
  return chalk.cyan.bold(description) + '\n';
}

/**
 * Format command options with styled presentation
 */
export function formatOptions(options) {
  if (!options || options.length === 0) return '';

  let output = chalk.bold('\nOptions:\n');

  options.forEach((option) => {
    const flags = option.flags.padEnd(25);
    output += `  ${theme.primary(flags)} ${theme.dim(option.description)}\n`;
  });

  return output;
}

/**
 * Format command examples with styled presentation
 */
export function formatExamples(examples) {
  if (!examples || examples.length === 0) return '';

  let output = chalk.bold('\nExamples:\n');

  examples.forEach((example) => {
    output += `  ${theme.accent(example.command)} ${theme.dim(example.description)}\n`;
  });

  return output;
}

/**
 * Format command aliases with styled presentation
 */
export function formatAliases(aliases) {
  if (!aliases || aliases.length === 0) return '';

  return chalk.bold('\nAliases: ') + chalk.gray(aliases.join(', ')) + '\n';
}

/**
 * Format command groups with styled presentation
 */
export function formatCommandGroups(groups) {
  if (!groups) return '';

  let output = '';

  for (const [groupName, commands] of Object.entries(groups)) {
    output += chalk.bold(`\n${groupName}:\n`);

    commands.forEach((cmd) => {
      const name = cmd.name.padEnd(20);
      output += `  ${theme.accent(name)} ${theme.dim(cmd.description)}\n`;
    });
  }

  return output;
}

/**
 * Format subcommands for a command
 */
export function formatSubcommands(subcommands) {
  if (!subcommands || subcommands.length === 0) return '';

  let output = chalk.bold('\nSubcommands:\n');

  subcommands.forEach((cmd) => {
    const name = (typeof cmd.name === 'function' ? cmd.name() : cmd.name || '').padEnd(20);
    const desc = typeof cmd.description === 'function' ? cmd.description() : cmd.description || '';
    output += `  ${theme.accent(name)} ${theme.dim(desc)}\n`;
  });

  return output;
}

/**
 * Format a complete help section with all components
 */
export function formatHelpSection(title, content, options = {}) {
  const { padding = 1, margin = 1, borderStyle = 'single', borderColor = 'gray' } = options;

  return boxen(`${chalk.bold(title)}\n${content}`, {
    padding,
    margin,
    borderStyle,
    borderColor,
  });
}

/**
 * Format a warning or caution section
 */
export function formatWarning(message) {
  return boxen(`${chalk.yellow.bold('⚠️  WARNING')}\n${chalk.yellow(message)}`, {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'yellow',
  });
}

/**
 * Format an info section
 */
export function formatInfo(message) {
  return boxen(`${chalk.blue.bold('ℹ️  INFO')}\n${chalk.blue(message)}`, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'blue',
  });
}

/**
 * Format a success section
 */
export function formatSuccess(message) {
  return boxen(`${chalk.green.bold('✅ SUCCESS')}\n${chalk.green(message)}`, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
  });
}

/**
 * Format a tips section
 */
export function formatTips(tips) {
  if (!tips || tips.length === 0) return '';

  let output = chalk.bold('\n💡 Tips:\n');

  tips.forEach((tip, index) => {
    output += `  ${chalk.yellow(`${index + 1}.`)} ${theme.dim(tip)}\n`;
  });

  return output;
}

/**
 * Format a troubleshooting section
 */
export function formatTroubleshooting(troubleshooting) {
  if (!troubleshooting || troubleshooting.length === 0) return '';

  let output = chalk.bold('\n🔧 Troubleshooting:\n');

  troubleshooting.forEach((item, index) => {
    output += `  ${chalk.red(`${index + 1}.`)} ${theme.dim(item.problem)}\n`;
    output += `     ${chalk.gray('Solution:')} ${theme.dim(item.solution)}\n\n`;
  });

  return output;
}

/**
 * Enhanced help formatter that combines all elements
 */
export function createEnhancedHelp(command) {
  let output = '';

  // Usage (always show if name is available)
  if (command.name) {
    output += formatUsage(command.name, command.options) + '\n';
  }

  // Description
  if (command.description) {
    output += formatDescription(command.description) + '\n';
  }

  // Options
  if (command.options && command.options.length > 0) {
    output += formatOptions(command.options) + '\n';
  }

  // Examples
  if (command.examples) {
    output += formatExamples(command.examples) + '\n';
  }

  // Subcommands
  if (command.subcommands && command.subcommands.length > 0) {
    output += formatSubcommands(command.subcommands) + '\n';
  }

  // Aliases
  if (command.aliases) {
    output += formatAliases(command.aliases) + '\n';
  }

  // Tips
  if (command.tips) {
    output += formatTips(command.tips) + '\n';
  }

  // Troubleshooting
  if (command.troubleshooting) {
    output += formatTroubleshooting(command.troubleshooting) + '\n';
  }

  return output;
}

export default {
  formatUsage,
  formatDescription,
  formatOptions,
  formatExamples,
  formatAliases,
  formatCommandGroups,
  formatSubcommands,
  formatHelpSection,
  formatWarning,
  formatInfo,
  formatSuccess,
  formatTips,
  formatTroubleshooting,
  createEnhancedHelp,
};

/**
 * Handle errors in help module
 * @param {Error} error - The error to handle
 * @param {string} [context='help'] - Error context
 */
function handleModuleError(error, context = 'help') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
