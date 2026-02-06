// Copyright (c) 2026 Ultra-Dex

/**
 * NLP Intent Router
 * Parse user input and route to appropriate commands
 */

import chalk from 'chalk';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

// Intent patterns and their corresponding commands
const INTENT_PATTERNS = [
  // Build/fix related intents
  {
    intent: 'fix-build',
    patterns: [
      /fix.*build/,
      /build.*fail/,
      /broken.*build/,
      /can't.*build/,
      /error.*build/,
      /solve.*build/,
    ],
    command: 'ultra-dex fix --build',
    description: 'Fix build issues',
  },
  {
    intent: 'fix-code',
    patterns: [
      /fix.*bug/,
      /fix.*error/,
      /solve.*problem/,
      /resolve.*issue/,
      /debug/,
      /troubleshoot/,
    ],
    command: 'ultra-dex fix',
    description: 'Fix code issues',
  },

  // Project creation intents
  {
    intent: 'create-project',
    patterns: [
      /create.*project/,
      /new.*project/,
      /start.*project/,
      /build.*app/,
      /make.*app/,
      /create.*app/,
      /init.*project/,
    ],
    command: 'ultra-dex init',
    description: 'Initialize new project',
  },

  // Generation intents
  {
    intent: 'generate-plan',
    patterns: [
      /generate.*plan/,
      /create.*plan/,
      /make.*plan/,
      /build.*plan/,
      /generate.*implementation/,
      /create.*implementation/,
    ],
    command: 'ultra-dex generate',
    description: 'Generate implementation plan',
  },

  // Agent related intents
  {
    intent: 'run-agent',
    patterns: [/run.*agent/, /execute.*agent/, /start.*agent/, /use.*agent/, /call.*agent/],
    command: 'ultra-dex agents',
    description: 'Run AI agents',
  },

  // Verification intents
  {
    intent: 'verify',
    patterns: [
      /check.*code/,
      /verify.*code/,
      /test.*code/,
      /validate.*code/,
      /audit.*code/,
      /review.*code/,
    ],
    command: 'ultra-dex verify',
    description: 'Verify code quality',
  },

  // Documentation intents
  {
    intent: 'docs',
    patterns: [
      /show.*docs/,
      /read.*docs/,
      /view.*docs/,
      /help.*docs/,
      /documentation/,
      /doc.*help/,
    ],
    command: 'ultra-dex docs',
    description: 'View documentation',
  },

  // Deployment intents
  {
    intent: 'deploy',
    patterns: [/deploy/, /publish/, /release/, /ship/, /launch/, /go.*live/],
    command: 'ultra-dex deploy',
    description: 'Deploy application',
  },

  // Status/health intents
  {
    intent: 'status',
    patterns: [/status/, /health/, /check.*status/, /how.*going/, /what.*up/, /system.*status/],
    command: 'ultra-dex status',
    description: 'Check system status',
  },
];

// Template patterns for more specific intents
const TEMPLATE_PATTERNS = [
  {
    intent: 'create-finance-app',
    patterns: [/finance/, /banking/, /payment/, /transaction/, /accounting/],
    command: 'ultra-dex init --template finance',
    description: 'Create finance application',
  },
  {
    intent: 'create-elearning-app',
    patterns: [/learn/, /education/, /course/, /school/, /student/, /teacher/],
    command: 'ultra-dex init --template education',
    description: 'Create e-learning application',
  },
  {
    intent: 'create-ecommerce-app',
    patterns: [/shop/, /store/, /buy/, /sell/, /product/, /cart/, /ecommerce/],
    command: 'ultra-dex init --template ecommerce',
    description: 'Create e-commerce application',
  },
  {
    intent: 'create-social-app',
    patterns: [/social/, /chat/, /community/, /forum/, /network/, /connect/],
    command: 'ultra-dex init --template social',
    description: 'Create social application',
  },
];

/**
 * Classify user intent based on input
 */
export function classifyIntent(userInput) {
  const lowerInput = userInput.toLowerCase();

  // Check template patterns first (more specific)
  for (const templatePattern of TEMPLATE_PATTERNS) {
    for (const pattern of templatePattern.patterns) {
      if (pattern.test(lowerInput)) {
        return {
          intent: templatePattern.intent,
          command: templatePattern.command,
          description: templatePattern.description,
          confidence: 0.9,
          matchedPattern: pattern.toString(),
        };
      }
    }
  }

  // Check general intent patterns
  for (const intentPattern of INTENT_PATTERNS) {
    for (const pattern of intentPattern.patterns) {
      if (pattern.test(lowerInput)) {
        // Calculate confidence based on pattern match strength
        const match = lowerInput.match(pattern);
        const confidence = Math.min(0.8, 0.5 + (match[0].length / lowerInput.length) * 0.3);

        return {
          intent: intentPattern.intent,
          command: intentPattern.command,
          description: intentPattern.description,
          confidence: confidence,
          matchedPattern: pattern.toString(),
        };
      }
    }
  }

  // If no pattern matches, return unknown
  return {
    intent: 'unknown',
    command: null,
    description: 'Unable to determine intent',
    confidence: 0,
    matchedPattern: null,
  };
}

/**
 * Parse user input and return suggested command
 */
export function parseIntent(userInput) {
  const intent = classifyIntent(userInput);

  return {
    originalInput: userInput,
    ...intent,
    suggestedCommand: intent.command,
    isRecognized: intent.intent !== 'unknown',
  };
}

/**
 * Execute the suggested command (simulation)
 */
