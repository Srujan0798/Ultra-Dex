// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Prompts module
 * @module utils/prompts
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { createSpinner } from './spinners.js';

// Custom prompt types
export const PROMPT_TYPES = {
  LIST: 'list',
  CHECKBOX: 'checkbox',
  INPUT: 'input',
  PASSWORD: 'password',
  CONFIRM: 'confirm',
  RAWLIST: 'rawlist',
  EXPAND: 'expand',
};

// Enhanced prompt functions
export async function selectAgent() {
  const agents = [
    { name: '🏛️  CTO - Architecture decisions', value: 'cto' },
    { name: '📋  Planner - Task breakdown', value: 'planner' },
    { name: '🔧  Backend - API & server', value: 'backend' },
    { name: '🎨  Frontend - UI components', value: 'frontend' },
    { name: '💾  Database - Schema & queries', value: 'database' },
    { name: '🔐  Auth - Authentication', value: 'auth' },
    { name: '🛡️  Security - Security review', value: 'security' },
    { name: '📝  Testing - Write tests', value: 'testing' },
    { name: '📖  Docs - Documentation', value: 'documentation' },
    { name: '👀  Reviewer - Code review', value: 'reviewer' },
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

export async function confirmAction(message) {
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

export async function inputText(message, defaultValue = '') {
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

// Enhanced prompt functions
export async function selectOption(message, choices, options = {}) {
  const { value } = await inquirer.prompt([
    {
      type: options.type || 'list',
      name: 'value',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices: choices,
      pageSize: options.pageSize || 10,
      loop: options.loop !== false,
      default: options.default,
    },
  ]);

  return value;
}

export async function multiSelect(message, choices, options = {}) {
  const { values } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'values',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices: choices,
      pageSize: options.pageSize || 10,
      default: options.default,
    },
  ]);

  return values;
}

export async function passwordPrompt(message, options = {}) {
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

export async function searchPrompt(message, choices, options = {}) {
  // This is a simulated search prompt - inquirer doesn't have built-in search
  // but we can implement filtering

  // First, show all choices
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices: choices,
      pageSize: options.pageSize || 10,
      loop: false,
    },
  ]);

  return selected;
}

export async function expandPrompt(message, choices, options = {}) {
  const { value } = await inquirer.prompt([
    {
      type: 'expand',
      name: 'value',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices: choices,
      default: options.default || 0,
    },
  ]);

  return value;
}

export async function autocompletePrompt(message, source, options = {}) {
  // Using fuzzy search with choices
  const choicesWithFilter = async (answersSoFar, input) => {
    if (!input) return source;

    const filtered = source.filter((choice) =>
      typeof choice === 'string'
        ? choice.toLowerCase().includes(input.toLowerCase())
        : choice.name.toLowerCase().includes(input.toLowerCase())
    );

    return filtered.slice(0, 10); // Limit to 10 suggestions
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

export async function promptSequence(prompts) {
  const results = {};

  for (const prompt of prompts) {
    const result = await inquirer.prompt([prompt]);
    Object.assign(results, result);
  }

  return results;
}

export async function styledPrompt(type, message, choicesOrOptions, extraOptions = {}) {
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

export async function formPrompt(fields) {
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

export async function interactiveMenu(title, menuItems) {
  console.log(chalk.bold.magenta(`\n🎯 ${title}\n`));

  const choices = menuItems.map((item, index) => ({
    name: `${item.emoji || '🔸'} ${item.label}`,
    value: item.value || index,
    short: item.short || item.label,
  }));

  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: chalk.cyan('Choose an option:'),
      choices: choices,
      pageSize: Math.min(menuItems.length, 10),
    },
  ]);

  return selection;
}

export async function yesNoPrompt(message, yesLabel = 'Yes', noLabel = 'No') {
  const { answer } = await inquirer.prompt([
    {
      type: 'list',
      name: 'answer',
      message: gradient(['#6366f1', '#8b5cf6'])(message),
      choices: [
        { name: `✅ ${yesLabel}`, value: true },
        { name: `❌ ${noLabel}`, value: false },
      ],
    },
  ]);

  return answer;
}

/**
 * Safe execution wrapper with error handling for prompts
 * @param {Function} fn - Async function to execute
 * @param {string} [context='prompts'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'prompts') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
