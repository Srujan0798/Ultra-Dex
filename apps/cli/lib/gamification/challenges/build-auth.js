// Copyright (c) 2026 Ultra-Dex

/**
 * 'Build Auth' Challenge
 * Define stages: Planning (5m), Design (7m), Security (8m), Build (10m). The "Boss Fight" verification.
 */

import { ChallengeEngine } from './challenge-engine.js';
import { printInfo, printSuccess, printWarning, printError } from '../../utils/output.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

// Specific implementation for the Build Auth challenge
class BuildAuthChallenge extends ChallengeEngine {
  constructor() {
    super();
    this.challengeId = 'build-auth';
    this.challengeName = 'Build Authentication System';
    this.description = 'Build a complete authentication system from scratch';
    this.difficulty = 'hard';
    this.duration = 20 * 60; // 20 minutes in seconds
    this.stages = [
      {
        name: 'Planning',
        duration: 5 * 60,
        description: 'Plan the auth system architecture',
        tasks: [
          'Define authentication requirements',
          'Choose authentication method (JWT, Sessions, OAuth)',
          'Plan user roles and permissions',
          'Design security measures',
        ],
      },
      {
        name: 'Design',
        duration: 7 * 60,
        description: 'Design the database schema and API',
        tasks: [
          'Create database schema for users',
          'Design API endpoints for auth',
          'Plan password hashing strategy',
          'Design token management system',
        ],
      },
      {
        name: 'Security',
        duration: 8 * 60,
        description: 'Implement security measures',
        tasks: [
          'Implement password hashing',
          'Add rate limiting',
          'Implement secure session management',
          'Add input validation and sanitization',
        ],
      },
      {
        name: 'Build',
        duration: 10 * 60,
        description: 'Build the authentication system',
        tasks: [
          'Implement user registration',
          'Implement user login/logout',
          'Add password reset functionality',
          'Create user profile management',
        ],
      },
    ];
    this.bossFight = true;
    this.bossDescription = 'Complete integration test with all security measures';
    this.points = 1000;
  }

  /**
   * Start the Build Auth challenge
   */
  async startChallenge() {
    printSuccess(chalk.green(`🚀 Starting: ${this.challengeName}`));
    printInfo(chalk.gray(`Difficulty: ${this.difficulty} | Points: ${this.points}`));
    printInfo(
      chalk.gray(`Total Duration: ${Math.floor(this.duration / 60)}m ${this.duration % 60}s`)
    );
    printInfo(chalk.gray(`Description: ${this.description}`));
    console.log('');

    // Show stages with tasks
    printInfo(chalk.cyan('Challenge Stages:'));
    this.stages.forEach((stage, index) => {
      printInfo(
        chalk.yellow(
          `\nStage ${index + 1}: ${stage.name} (${Math.floor(stage.duration / 60)}m ${stage.duration % 60}s)`
        )
      );
      printInfo(chalk.gray(stage.description));
      printInfo(chalk.gray('Key Tasks:'));
      stage.tasks.forEach((task) => {
        printInfo(chalk.gray(`  • ${task}`));
      });
    });
    console.log('');

    if (this.bossFight) {
      printWarning(chalk.red(`💀 BOSS FIGHT: ${this.bossDescription}`));
      printInfo(
        chalk.gray('You must successfully authenticate and authorize a series of test users')
      );
      console.log('');
    }

    // Start the challenge
    await this.runChallenge();
  }

