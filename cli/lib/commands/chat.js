// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import inquirer from 'inquirer';
import { runAgentLoop } from './run.js';
import { getDefaultProvider, createProvider } from '../providers/index.js';
import { printError, printInfo } from '../utils/output.js';

const PERSONAS = {
  architect: {
    agent: 'cto',
    systemPrompt: 'You are an Expert Software Architect. Analyze systems, patterns, and trade-offs.',
    title: 'Architect Advisor'
  },
  'db-advisor': {
    agent: 'database',
    systemPrompt: 'You are a Database Specialist. Optimize schemas, queries, and data models.',
    title: 'Database Advisor'
  },
  'ai-advisor': {
    agent: 'research', // Fallback to research or create specific if needed
    systemPrompt: 'You are an AI Integration Specialist. Advise on LLMs, RAG, and agentic workflows.',
    title: 'AI Advisor'
  },
  'plugin-scan': {
    agent: 'security',
    systemPrompt: 'You are a Security Auditor. Analyze plugins for vulnerabilities and malicious patterns.',
    title: 'Plugin Security Scanner'
  },
  route: {
    agent: 'planner',
    systemPrompt: 'You are a Request Router. Analyze the user request and determine the best agent or workflow.',
    title: 'Request Router'
  }
};

export async function chatWithPersona(personaKey, initialQuery) {
  const persona = PERSONAS[personaKey];
  if (!persona) {
    throw new Error(`Unknown persona: ${personaKey}`);
  }

  printInfo(chalk.cyan(`
🤖 Starting ${persona.title}...
`));

  let query = initialQuery;
  if (!query) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: `Ask the ${persona.title}:`,
        validate: (input) => input.trim().length > 0
      }
    ]);
    query = answer.query;
  }

  // Reuse run logic but with specific persona overrides
  const providerId = getDefaultProvider();
  
  // Custom provider factory to inject system prompt override if needed
  // For simplicity, we'll just prepend it to the query for now or rely on the agent's base nature
  // Ideally, we'd update the agent's prompt in the context
  
  // Create a minimal context object
  const context = {
    plan: '',
    context: '',
    state: {},
    graph: null // Load lazily if needed
  };

  // We use the existing agent loop but the task is the user query + persona context
  const task = `[PERSONA: ${persona.title}]
${persona.systemPrompt}

User Query: ${query}`;
  
  const providerFactory = (agentId) => createProvider(providerId, {
    maxTokens: 4000
  });

  const response = await runAgentLoop(persona.agent, task, providerFactory, context);
  
  // Formatting output
  console.log('');
  console.log(chalk.bold(`${persona.title} Response:`));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(response);
  console.log(chalk.gray('─'.repeat(50)));
  console.log('');
}

export function registerChatCommand(program) {
  const cmd = program
    .command('chat')
    .alias('ask')
    .description('Chat with a specific AI persona')
    .argument('<persona>', 'Persona (architect, db-advisor, ai-advisor, etc)')
    .argument('[query]', 'Initial query')
    .action(async (persona, query) => {
      try {
        await chatWithPersona(persona, query);
      } catch (error) {
        printError(chalk.red(`Chat failed: ${error.message}`));
      }
    });
}

export default {
  chatWithPersona,
  registerChatCommand
};