export async function executeSuggestedCommand(suggestion) {
  if (!suggestion.isRecognized) {
    printWarning(chalk.yellow(`\n⚠️  Unable to understand: "${suggestion.originalInput}"`));
    printInfo(chalk.gray('Try rephrasing your request or use a specific command.'));
    return null;
  }

  printInfo(chalk.cyan(`\n🤖 I understand you want to: ${suggestion.description}`));
  printInfo(chalk.gray(`Command: ${suggestion.suggestedCommand}`));
  printInfo(chalk.gray(`Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`));

  const { execute } = await import('inquirer').then((inquirer) =>
    inquirer.prompt([
      {
        type: 'confirm',
        name: 'execute',
        message: 'Execute this command?',
        default: true,
      },
    ])
  );

  if (execute) {
    printSuccess(chalk.green(`\n✅ Executing: ${suggestion.suggestedCommand}`));
    // In a real implementation, this would execute the actual command
    return suggestion.suggestedCommand;
  } else {
    printInfo(chalk.gray('\nCommand execution cancelled.'));
    return null;
  }
}

/**
 * Register intent parser command
 */
export function registerIntentParserCommand(program) {
  program
    .command('intent')
    .alias('parse')
    .description('Parse natural language input to CLI commands')
    .argument('<input>', 'Natural language input')
    .option('-e, --execute', 'Execute the suggested command')
    .option('-v, --verbose', 'Show detailed analysis')
    .action(async (input, options) => {
      try {
        printInfo(chalk.cyan('\n🔍 NLP Intent Parser\n'));
        printInfo(chalk.gray(`Input: "${input}"\n`));

        const suggestion = parseIntent(input);

        if (options.verbose) {
          printInfo(chalk.gray(`Intent: ${suggestion.intent}`));
          printInfo(chalk.gray(`Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`));
          printInfo(chalk.gray(`Matched Pattern: ${suggestion.matchedPattern || 'None'}`));
          printInfo('');
        }

        if (suggestion.isRecognized) {
          printSuccess(chalk.green(`✅ Recognized intent: ${suggestion.description}`));
          printInfo(chalk.gray(`Suggested command: ${suggestion.suggestedCommand}`));

          if (options.execute) {
            await executeSuggestedCommand(suggestion);
          } else {
            printInfo(chalk.gray('\nUse --execute to run the suggested command'));
          }
        } else {
          printWarning(chalk.yellow(`⚠️  Unknown intent. Did you mean:`));

          // Provide some suggestions based on keywords
          const suggestions = getSuggestions(input);
          suggestions.forEach((sug, idx) => {
            printInfo(chalk.gray(`  ${idx + 1}. ${sug.command} - ${sug.description}`));
          });
        }
      } catch (error) {
        printError(chalk.red(`Intent parsing failed: ${error.message}`));
      }
    });

  // Add a global handler for unrecognized commands
  program.on('command:*', async function (operands) {
    const input = operands.join(' ');

    // Check if this is a real command first
    const knownCommands = program.commands.map((cmd) => cmd.name());
    if (knownCommands.includes(operands[0])) {
      // It's a known command with bad args, let the normal handler deal with it
      return;
    }

    // Treat as natural language input
    printWarning(chalk.yellow(`\n🤔 Unknown command: ${operands[0]}`));

    const suggestion = parseIntent(input);

    if (suggestion.isRecognized) {
      printInfo(chalk.cyan(`\n💡 I think you meant: ${suggestion.suggestedCommand}`));

      const { execute } = await import('inquirer').then((inquirer) =>
        inquirer.prompt([
          {
            type: 'confirm',
            name: 'execute',
            message: 'Would you like to execute this command?',
            default: true,
          },
        ])
      );

      if (execute) {
        printSuccess(chalk.green(`\nExecuting: ${suggestion.suggestedCommand}`));
        // In a real implementation, this would execute the actual command
      }
    } else {
      printError(chalk.red(`\n❌ Unable to understand: "${input}"`));
      printInfo(chalk.gray('Use "ultra-dex --help" to see available commands'));
    }
  });
}

/**
 * Get command suggestions based on keywords in input
 */
function getSuggestions(input) {
  const lowerInput = input.toLowerCase();
  const suggestions = [];

  // Simple keyword matching for suggestions
  if (lowerInput.includes('new') || lowerInput.includes('create') || lowerInput.includes('start')) {
    suggestions.push({
      command: 'ultra-dex init',
      description: 'Initialize a new project',
    });
  }

  if (
    lowerInput.includes('plan') ||
    lowerInput.includes('generate') ||
    lowerInput.includes('design')
  ) {
    suggestions.push({
      command: 'ultra-dex generate',
      description: 'Generate implementation plan',
    });
  }

  if (lowerInput.includes('fix') || lowerInput.includes('bug') || lowerInput.includes('error')) {
    suggestions.push({
      command: 'ultra-dex fix',
      description: 'Fix code issues',
    });
  }

  if (
    lowerInput.includes('check') ||
    lowerInput.includes('verify') ||
    lowerInput.includes('test')
  ) {
    suggestions.push({
      command: 'ultra-dex verify',
      description: 'Verify code quality',
    });
  }

  if (lowerInput.includes('doc') || lowerInput.includes('help')) {
    suggestions.push({
      command: 'ultra-dex docs',
      description: 'View documentation',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      command: 'ultra-dex --help',
      description: 'Show all available commands',
    });
  }

  return suggestions;
}

/**
 * Middleware function to intercept all commands and try intent parsing
 */
export function intentMiddleware() {
  return function (userInput, action) {
    // If the command is not recognized, try intent parsing
    const suggestion = parseIntent(userInput);

    if (suggestion.isRecognized && suggestion.confidence > 0.7) {
      return executeSuggestedCommand(suggestion);
    }

    // Otherwise, proceed with normal command execution
    return action;
  };
}

export default {
  classifyIntent,
  parseIntent,
  executeSuggestedCommand,
  registerIntentParserCommand,
  getSuggestions,
  intentMiddleware,
};
