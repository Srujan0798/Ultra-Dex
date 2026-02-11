// Copyright (c) 2026 Ultra-Dex

/**
 * Contextual help system
 * Provides command-specific help and examples
 */

import chalk from 'chalk';

const HELP_TOPICS = {
  init: {
    description: 'Initialize a new Ultra-Dex project',
    examples: [
      'ultra-dex init',
      'ultra-dex init --template lite',
      'ultra-dex init --template full --force',
      'ultra-dex i', // alias
    ],
    tips: [
      'Use --template lite for quick MVPs (12 sections)',
      'Use --template full for complete projects (34 sections)',
      'Use --force to overwrite existing files',
      'Run from your project root directory',
    ],
  },

  generate: {
    description: 'Generate implementation plan from idea',
    examples: [
      'ultra-dex generate "Build a task manager app"',
      'ultra-dex g "SaaS for team collaboration"',
      'ultra-dex generate "AI-powered content generator" --template full',
    ],
    tips: [
      'Be specific: "SaaS for X" is better than "app"',
      'Mention key features in the description',
      'Use quotes for multi-word ideas',
      'The plan will be saved to IMPLEMENTATION-PLAN.md',
    ],
  },

  swarm: {
    description: 'Run multi-agent autonomous pipeline',
    examples: [
      'ultra-dex swarm "Build user authentication"',
      'ultra-dex s "Create dashboard layout"',
      'ultra-dex swarm "Implement API endpoints" --parallel',
      'ultra-dex swarm "Setup database" --dry-run',
    ],
    tips: [
      'Agents run in sequence by default for safety',
      'Use --parallel for independent tasks',
      'Use --dry-run to preview what agents will run',
      'Complex tasks work better when broken down',
    ],
  },

  run: {
    description: 'Run a single agent',
    examples: [
      'ultra-dex run planner',
      'ultra-dex run backend',
      'ultra-dex agent backend "Create login API"',
      'ultra-dex run security --task "Audit auth"',
    ],
    tips: [
      'Available agents: planner, backend, frontend, database, security, devops, reviewer, debugger',
      'Be specific with your task description',
      'Single agent is better for focused tasks',
      'Use swarm for multi-step features',
    ],
  },

  dashboard: {
    description: 'Open the God Mode dashboard',
    examples: ['ultra-dex dashboard', 'ultra-dex d', 'ultra-dex dashboard --port 3005'],
    tips: [
      'Dashboard shows real-time agent status',
      'View alignment score and progress',
      'Control agents (start/stop/view logs)',
      'Access via browser at http://localhost:3002',
    ],
  },

  align: {
    description: 'Check plan vs code alignment',
    examples: ['ultra-dex align', 'ultra-dex v', 'ultra-dex align --json', 'ultra-dex align --fix'],
    tips: [
      'Run regularly to track progress',
      '80%+ alignment is excellent',
      'Use --fix for auto-corrections',
      'Low alignment means drift from plan',
    ],
  },

  verify: {
    description: 'Verify implementation completeness',
    examples: ['ultra-dex verify', 'ultra-dex v', 'ultra-dex verify --strict'],
    tips: [
      'Checks P0 sections are complete',
      'Validates 21-step verification',
      "Reports what's missing",
      'Use before deployment',
    ],
  },

  memory: {
    description: 'Manage persistent memory',
    examples: [
      'ultra-dex memory list',
      'ultra-dex m sessions',
      'ultra-dex memory query "authentication"',
      'ultra-dex memory stats',
    ],
    tips: [
      'Memory persists across sessions',
      'Search past decisions with query',
      'Sessions track agent decisions',
      'Export for analysis or backup',
    ],
  },

  estimate: {
    description: 'Estimate AI costs',
    examples: [
      'ultra-dex estimate "Build login system"',
      'ultra-dex estimate feature-impl',
      'ultra-dex estimate --tokens 5000 --provider openai',
    ],
    tips: [
      'Compare providers before choosing',
      'Use predefined task types for accuracy',
      'Monthly estimates help budget planning',
      'Local models (Ollama) are free',
    ],
  },

  voice: {
    description: 'Voice-to-plan using speech',
    examples: [
      'ultra-dex voice',
      'ultra-dex voice "Build a SaaS"',
      'ultra-dex voice --template full --output plan.md',
    ],
    tips: [
      'Requires OPENAI_API_KEY for Whisper',
      'Speak clearly for best results',
      'Review transcribed text before using',
      'Fallback to typing if transcription fails',
    ],
  },

  batch: {
    description: 'Execute multiple commands',
    examples: [
      'ultra-dex batch setup.json',
      'ultra-dex batch commands.txt --dry-run',
      'ultra-dex batch template setup',
    ],
    tips: [
      'Create batch files for common workflows',
      'Use --dry-run to preview',
      'Supports both JSON and plain text',
      'Great for CI/CD pipelines',
    ],
  },

  history: {
    description: 'View and replay command history',
    examples: [
      'ultra-dex history list',
      'ultra-dex history replay abc123',
      'ultra-dex history search "swarm"',
    ],
    tips: [
      'History persists across sessions',
      'Replay any previous command',
      'Search by command or argument',
      'Clear with --force flag',
    ],
  },
};

/**
 * Get help for a specific command
 */
export function getCommandHelp(command) {
  const help = HELP_TOPICS[command];

  if (!help) {
    return chalk.yellow(`No detailed help available for "${command}"`);
  }

  const lines = [
    '',
    chalk.cyan.bold(`📖 ${command}`),
    chalk.white(help.description),
    '',
    chalk.cyan('Examples:'),
  ];

  help.examples.forEach((ex) => {
    lines.push(chalk.green(`  ${ex}`));
  });

  lines.push('', chalk.cyan('Pro Tips:'));
  help.tips.forEach((tip) => {
    lines.push(chalk.white(`  • ${tip}`));
  });

  lines.push('');
  return lines.join('\n');
}

/**
 * Show contextual help
 */
export function showHelp(command) {
  console.log(getCommandHelp(command));
}

/**
 * Suggest commands based on user intent
 */
export function suggestCommands(intent) {
  const suggestions = [];

  const keywords = {
    start: ['init', 'generate'],
    create: ['init', 'generate', 'swarm'],
    build: ['swarm', 'run', 'auto-implement'],
    check: ['align', 'verify', 'doctor'],
    fix: ['fix', 'doctor', 'validate'],
    view: ['dashboard', 'status', 'memory'],
    history: ['history', 'memory'],
    cost: ['estimate'],
    voice: ['voice'],
  };

  for (const [keyword, commands] of Object.entries(keywords)) {
    if (intent.toLowerCase().includes(keyword)) {
      suggestions.push(...commands);
    }
  }

  return [...new Set(suggestions)];
}

export default {
  getCommandHelp,
  showHelp,
  suggestCommands,
  HELP_TOPICS,
};

/**
 * Handle errors in contextual-help module
 * @param {Error} error - The error to handle
 * @param {string} [context='contextual-help'] - Error context
 */
function handleModuleError(error, context = 'contextual-help') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
