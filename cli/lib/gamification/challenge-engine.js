// Copyright (c) 2026 Ultra-Dex

/**
 * Challenge Mode Engine
 * ultra-dex challenge start [name] with Countdown Timer, Real-time Score, Rank output
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import fs from 'fs/promises';
import path from 'path';

// Challenge definitions
const CHALLENGES = {
  'build-auth': {
    name: 'Build Authentication System',
    description: 'Build a complete authentication system from scratch',
    difficulty: 'hard',
    duration: 20 * 60, // 20 minutes in seconds
    stages: [
      { name: 'Planning', duration: 5 * 60, description: 'Plan the auth system architecture' },
      { name: 'Design', duration: 7 * 60, description: 'Design the database schema and API' },
      { name: 'Security', duration: 8 * 60, description: 'Implement security measures' },
      { name: 'Build', duration: 10 * 60, description: 'Build the authentication system' },
    ],
    bossFight: true,
    bossDescription: 'Complete integration test with all security measures',
    points: 1000,
  },
  'code-refactor': {
    name: 'Legacy Code Refactor',
    description: 'Refactor a legacy codebase to modern standards',
    difficulty: 'medium',
    duration: 15 * 60, // 15 minutes
    stages: [
      { name: 'Analysis', duration: 4 * 60, description: 'Analyze the legacy code' },
      { name: 'Planning', duration: 3 * 60, description: 'Plan the refactoring approach' },
      { name: 'Refactor', duration: 8 * 60, description: 'Refactor the code' },
    ],
    bossFight: false,
    points: 750,
  },
  'bug-hunt': {
    name: 'Bug Hunt',
    description: 'Find and fix hidden bugs in a codebase',
    difficulty: 'easy',
    duration: 10 * 60, // 10 minutes
    stages: [
      { name: 'Investigation', duration: 4 * 60, description: 'Investigate the code for bugs' },
      { name: 'Fixing', duration: 6 * 60, description: 'Fix the identified bugs' },
    ],
    bossFight: false,
    points: 500,
  },
  'feature-sprint': {
    name: 'Feature Sprint',
    description: 'Implement a new feature under tight deadline',
    difficulty: 'hard',
    duration: 25 * 60, // 25 minutes
    stages: [
      { name: 'Requirements', duration: 5 * 60, description: 'Clarify feature requirements' },
      { name: 'Design', duration: 5 * 60, description: 'Design the feature implementation' },
      { name: 'Development', duration: 10 * 60, description: 'Develop the feature' },
      { name: 'Testing', duration: 5 * 60, description: 'Test the feature' },
    ],
    bossFight: true,
    bossDescription: 'Performance and security validation',
    points: 1200,
  },
};

class ChallengeEngine {
  constructor() {
    this.activeChallenge = null;
    this.timer = null;
    this.startTime = null;
    this.elapsedTime = 0;
    this.currentStage = 0;
    this.score = 0;
    this.rank = 'Novice';
    this.completed = false;
    this.interrupt = false;
  }

  /**
   * Start a challenge
   */
  async startChallenge(challengeName) {
    const challenge = CHALLENGES[challengeName];
    if (!challenge) {
      throw new Error(`Challenge not found: ${challengeName}`);
    }

    this.activeChallenge = challenge;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.currentStage = 0;
    this.score = 0;
    this.completed = false;
    this.interrupt = false;

    printSuccess(chalk.green(`🚀 Starting Challenge: ${challenge.name}`));
    printInfo(chalk.gray(`Difficulty: ${challenge.difficulty} | Points: ${challenge.points}`));
    printInfo(
      chalk.gray(`Duration: ${Math.floor(challenge.duration / 60)}m ${challenge.duration % 60}s`)
    );
    printInfo(chalk.gray(`Description: ${challenge.description}`));
    console.log('');

    // Show stages
    printInfo(chalk.cyan('Stages:'));
    challenge.stages.forEach((stage, index) => {
      printInfo(
        chalk.gray(
          `  ${index + 1}. ${stage.name} (${Math.floor(stage.duration / 60)}m ${stage.duration % 60}s) - ${stage.description}`
        )
      );
    });
    console.log('');

    if (challenge.bossFight) {
      printWarning(chalk.yellow(`💀 BOSS FIGHT: ${challenge.bossDescription}`));
      console.log('');
    }

    // Start the challenge
    await this.runChallenge();
  }

  /**
   * Run the challenge with timer and stages
   */
  async runChallenge() {
    const challenge = this.activeChallenge;

    // Start the timer
    this.timer = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateTimerDisplay();
    }, 1000);

    // Process each stage
    for (let i = 0; i < challenge.stages.length; i++) {
      if (this.interrupt) break;

      this.currentStage = i;
      const stage = challenge.stages[i];

      printInfo(chalk.blue(`\n🎯 STAGE ${i + 1}: ${stage.name}`));
      printInfo(chalk.gray(stage.description));
      printInfo(
        chalk.gray(`Duration: ${Math.floor(stage.duration / 60)}m ${stage.duration % 60}s`)
      );
      console.log('');

      // Wait for stage duration or until interrupted
      await this.waitForStageCompletion(stage.duration);

      if (this.interrupt) break;

      // Stage completed
      printSuccess(chalk.green(`✅ Stage "${stage.name}" completed!`));
      this.score += Math.floor(stage.duration / 10); // Points based on time saved

      // Check if player wants to continue to next stage
      if (i < challenge.stages.length - 1) {
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
    if (challenge.bossFight && !this.interrupt) {
      await this.bossFight(challenge);
    }

    // Complete challenge
    this.completeChallenge();
  }

  /**
   * Wait for stage completion
   */
  async waitForStageCompletion(duration) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.interrupt) {
          resolve();
        }
      }, duration * 1000);
    });
  }

  /**
   * Handle boss fight
   */
  async bossFight(challenge) {
    printWarning(chalk.red('\n💀 BOSS FIGHT INITIATED!'));
    printInfo(chalk.yellow(challenge.bossDescription));
    console.log('');

    // Simulate boss fight
    const { success } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'success',
        message: chalk.red('Can you defeat the boss?'),
        default: true,
      },
    ]);

    if (success) {
      printSuccess(chalk.green('🎉 BOSS DEFEATED!'));
      this.score += 500; // Boss fight bonus
    } else {
      printError(chalk.red('💀 BOSS DEFEATED YOU!'));
    }
  }

  /**
   * Update timer display
   */
  updateTimerDisplay() {
    if (!this.activeChallenge) return;

    const remaining = this.activeChallenge.duration - this.elapsedTime;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    // Clear line and update timer
    process.stdout.write(
      `\r${chalk.yellow(`⏰ Time remaining: ${minutes}m ${seconds}s | Stage: ${this.currentStage + 1}/${this.activeChallenge.stages.length} | Score: ${this.score}`)}`
    );
  }

  /**
   * Complete the challenge
   */
  completeChallenge() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.completed = true;

    // Calculate final score and rank
    const timeBonus = Math.max(0, this.activeChallenge.duration - this.elapsedTime);
    this.score += timeBonus * 2; // Bonus for finishing early

    this.rank = this.calculateRank(this.score);

    // Display results
    console.log('\n');
    printSuccess(chalk.green('🏆 CHALLENGE COMPLETED! 🏆'));
    console.log('');
    printInfo(chalk.cyan(`Challenge: ${this.activeChallenge.name}`));
    printInfo(chalk.cyan(`Final Score: ${this.score}`));
    printInfo(chalk.cyan(`Rank: ${this.rank}`));
    printInfo(
      chalk.cyan(`Time Taken: ${Math.floor(this.elapsedTime / 60)}m ${this.elapsedTime % 60}s`)
    );
    printInfo(
      chalk.cyan(`Stages Completed: ${this.currentStage + 1}/${this.activeChallenge.stages.length}`)
    );
    console.log('');

    // Show rank description
    this.showRankDescription(this.rank);

    // Save score to leaderboard
    this.saveScore().catch((err) => {
      printWarning(chalk.yellow(`Could not save score: ${err.message}`));
    });
  }

  /**
   * Calculate rank based on score
   */
  calculateRank(score) {
    if (score >= 2000) return 'Grandmaster';
    if (score >= 1500) return 'Master';
    if (score >= 1000) return 'Expert';
    if (score >= 750) return 'Advanced';
    if (score >= 500) return 'Intermediate';
    if (score >= 250) return 'Beginner';
    return 'Novice';
  }

  /**
   * Show rank description
   */
  showRankDescription(rank) {
    const descriptions = {
      Grandmaster: '🏆 Legendary skill! You are a true master of the craft.',
      Master: '⭐ Mastery achieved! Your skills are exceptional.',
      Expert: '💎 Expert level! You demonstrate great proficiency.',
      Advanced: "🔥 Advanced skills! You're getting really good.",
      Intermediate: '👍 Intermediate level! Keep practicing to improve.',
      Beginner: '🌱 Beginner level! Good start, keep learning.',
      Novice: '🆕 Novice level! Every expert was once a beginner.',
    };

    printInfo(chalk.gray(descriptions[rank] || 'Keep improving your skills!'));
  }

  /**
   * Save score to leaderboard
   */
  async saveScore() {
    const scoresDir = path.join(process.cwd(), '.ultra', 'scores');
    await fs.mkdir(scoresDir, { recursive: true });

    const scoresFile = path.join(scoresDir, 'challenge-scores.json');

    let scores = [];
    try {
      const content = await fs.readFile(scoresFile, 'utf8');
      scores = JSON.parse(content);
    } catch (error) {
      // File doesn't exist, start with empty array
    }

    // Add new score
    scores.push({
      challenge: this.activeChallenge.name,
      score: this.score,
      rank: this.rank,
      date: new Date().toISOString(),
      duration: this.elapsedTime,
    });

    // Sort by score (descending)
    scores.sort((a, b) => b.score - a.score);

    // Keep only top 100 scores
    scores = scores.slice(0, 100);

    // Save scores
    await fs.writeFile(scoresFile, JSON.stringify(scores, null, 2));
  }

  /**
   * Cancel the challenge
   */
  cancelChallenge() {
    this.interrupt = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    printInfo(chalk.yellow('\n❌ Challenge cancelled'));
  }

  /**
   * Get available challenges
   */
  getAvailableChallenges() {
    return Object.keys(CHALLENGES).map((key) => ({
      id: key,
      ...CHALLENGES[key],
    }));
  }
}

