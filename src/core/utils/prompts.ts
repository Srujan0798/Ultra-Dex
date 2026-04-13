import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { logger } from './logging.js';
const PROMPT_TYPES = {
  LIST: 'list',
  CHECKBOX: 'checkbox',
  INPUT: 'input',
  PASSWORD: 'password',
  CONFIRM: 'confirm',
  RAWLIST: 'rawlist',
  EXPAND: 'expand',
};
async function selectAgent() {
  const agents = [
    { name: '\u{1F3DB}\uFE0F  CTO - Architecture decisions', value: 'cto' },
    { name: '\u{1F4CB}  Planner - Task breakdown', value: 'planner' },
    { name: '\u{1F527}  Backend - API & server', value: 'backend' },
    { name: '\u{1F3A8}  Frontend - UI components', value: 'frontend' },
    { name: '\u{1F4BE}  Database - Schema & queries', value: 'database' },
    { name: '\u{1F510}  Auth - Authentication', value: 'auth' },
    { name: '\u{1F6E1}\uFE0F  Security - Security review', value: 'security' },
    { name: '\u{1F4DD}  Testing - Write tests', value: 'testing' },
    { name: '\u{1F4D6}  Docs - Documentation', value: 'documentation' },
    { name: '\u{1F440}  Reviewer - Code review', value: 'reviewer' },
  ];
  const { agent } = await inquirer.prompt([
    {
      type: 'list',
      name: 'agent',
      message: gradient(['#6366f1', '#8b5cf6'])('Select an agent:'),
      choices: agents,
      pageSize: 12,
      loop: false,
    },
  ]);
  return agent;
}
async function confirmAction(message) {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow(message),
      default: false,
    },
  ]);
  return confirm;
}
async function inputText(message, defaultValue = '') {
  const { value } = await inquirer.prompt([
    {
      type: 'input',
      name: 'value',
      message: chalk.cyan(message),
      default: defaultValue,
      validate: (input) => input.trim() !== '' || 'Input cannot be empty',
    },
  ]);
  return value;
}
async function selectOption(message, choices, options = {}) {
  const { value } = await inquirer.prompt([
    {
      type: options.type || 'list',
      name: 'value',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices,
      pageSize: options.pageSize || 10,
      loop: options.loop !== false,
      default: options.default,
    },
  ]);
  return value;
}
async function multiSelect(message, choices, options = {}) {
  const { values } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'values',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices,
      pageSize: options.pageSize || 10,
      default: options.default,
    },
  ]);
  return values;
}
async function passwordPrompt(message, options = {}) {
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: chalk.red(message),
      mask: options.mask || '*',
      validate:
        options.validate ||
        ((input) => input.length >= 6 || 'Password must be at least 6 characters'),
    },
  ]);
  return password;
}
async function searchPrompt(message, choices, options = {}) {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices,
      pageSize: options.pageSize || 10,
      loop: false,
    },
  ]);
  return selected;
}
async function expandPrompt(message, choices, options = {}) {
  const { value } = await inquirer.prompt([
    {
      type: 'expand',
      name: 'value',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices,
      default: options.default || 0,
    },
  ]);
  return value;
}
async function autocompletePrompt(message, source, options = {}) {
  const choicesWithFilter = async (answersSoFar, input) => {
    if (!input) return source;
    const filtered = source.filter((choice) =>
      typeof choice === 'string'
        ? choice.toLowerCase().includes(input.toLowerCase())
        : choice.name.toLowerCase().includes(input.toLowerCase())
    );
    return filtered.slice(0, 10);
  };
  const { value } = await inquirer.prompt([
    {
      type: 'autocomplete',
      name: 'value',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      source: choicesWithFilter,
      default: options.default,
    },
  ]);
  return value;
}
async function promptSequence(prompts) {
  const results = {};
  for (const prompt of prompts) {
    const result = await inquirer.prompt([prompt]);
    Object.assign(results, result);
  }
  return results;
}
async function styledPrompt(type, message, choicesOrOptions, extraOptions = {}) {
  const prompt = {
    type,
    name: 'value',
    message: gradient(['#6366f1', '#8b5cf6'])(message),
    ...(Array.isArray(choicesOrOptions) ? { choices: choicesOrOptions } : { ...choicesOrOptions }),
    ...extraOptions,
  };
  const { value } = await inquirer.prompt([prompt]);
  return value;
}
async function formPrompt(fields) {
  const questions = fields.map((field) => ({
    type: field.type || 'input',
    name: field.name,
    message: gradient(['#6366f1', '#8b5cf6'])(field.message),
    default: field.default,
    validate: field.validate,
    choices: field.choices,
    pageSize: field.pageSize || 10,
  }));
  const answers = await inquirer.prompt(questions);
  return answers;
}
async function interactiveMenu(title, menuItems) {
  logger.log(
    chalk.bold.magenta(`
\u{1F3AF} ${title}
`)
  );
  const choices = menuItems.map((item, index) => ({
    name: `${item.emoji || '\u{1F538}'} ${item.label}`,
    value: item.value || index,
    short: item.short || item.label,
  }));
  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: chalk.cyan('Choose an option:'),
      choices,
      pageSize: Math.min(menuItems.length, 10),
    },
  ]);
  return selection;
}
async function yesNoPrompt(message, yesLabel = 'Yes', noLabel = 'No') {
  const { answer } = await inquirer.prompt([
    {
      type: 'list',
      name: 'answer',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices: [
        { name: `\u2705 ${yesLabel}`, value: true },
        { name: `\u274C ${noLabel}`, value: false },
      ],
    },
  ]);
  return answer;
}
async function _safeExecute(fn, context = 'prompts') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
export {
  PROMPT_TYPES,
  autocompletePrompt,
  confirmAction,
  expandPrompt,
  formPrompt,
  inputText,
  interactiveMenu,
  multiSelect,
  passwordPrompt,
  promptSequence,
  searchPrompt,
  selectAgent,
  selectOption,
  styledPrompt,
  yesNoPrompt,
};
