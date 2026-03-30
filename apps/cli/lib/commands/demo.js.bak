import { interactiveCLI } from '../interactive-cli.js';
import { createSpinner, withLoading } from '../spinner.js';
import { colors } from '../colors.js';
import { createTable, createSummaryCard, createStatusPanel, createProgressBar } from '../formatters.js';
import { createBarChart, createGauge, formatChartTitle } from '../charts.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Demo scenarios for Ultra-Dex
 */
const DEMO_SCENARIOS = [
  {
    id: 'hello-world',
    title: 'Hello World',
    description: 'Simple introduction to Ultra-Dex',
    task: 'Say hello to the world in a creative way',
    duration: '1 min',
    difficulty: 'Beginner',
    expected: 'A creative greeting message'
  },
  {
    id: 'code-review',
    title: 'Code Review',
    description: 'Review a JavaScript function',
    task: 'Review this JavaScript function and suggest improvements: function sum(a, b) { return a + b; }',
    duration: '2 min',
    difficulty: 'Beginner',
    expected: 'Code review with suggestions'
  },
  {
    id: 'tech-choice',
    title: 'Technology Choice',
    description: 'Get advice on technology selection',
    task: 'Which JavaScript framework should I use for a new dashboard project?',
    duration: '2 min',
    difficulty: 'Beginner',
    expected: 'Framework recommendation with pros/cons'
  },
  {
    id: 'debugging',
    title: 'Bug Detection',
    description: 'Find issues in sample code',
    task: 'Find and fix issues in this code: let x = 5; if (x = 5) { logger.log("Equal"); }',
    duration: '2 min',
    difficulty: 'Intermediate',
    expected: 'Bug identification and fix'
  },
  {
    id: 'system-design',
    title: 'System Design',
    description: 'Design a simple API',
    task: 'Design a REST API for a blog with posts and comments',
    duration: '3 min',
    difficulty: 'Intermediate',
    expected: 'API design with endpoints'
  },
  {
    id: 'architecture',
    title: 'Architecture Planning',
    description: 'Plan a microservices architecture',
    task: 'Design a microservices architecture for an e-commerce platform',
    duration: '4 min',
    difficulty: 'Advanced',
    expected: 'Service breakdown and interactions'
  }
];

/**
 * Demo data and examples
 */
const DEMO_DATA = {
  helloWorld: {
    input: 'Say hello to the world in a creative way',
    output: '🌍 Greetings, planet Earth! May your circuits compute joy and your memory banks overflow with happiness. Hello from the digital realm! 🚀',
    metrics: {
      tokens: 45,
      time: 1200,
      confidence: 0.95
    }
  },
  codeReview: {
    input: 'function sum(a, b) { return a + b; }',
    output: 'The function looks correct for basic addition. Suggestions:\n1. Add JSDoc comments\n2. Consider input validation\n3. Handle edge cases (null, undefined)',
    metrics: {
      tokens: 67,
      time: 1800,
      confidence: 0.88
    }
  }
};

/**
 * Interactive Demo for Ultra-Dex
 */
export class InteractiveDemo {
  constructor() {
    this.scenarios = DEMO_SCENARIOS;
    this.demoData = DEMO_DATA;
  }

  /**
   * Start the interactive demo
   * @param {object} options - Demo options
   */
  async start(options = {}) {
    interactiveCLI.showWelcome();
    interactiveCLI.showTitle('Ultra-Dex Demo Mode');
    
    logger.log(colors.info('Experience Ultra-Dex capabilities without any setup!\n'));

    if (options.list) {
      await this.listScenarios();
      return;
    }

    if (options.scenario) {
      const scenario = this.scenarios.find(s => s.id === options.scenario);
      if (!scenario) {
        logger.log(colors.error(`Demo scenario '${options.scenario}' not found.`));
        await this.listScenarios();
        return;
      }
      
      await this.runScenario(scenario);
      return;
    }

    // Show available demos
    await this.showOverview();
    
    // Ask user to select a demo
    const selectedDemo = await this.selectDemo();
    if (selectedDemo) {
      await this.runScenario(selectedDemo);
    }
  }

