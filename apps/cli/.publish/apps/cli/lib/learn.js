import fs from 'fs';

import readline from 'readline';
import { spawn } from 'child_process';
import { logger } from './utils/logger.js';

const tutorialData = JSON.parse(
  fs.readFileSync(new URL('./tutorial-data.json', import.meta.url), 'utf8')
);

class InteractiveTutorial {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.currentStep = 0;
  }

  async start() {
    logger.info(`${tutorialData.title}`);
    logger.info(`${tutorialData.description}`);
    logger.info(`Estimated duration: ${tutorialData.estimated_duration}`);
    logger.spacer();

    const confirm = await this.askQuestion(`Start the tutorial? (y/N): `);
    if (!confirm.toLowerCase().startsWith('y')) {
      logger.info('Tutorial cancelled.');
      return;
    }

    logger.spacer();

    for (this.currentStep = 0; this.currentStep < tutorialData.steps.length; this.currentStep++) {
      await this.showStep(tutorialData.steps[this.currentStep]);

      if (this.currentStep < tutorialData.steps.length - 1) {
        await this.askQuestion('Press Enter to continue to the next step...');
        logger.spacer();
      }
    }

    logger.success('🎉 Congratulations! You have completed the Ultra-Dex tutorial.');
    logger.info('Continue exploring Ultra-Dex with advanced features!');
    this.rl.close();
  }

  async showStep(step) {
    logger.step(step.id, tutorialData.steps.length, step.title);
    logger.info(step.description);
    logger.spacer();

    if (step.explanation) {
      logger.info(`💡 Explanation: ${step.explanation}`);
    }

    if (step.command) {
      logger.info(`💻 Command: ${step.command}`);
    }

    if (step.challenge) {
      logger.info(`🎯 Challenge: ${step.challenge}`);

      // If there's a command, suggest running it
      if (step.command) {
        const runCommand = await this.askQuestion(
          `Would you like to run this command now? (y/N): `
        );
        if (runCommand.toLowerCase().startsWith('y')) {
          await this.executeCommand(step.command);
        }
      }
    }

    logger.spacer();
  }

  async executeCommand(command) {
    logger.info(`Executing: ${command}`);
    logger.info('--- OUTPUT ---');

    try {
      const [cmd, ...args] = command.split(' ');

      const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

      // Capture output
      let _output = '';
      child.stdout.on('data', (data) => {
        _output += data.toString();
        process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      await new Promise((resolve) => {
        child.on('close', (code) => {
          logger.info('--- END OUTPUT ---');
          if (code !== 0) {
            logger.error(`Command failed with exit code ${code}`);
          }
          resolve();
        });
      });
    } catch (error) {
      logger.error(`Error executing command: ${error.message}`);
    }
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

async function runTutorial() {
  const tutorial = new InteractiveTutorial();
  await tutorial.start();
}

export { runTutorial };

// If this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTutorial();
}
