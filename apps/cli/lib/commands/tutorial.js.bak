import { interactiveCLI } from '../interactive-cli.js';
import { createSpinner } from '../spinner.js';
import { colors } from '../colors.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Tutorial data for Ultra-Dex
 */
const tutorialData = {
  title: "Ultra-Dex Interactive Tutorial",
  description: "Learn Ultra-Dex features in 10 easy steps",
  steps: [
    {
      id: 1,
      title: "Welcome to Ultra-Dex",
      description: "Introduction to the AI orchestration platform",
      command: "",
      explanation: "Ultra-Dex is an AI orchestration meta-layer that coordinates agents, models, memory, and tools.",
      challenge: null
    },
    {
      id: 2,
      title: "Check Your Setup",
      description: "Verify Ultra-Dex is properly installed",
      command: "ultra-dex --version",
      explanation: "This command shows your Ultra-Dex version.",
      challenge: "Run the command and verify you see version 6.0.0"
    },
    {
      id: 3,
      title: "View Available Commands",
      description: "See all available Ultra-Dex commands",
      command: "ultra-dex --help",
      explanation: "This shows all available commands and options.",
      challenge: "Find the 'run' command and its description"
    },
    {
      id: 4,
      title: "Initialize a Project",
      description: "Set up Ultra-Dex in your current directory",
      command: "ultra-dex init",
      explanation: "This creates configuration files and prepares your environment.",
      challenge: "Run init and observe the configuration created"
    },
    {
      id: 5,
      title: "Configure AI Providers",
      description: "Set up your AI model providers",
      command: "ultra-dex config --wizard",
      explanation: "This guides you through setting up OpenAI, Anthropic, or other providers.",
      challenge: "Start the wizard (you can exit without saving)"
    },
    {
      id: 6,
      title: "Run Your First Task",
      description: "Execute a simple task with Ultra-Dex",
      command: "ultra-dex run --task \"Say hello to the world\"",
      explanation: "This sends a task to the AI orchestrator.",
      challenge: "Run a simple task of your choice"
    },
    {
      id: 7,
      title: "Check Status",
      description: "View the status of your orchestrator",
      command: "ultra-dex status",
      explanation: "This shows the current state of agents and memory.",
      challenge: "Run the status command and observe the output"
    },
    {
      id: 8,
      title: "Explore Agents",
      description: "Learn about specialized agents",
      command: "ultra-dex agents list",
      explanation: "This shows all available specialized agents (planner, cto, backend, etc.)",
      challenge: "Identify at least 3 different agent types"
    },
    {
      id: 9,
      title: "View Memory",
      description: "Check the persistent memory system",
      command: "ultra-dex memory list",
      explanation: "This shows information stored in Ultra-Dex's tiered memory system.",
      challenge: "Observe the memory tiers (hot, warm, cold)"
    },
    {
      id: 10,
      title: "Complete Tutorial",
      description: "Congratulations! You've completed the tutorial",
      command: "",
      explanation: "You now know the basics of Ultra-Dex. Explore advanced features!",
      challenge: "Try creating a more complex task using multiple agents"
    }
  ]
};

/**
 * Tutorial progress manager
 */
class TutorialProgress {
  constructor() {
    this.progressFile = path.join(process.cwd(), '.ultra-dex', 'tutorial-progress.json');
  }

  async loadProgress() {
    try {
      await fs.access(this.progressFile);
      const data = await fs.readFile(this.progressFile, 'utf8');
      return JSON.parse(data);
    } catch {
      // If file doesn't exist, return default progress
      return {
        currentStep: 0,
        completedSteps: [],
        startDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async saveProgress(progress) {
    try {
      const ultraDexDir = path.join(process.cwd(), '.ultra-dex');
      await fs.mkdir(ultraDexDir, { recursive: true });
      progress.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.progressFile, JSON.stringify(progress, null, 2));
    } catch (error) {
      logger.error('Could not save tutorial progress:', error.message);
    }
  }

  async markStepComplete(stepId) {
    const progress = await this.loadProgress();
    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
      progress.currentStep = Math.max(progress.currentStep, stepId);
    }
    await this.saveProgress(progress);
    return progress;
  }

  async resetTutorial() {
    try {
      await fs.unlink(this.progressFile);
    } catch {
      // File might not exist, which is fine
    }
  }
}

/**
 * Interactive Tutorial for Ultra-Dex
 */
export class InteractiveTutorial {
  constructor() {
    this.progressManager = new TutorialProgress();
    this.tutorialData = tutorialData;
  }

  /**
   * Start the interactive tutorial
   * @param {object} options - Tutorial options
   */
  async start(options = {}) {
    interactiveCLI.showWelcome();
    interactiveCLI.showTitle(this.tutorialData.title);
    logger.log(colors.info(this.tutorialData.description + '\n'));

    const progress = await this.progressManager.loadProgress();
    const currentStep = options.step || progress.currentStep || 0;

    if (currentStep === 0) {
      logger.log(colors.success('Starting fresh tutorial!'));
    } else {
      logger.log(colors.info(`Resuming tutorial at step ${currentStep + 1}`));
    }

    if (options.reset) {
      await this.progressManager.resetTutorial();
      logger.log(colors.warning('Tutorial progress reset!'));
      return;
    }

    // Show current step
    await this.showStep(currentStep);

    // If not at the last step, ask if they want to continue
    if (currentStep < this.tutorialData.steps.length - 1) {
      const continueTutorial = await interactiveCLI.promptConfirm(
        'Continue to the next step?',
        true
      );

      if (continueTutorial) {
        await this.nextStep(currentStep);
      }
    } else {
      await this.completeTutorial();
    }
  }

