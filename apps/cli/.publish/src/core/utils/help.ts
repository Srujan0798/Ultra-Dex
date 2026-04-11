import chalk from 'chalk';
import boxen from 'boxen';
import { theme } from '../ui/theme.js';
import { logger } from './logging.js';
function formatUsage(commandName, options = []) {
  const usage = `ultra-dex ${commandName} ${theme.dim('[options]')}`;
  return boxen(usage, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#000',
  });
}
function formatDescription(description) {
  return chalk.cyan.bold(description) + '\n';
}
function formatOptions(options) {
  if (!options || options.length === 0) return '';
  let output = chalk.bold('\nOptions:\n');
  options.forEach((option) => {
    const flags = option.flags.padEnd(25);
    output += `  ${theme.primary(flags)} ${theme.dim(option.description)}
`;
  });
  return output;
}
function formatExamples(examples) {
  if (!examples || examples.length === 0) return '';
  let output = chalk.bold('\nExamples:\n');
  examples.forEach((example) => {
    output += `  ${theme.accent(example.command)} ${theme.dim(example.description)}
`;
  });
  return output;
}
function formatAliases(aliases) {
  if (!aliases || aliases.length === 0) return '';
  return chalk.bold('\nAliases: ') + chalk.gray(aliases.join(', ')) + '\n';
}
function formatCommandGroups(groups) {
  if (!groups) return '';
  let output = '';
  for (const [groupName, commands] of Object.entries(groups)) {
    output += chalk.bold(`
${groupName}:
`);
    commands.forEach((cmd) => {
      const name = cmd.name.padEnd(20);
      output += `  ${theme.accent(name)} ${theme.dim(cmd.description)}
`;
    });
  }
  return output;
}
function formatSubcommands(subcommands) {
  if (!subcommands || subcommands.length === 0) return '';
  let output = chalk.bold('\nSubcommands:\n');
  subcommands.forEach((cmd) => {
    const name = (typeof cmd.name === 'function' ? cmd.name() : cmd.name || '').padEnd(20);
    const desc = typeof cmd.description === 'function' ? cmd.description() : cmd.description || '';
    output += `  ${theme.accent(name)} ${theme.dim(desc)}
`;
  });
  return output;
}
function formatHelpSection(title, content, options = {}) {
  const { padding = 1, margin = 1, borderStyle = 'single', borderColor = 'gray' } = options;
  return boxen(
    `${chalk.bold(title)}
${content}`,
    {
      padding,
      margin,
      borderStyle,
      borderColor,
    }
  );
}
function formatWarning(message) {
  return boxen(
    `${chalk.yellow.bold('\u26A0\uFE0F  WARNING')}
${chalk.yellow(message)}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'yellow',
    }
  );
}
function formatInfo(message) {
  return boxen(
    `${chalk.blue.bold('\u2139\uFE0F  INFO')}
${chalk.blue(message)}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue',
    }
  );
}
function formatSuccess(message) {
  return boxen(
    `${chalk.green.bold('\u2705 SUCCESS')}
${chalk.green(message)}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
    }
  );
}
function formatTips(tips) {
  if (!tips || tips.length === 0) return '';
  let output = chalk.bold('\n\u{1F4A1} Tips:\n');
  tips.forEach((tip, index) => {
    output += `  ${chalk.yellow(`${index + 1}.`)} ${theme.dim(tip)}
`;
  });
  return output;
}
function formatTroubleshooting(troubleshooting) {
  if (!troubleshooting || troubleshooting.length === 0) return '';
  let output = chalk.bold('\n\u{1F527} Troubleshooting:\n');
  troubleshooting.forEach((item, index) => {
    output += `  ${chalk.red(`${index + 1}.`)} ${theme.dim(item.problem)}
`;
    output += `     ${chalk.gray('Solution:')} ${theme.dim(item.solution)}

`;
  });
  return output;
}
function createEnhancedHelp(command) {
  let output = '';
  if (command.name) {
    output += formatUsage(command.name, command.options) + '\n';
  }
  if (command.description) {
    output += formatDescription(command.description) + '\n';
  }
  if (command.options && command.options.length > 0) {
    output += formatOptions(command.options) + '\n';
  }
  if (command.examples) {
    output += formatExamples(command.examples) + '\n';
  }
  if (command.subcommands && command.subcommands.length > 0) {
    output += formatSubcommands(command.subcommands) + '\n';
  }
  if (command.aliases) {
    output += formatAliases(command.aliases) + '\n';
  }
  if (command.tips) {
    output += formatTips(command.tips) + '\n';
  }
  if (command.troubleshooting) {
    output += formatTroubleshooting(command.troubleshooting) + '\n';
  }
  return output;
}
var help_default = {
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
function _handleModuleError(error, context = 'help') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {}
}
export {
  createEnhancedHelp,
  help_default as default,
  formatAliases,
  formatCommandGroups,
  formatDescription,
  formatExamples,
  formatHelpSection,
  formatInfo,
  formatOptions,
  formatSubcommands,
  formatSuccess,
  formatTips,
  formatTroubleshooting,
  formatUsage,
  formatWarning,
};