  /**
   * Show demo overview
   */
  async showOverview() {
    logger.log(colors.accent.bold('Available Demo Scenarios:\n'));
    
    // Create a table of scenarios
    const headers = ['ID', 'Title', 'Difficulty', 'Duration', 'Description'];
    const rows = this.scenarios.map(scenario => [
      colors.cyan(scenario.id),
      colors.bold(scenario.title),
      this.formatDifficulty(scenario.difficulty),
      colors.subtle(scenario.duration),
      colors.subtle(scenario.description)
    ]);

    logger.log(createTable(headers, rows));
    
    logger.log('\n' + colors.info('Run a specific demo: ultra-dex demo --scenario <id>'));
    logger.log(colors.info('List all demos: ultra-dex demo --list'));
  }

  /**
   * List all scenarios
   */
  async listScenarios() {
    logger.log(colors.accent.bold('Ultra-Dex Demo Scenarios:\n'));
    
    const headers = ['ID', 'Title', 'Difficulty', 'Duration', 'Expected Result'];
    const rows = this.scenarios.map(scenario => [
      colors.cyan(scenario.id),
      colors.bold(scenario.title),
      this.formatDifficulty(scenario.difficulty),
      colors.subtle(scenario.duration),
      colors.subtle(scenario.expected)
    ]);

    logger.log(createTable(headers, rows));
  }

  /**
   * Select a demo interactively
   * @returns {object|null} Selected demo scenario or null
   */
  async selectDemo() {
    const choices = this.scenarios.map(scenario => ({
      name: `${colors.bold(scenario.title)} ${colors.subtle(`(${scenario.difficulty} - ${scenario.duration})`)}`,
      value: scenario,
      short: scenario.title
    }));

    try {
      const selected = await interactiveCLI.promptList('Choose a demo scenario:', choices);
      return selected;
    } catch (error) {
      logger.log(colors.error('Demo selection cancelled.'));
      return null;
    }
  }

  /**
   * Run a specific scenario
   * @param {object} scenario - Scenario to run
   */
  async runScenario(scenario) {
    logger.log('\n' + colors.accent.bold(`🚀 Running Demo: ${scenario.title}`));
    logger.log(colors.subtle(scenario.description) + '\n');

    // Show scenario details
    const details = [
      { key: 'ID', value: scenario.id },
      { key: 'Difficulty', value: scenario.difficulty },
      { key: 'Estimated Time', value: scenario.duration },
      { key: 'Task', value: scenario.task }
    ];

    logger.log(createSummaryCard('Scenario Details', details));

    // Ask for confirmation
    const confirmed = await interactiveCLI.promptConfirm(
      'Run this demo scenario?', 
      true
    );

    if (!confirmed) {
      logger.log(colors.info('Demo cancelled.'));
      return;
    }

    // Simulate running the demo
    await this.simulateDemoExecution(scenario);
  }