// Global instance
const challengeEngine = new ChallengeEngine();

/**
 * Register challenge command
 */
export function registerChallengeCommand(program) {
  const challengeCmd = program
    .command('challenge')
    .description('Gamification challenges with scoring and leaderboards');

  challengeCmd
    .command('start')
    .description('Start a challenge')
    .argument('<name>', 'Challenge name')
    .action(async (name) => {
      try {
        // Check if challenge exists
        if (!CHALLENGES[name]) {
          printError(chalk.red(`Challenge not found: ${name}`));
          printInfo(chalk.gray('Available challenges:'));
          Object.keys(CHALLENGES).forEach((challenge) => {
            printInfo(chalk.gray(`  - ${challenge}: ${CHALLENGES[challenge].description}`));
          });
          return;
        }

        // Handle SIGINT (Ctrl+C) to cancel challenge gracefully
        const handleSigInt = () => {
          if (challengeEngine.activeChallenge && !challengeEngine.completed) {
            challengeEngine.cancelChallenge();
            process.exit(0);
          }
        };

        process.on('SIGINT', handleSigInt);

        await challengeEngine.startChallenge(name);

        process.removeListener('SIGINT', handleSigInt);
      } catch (error) {
        printError(chalk.red(`Challenge failed: ${error.message}`));
      }
    });

  challengeCmd
    .command('list')
    .description('List available challenges')
    .action(() => {
      printSuccess(chalk.green('Available Challenges:\n'));

      for (const [name, challenge] of Object.entries(CHALLENGES)) {
        printInfo(chalk.cyan(`${name} (${challenge.difficulty})`));
        printInfo(chalk.gray(`  ${challenge.description}`));
        printInfo(
          chalk.gray(
            `  Duration: ${Math.floor(challenge.duration / 60)}m | Points: ${challenge.points}`
          )
        );
        if (challenge.bossFight) {
          printInfo(chalk.red('  💀 Boss Fight Included'));
        }
        console.log('');
      }
    });

  challengeCmd._examples = [
    {
      command: 'ultra-dex challenge start build-auth',
      description: 'Start the authentication challenge',
    },
    {
      command: 'ultra-dex challenge start bug-hunt',
      description: 'Start the bug hunting challenge',
    },
    { command: 'ultra-dex challenge list', description: 'List all available challenges' },
  ];
}

export default {
  ChallengeEngine,
  challengeEngine,
  CHALLENGES,
  registerChallengeCommand,
};