  /**
   * Show a specific step
   * @param {number} stepIndex - Index of the step to show
   */
  async showStep(stepIndex) {
    const step = this.tutorialData.steps[stepIndex];
    if (!step) {
      logger.log(colors.error('Invalid step number'));
      return;
    }

    const progress = await this.progressManager.loadProgress();
    const isCompleted = progress.completedSteps.includes(step.id);

    interactiveCLI.showSection(`${step.id}. ${step.title} ${isCompleted ? '✅' : '⏳'}`);
    logger.log(colors.subtle(step.description) + '\n');

    if (step.explanation) {
      logger.log(colors.info('💡 Explanation:'));
      logger.log(colors.subtle(step.explanation) + '\n');
    }

    if (step.command) {
      logger.log(colors.info('💻 Command to try:'));
      logger.log(colors.secondary(`$ ${step.command}`) + '\n');
    }

    if (step.challenge) {
      logger.log(colors.info('🎯 Challenge:'));
      logger.log(colors.emphasis(step.challenge) + '\n');
    }

    if (isCompleted) {
      logger.log(colors.success('✓ You have completed this step'));
    }
  }

  /**
   * Move to the next step
   * @param {number} currentStep - Current step index
   */
  async nextStep(currentStep) {
    if (currentStep >= this.tutorialData.steps.length - 1) {
      await this.completeTutorial();
      return;
    }

    const nextStep = currentStep + 1;
    await this.progressManager.markStepComplete(nextStep);
    
    logger.log(colors.success(`\n✓ Marked step ${currentStep + 1} as complete!`));
    logger.log(colors.info(`Moving to step ${nextStep + 1}...`));

    // Show the next step
    await this.showStep(nextStep);

    // Ask if they want to continue to the next step
    if (nextStep < this.tutorialData.steps.length - 1) {
      const continueTutorial = await interactiveCLI.promptConfirm(
        'Continue to the next step?',
        true
      );

      if (continueTutorial) {
        await this.nextStep(nextStep);
      }
    } else {
      await this.completeTutorial();
    }
  }

  /**
   * Complete the tutorial
   */
  async completeTutorial() {
    const progress = await this.progressManager.loadProgress();
    const completedCount = progress.completedSteps.length;
    const totalCount = this.tutorialData.steps.length;

    interactiveCLI.showTitle('🎉 TUTORIAL COMPLETED! 🎉');
    logger.log(colors.success.bold(`Congratulations! You've completed the ${totalCount}-step tutorial.`));
    logger.log(colors.info(`You completed ${completedCount} out of ${totalCount} steps.`));

    // Celebration message
    logger.log('\n' + colors.brand('What you learned:') + '\n');
    const topics = [
      'AI orchestration concepts',
      'Agent coordination',
      'Memory management',
      'Task execution',
      'Configuration management'
    ];
    
    topics.forEach(topic => {
      logger.log(colors.status.success(topic));
    });

    logger.log('\n' + colors.info('Next steps:'));
    logger.log(colors.subtle('• Try running more complex tasks'));
    logger.log(colors.subtle('• Explore the documentation'));
    logger.log(colors.subtle('• Set up your AI provider accounts'));
    logger.log(colors.subtle('• Join the community for support'));

    // Update progress to mark as completed
    progress.currentStep = totalCount;
    if (!progress.completedSteps.includes(totalCount)) {
      progress.completedSteps.push(totalCount);
    }
    await this.progressManager.saveProgress(progress);
  }

  /**
   * Show tutorial progress
   */
  async showProgress() {
    const progress = await this.progressManager.loadProgress();
    const completedCount = progress.completedSteps.length;
    const totalCount = this.tutorialData.steps.length;

    interactiveCLI.showTitle('Tutorial Progress');
    logger.log(colors.info(`Progress: ${completedCount}/${totalCount} steps completed\n`));

    // Show progress bar
    const completedPercent = Math.round((completedCount / totalCount) * 100);
    const barLength = 30;
    const filledLength = Math.round((completedCount / totalCount) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    logger.log(`${bar} ${completedPercent}%\n`);

    // Show completed steps
    logger.log(colors.info('Completed steps:'));
    for (const stepId of progress.completedSteps.sort((a, b) => a - b)) {
      const step = this.tutorialData.steps.find(s => s.id === stepId);
      if (step) {
        logger.log(colors.status.success(step.title));
      }
    }

    // Show current step
    if (progress.currentStep < totalCount) {
      const currentStep = this.tutorialData.steps[progress.currentStep];
      if (currentStep) {
        logger.log(`\n${colors.warning('Current step:')} ${currentStep.title}`);
      }
    }

    // Show next step
    if (progress.currentStep + 1 < totalCount) {
      const nextStep = this.tutorialData.steps[progress.currentStep + 1];
      if (nextStep) {
        logger.log(`${colors.info('Next step:')} ${nextStep.title}`);
      }
    }
  }
}

/**
 * Tutorial command handler
 * @param {object} options - Command options
 */
export async function tutorialCommand(options = {}) {
  const tutorial = new InteractiveTutorial();

  if (options.progress) {
    await tutorial.showProgress();
  } else if (options.reset) {
    await tutorial.start({ reset: true });
  } else {
    await tutorial.start(options);
  }
}

/**
 * Register the tutorial command with Commander
 * @param {Command} program - Commander program instance
 */
export function registerTutorialCommand(program) {
  program
    .command('tutorial')
    .description('Interactive tutorial for Ultra-Dex')
    .option('--step <number>', 'Start at specific step')
    .option('--progress', 'Show tutorial progress')
    .option('--reset', 'Reset tutorial progress')
    .action(tutorialCommand);
}