  /**
   * Simulate demo execution
   * @param {object} scenario - Scenario to simulate
   */
  async simulateDemoExecution(scenario) {
    const spinner = createSpinner('Initializing Ultra-Dex orchestrator...');
    spinner.start();

    // Simulate initialization
    await new Promise(resolve => setTimeout(resolve, 800));
    spinner.text = 'Loading AI models and agents...';
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinner.text = 'Setting up memory system...';
    
    await new Promise(resolve => setTimeout(resolve, 600));
    spinner.succeed('Demo environment ready!');

    // Show execution steps
    logger.log('\n' + colors.info('Executing task: ') + colors.bold(scenario.task) + '\n');

    // Simulate progress
    const steps = [
      'Analyzing requirements',
      'Planning approach', 
      'Executing task',
      'Validating results',
      'Preparing output'
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = createProgressBar(i + 1, steps.length, `Step ${i + 1}/${steps.length}: ${step}`);
      logger.log(progress);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Show results
    await this.showDemoResults(scenario);

    // Show metrics
    await this.showDemoMetrics(scenario);

    // Ask if user wants to try another demo
    const tryAnother = await interactiveCLI.promptConfirm(
      'Try another demo scenario?',
      true
    );

    if (tryAnother) {
      const nextDemo = await this.selectDemo();
      if (nextDemo) {
        await this.runScenario(nextDemo);
      }
    }
  }

  /**
   * Show demo results
   * @param {object} scenario - Scenario that was run
   */
  async showDemoResults(scenario) {
    logger.log('\n' + colors.success.bold('✅ Demo Results:\n'));

    // Get demo output based on scenario
    let output;
    switch (scenario.id) {
      case 'hello-world':
        output = this.demoData.helloWorld.output;
        break;
      case 'code-review':
        output = this.demoData.codeReview.output;
        break;
      default:
        output = `This is a simulation of what Ultra-Dex would generate for: "${scenario.task}"\n\nSample output showing the AI's analysis, recommendations, or solution based on the input task.`;
    }

    // Show the output in a formatted way
    logger.log(colors.bold('Generated Output:'));
    logger.log(colors.subtle(output) + '\n');
  }

  /**
   * Show demo metrics and analytics
   * @param {object} scenario - Scenario that was run
   */
  async showDemoMetrics(scenario) {
    logger.log(colors.accent.bold('📊 Performance Metrics:\n'));

    // Sample metrics (in a real implementation, these would come from the actual execution)
    const metrics = {
      tokens: Math.floor(Math.random() * 100) + 50,
      time: Math.floor(Math.random() * 3000) + 1000, // ms
      confidence: (Math.random() * 0.3) + 0.7, // 0.7-1.0
      agentsUsed: ['planner', 'reviewer', 'executor'].slice(0, Math.floor(Math.random() * 3) + 1)
    };

    // Create metrics summary
    const metricItems = [
      { key: 'Tokens Used', value: metrics.tokens.toString() },
      { key: 'Execution Time', value: `${metrics.time}ms` },
      { key: 'Confidence Level', value: `${Math.round(metrics.confidence * 100)}%` },
      { key: 'Agents Used', value: metrics.agentsUsed.join(', ') }
    ];

    logger.log(createSummaryCard('Execution Metrics', metricItems));

    // Show confidence gauge
    logger.log(formatChartTitle('AI Confidence'));
    logger.log(createGauge(Math.round(metrics.confidence * 100), 100, 'Overall Confidence', { showValues: true }));

    // Show token usage chart
    logger.log(formatChartTitle('Resource Usage'));
    const resourceData = [
      { label: 'Tokens', value: metrics.tokens },
      { label: 'Time (ms)', value: metrics.time / 10 }
    ];
    logger.log(createBarChart(resourceData, { width: 30 }));
  }

  /**
   * Format difficulty level with color coding
   * @param {string} difficulty - Difficulty level
   * @returns {string} Formatted difficulty
   */
  formatDifficulty(difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return colors.green(difficulty);
      case 'intermediate':
        return colors.yellow(difficulty);
      case 'advanced':
        return colors.red(difficulty);
      default:
        return colors.subtle(difficulty);
    }
  }

  /**
   * Show demo statistics
   */
  async showStats() {
    logger.log(colors.accent.bold('📈 Demo Statistics:\n'));

    const stats = [
      { status: 'success', message: 'Hello World Demo', details: 'Simple greeting generation' },
      { status: 'success', message: 'Code Review Demo', details: 'JavaScript function analysis' },
      { status: 'pending', message: 'System Design Demo', details: 'API design simulation' },
      { status: 'success', message: 'Architecture Demo', details: 'Microservices planning' }
    ];

    logger.log(createStatusPanel(stats));
  }
}

/**
 * Demo command handler
 * @param {object} options - Command options
 */
export async function demoCommand(options = {}) {
  const demo = new InteractiveDemo();
  await demo.start(options);
}

/**
 * Register the demo command with Commander
 * @param {Command} program - Commander program instance
 */
export function registerDemoCommand(program) {
  program
    .command('demo')
    .description('Interactive demo mode with pre-built examples')
    .option('--list', 'List all available demo scenarios')
    .option('--scenario <id>', 'Run a specific demo scenario by ID')
    .option('--stats', 'Show demo statistics')
    .action(demoCommand);
}