  /**
   * Run the Build Auth challenge with specific stage tasks
   */
  async runChallenge() {
    // Start the timer
    this.timer = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateTimerDisplay();
    }, 1000);

    // Process each stage with specific tasks
    for (let i = 0; i < this.stages.length; i++) {
      if (this.interrupt) break;

      this.currentStage = i;
      const stage = this.stages[i];

      printInfo(chalk.blue(`\n🎯 STAGE ${i + 1}: ${stage.name}`));
      printInfo(chalk.gray(stage.description));
      printInfo(
        chalk.gray(`Duration: ${Math.floor(stage.duration / 60)}m ${stage.duration % 60}s`)
      );
      printInfo(chalk.gray('Tasks:'));
      stage.tasks.forEach((task) => {
        printInfo(chalk.gray(`  • ${task}`));
      });
      console.log('');

      // Show stage-specific guidance
      await this.showStageGuidance(stage);

      // Wait for stage duration or until interrupted
      await this.waitForStageCompletion(stage.duration);

      if (this.interrupt) break;

      // Stage completed
      printSuccess(chalk.green(`✅ Stage "${stage.name}" completed!`));
      this.score += Math.floor(stage.duration / 10); // Points based on time saved

      // Check if player wants to continue to next stage
      if (i < this.stages.length - 1) {
        const { continueChallenge } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueChallenge',
            message: chalk.green('Continue to next stage?'),
            default: true,
          },
        ]);

        if (!continueChallenge) {
          break;
        }
      }
    }

    // Boss fight if applicable
    if (this.bossFight && !this.interrupt) {
      await this.bossFight();
    }

    // Complete challenge
    this.completeChallenge();
  }

  /**
   * Show stage-specific guidance
   */
  async showStageGuidance(stage) {
    switch (stage.name) {
      case 'Planning':
        printInfo(chalk.gray('💡 Planning Tips:'));
        printInfo(chalk.gray('  - Consider different auth methods (JWT, Sessions, OAuth)'));
        printInfo(chalk.gray('  - Think about user roles and permissions'));
        printInfo(chalk.gray('  - Plan for security from the start'));
        break;
      case 'Design':
        printInfo(chalk.gray('🔧 Design Tips:'));
        printInfo(chalk.gray('  - Design a secure database schema'));
        printInfo(chalk.gray('  - Plan your API endpoints carefully'));
        printInfo(chalk.gray('  - Consider token management strategies'));
        break;
      case 'Security':
        printInfo(chalk.gray('🔒 Security Tips:'));
        printInfo(chalk.gray('  - Use bcrypt or scrypt for password hashing'));
        printInfo(chalk.gray('  - Implement rate limiting to prevent brute force'));
        printInfo(chalk.gray('  - Add proper input validation'));
        break;
      case 'Build':
        printInfo(chalk.gray('🛠️  Build Tips:'));
        printInfo(chalk.gray('  - Implement user registration first'));
        printInfo(chalk.gray('  - Add login/logout functionality'));
        printInfo(chalk.gray("  - Don't forget password reset"));
        break;
    }
  }

  /**
   * Handle the boss fight for Build Auth
   */
  async bossFight() {
    printWarning(chalk.red('\n💀 AUTHENTICATION BOSS FIGHT INITIATED!'));
    printInfo(chalk.yellow(this.bossDescription));
    printInfo(chalk.gray('You must demonstrate your auth system works correctly'));
    console.log('');

    // Simulate boss fight with authentication challenges
    const challenges = [
      { type: 'registration', description: 'Register a new user' },
      { type: 'login', description: 'Successfully login with credentials' },
      { type: 'authorization', description: 'Access protected resource' },
      { type: 'security', description: 'Handle invalid credentials securely' },
    ];

    let successCount = 0;

    for (const challenge of challenges) {
      printInfo(chalk.cyan(`\nChallenge: ${challenge.description}`));

      const { success } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'success',
          message: chalk.green(`Successfully completed ${challenge.type} challenge?`),
          default: true,
        },
      ]);

      if (success) {
        successCount++;
        printSuccess(chalk.green(`✅ ${challenge.type} challenge passed!`));
      } else {
        printError(chalk.red(`❌ ${challenge.type} challenge failed!`));
      }
    }

    // Calculate boss fight result
    const successRate = successCount / challenges.length;
    if (successRate >= 0.75) {
      // 3 out of 4 challenges passed
      printSuccess(chalk.green('🎉 AUTHENTICATION BOSS DEFEATED!'));
      this.score += 500; // Boss fight bonus
      printInfo(chalk.cyan('Your authentication system is battle-tested!'));
    } else {
      printError(chalk.red('💀 THE AUTHENTICATION BOSS DEFEATED YOU!'));
      printInfo(chalk.gray('Your system needs more work before facing the boss'));
    }
  }

  /**
   * Complete the Build Auth challenge
   */
  completeChallenge() {
    super.completeChallenge();

    // Add challenge-specific completion message
    if (this.completed) {
      printSuccess(chalk.green('\n🔐 AUTHENTICATION SYSTEM BUILT SUCCESSFULLY!'));
      printInfo(chalk.gray('You have created a robust authentication system'));
      printInfo(chalk.gray('Key components implemented:'));
      printInfo(chalk.gray('  ✓ Secure user registration'));
      printInfo(chalk.gray('  ✓ Secure login/logout'));
      printInfo(chalk.gray('  ✓ Password reset functionality'));
      printInfo(chalk.gray('  ✓ Role-based access control'));
      printInfo(chalk.gray('  ✓ Security measures (rate limiting, input validation)'));
      console.log('');
    }
  }
}

// Create a specific instance for the Build Auth challenge
const buildAuthChallenge = new BuildAuthChallenge();

/**
 * Register Build Auth challenge command
 */
export function registerBuildAuthChallengeCommand(program) {
  program
    .command('build-auth')
    .description('The Build Authentication System challenge')
    .action(async () => {
      try {
        await buildAuthChallenge.startChallenge();
      } catch (error) {
        printError(chalk.red(`Build Auth challenge failed: ${error.message}`));
      }
    });
}

export default {
  BuildAuthChallenge,
  buildAuthChallenge,
  registerBuildAuthChallengeCommand,
};
