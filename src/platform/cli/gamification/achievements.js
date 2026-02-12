// Copyright (c) 2026 Ultra-Dex

/**
 * Achievements System
 * Unlockable badges: "The Architect", "Speed Demon", "Bug Hunter"
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';

// Achievement definitions
const ACHIEVEMENTS = {
  'first-challenge': {
    id: 'first-challenge',
    name: 'First Steps',
    description: 'Complete your first challenge',
    icon: '🏁',
    rarity: 'common',
    unlockCondition: { type: 'challenge', count: 1 },
  },
  'the-architect': {
    id: 'the-architect',
    name: 'The Architect',
    description: 'Complete 10 architecture-related challenges',
    icon: '🏗️',
    rarity: 'rare',
    unlockCondition: { type: 'challenge-type', subtype: 'architecture', count: 10 },
  },
  'speed-demon': {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a challenge in under 50% of the allocated time',
    icon: '⚡',
    rarity: 'rare',
    unlockCondition: { type: 'time-efficiency', threshold: 0.5 },
  },
  'bug-hunter': {
    id: 'bug-hunter',
    name: 'Bug Hunter',
    description: 'Complete 5 debugging challenges',
    icon: '🐞',
    rarity: 'uncommon',
    unlockCondition: { type: 'challenge-type', subtype: 'debugging', count: 5 },
  },
  'code-warrior': {
    id: 'code-warrior',
    name: 'Code Warrior',
    description: 'Complete 20 coding challenges',
    icon: '⚔️',
    rarity: 'epic',
    unlockCondition: { type: 'challenge-type', subtype: 'coding', count: 20 },
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a challenge with 100% score',
    icon: '💯',
    rarity: 'rare',
    unlockCondition: { type: 'perfect-score', threshold: 1.0 },
  },
  marathoner: {
    id: 'marathoner',
    name: 'Marathoner',
    description: 'Complete 50 challenges',
    icon: '🏃',
    rarity: 'legendary',
    unlockCondition: { type: 'challenge', count: 50 },
  },
  'early-bird': {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a challenge in the first hour of the day',
    icon: '🌅',
    rarity: 'uncommon',
    unlockCondition: { type: 'time-of-day', hourRange: [5, 10] },
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a challenge between 10 PM and 5 AM',
    icon: '🦉',
    rarity: 'uncommon',
    unlockCondition: { type: 'time-of-day', hourRange: [22, 5] },
  },
  collaborator: {
    id: 'collaborator',
    name: 'Collaborator',
    description: 'Complete a challenge with others',
    icon: '👥',
    rarity: 'uncommon',
    unlockCondition: { type: 'multiplayer', count: 1 },
  },
  innovator: {
    id: 'innovator',
    name: 'Innovator',
    description: 'Complete a challenge with a creative solution',
    icon: '💡',
    rarity: 'rare',
    unlockCondition: { type: 'creative-solution', count: 1 },
  },
  'efficiency-expert': {
    id: 'efficiency-expert',
    name: 'Efficiency Expert',
    description: 'Complete 5 challenges with time efficiency > 75%',
    icon: '⏱️',
    rarity: 'epic',
    unlockCondition: { type: 'time-efficiency', count: 5, threshold: 0.75 },
  },
};

// Rarity colors
const RARITY_COLORS = {
  common: chalk.white,
  uncommon: chalk.green,
  rare: chalk.blue,
  epic: chalk.magenta,
  legendary: chalk.yellow,
};

class Achievement {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.description = def.description;
    this.icon = def.icon;
    this.rarity = def.rarity;
    this.unlockCondition = def.unlockCondition;
    this.unlocked = false;
    this.unlockedAt = null;
    this.progress = 0;
    this.target = def.unlockCondition.count || 1;
  }

  unlock() {
    if (!this.unlocked) {
      this.unlocked = true;
      this.unlockedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  updateProgress(amount = 1) {
    if (!this.unlocked) {
      this.progress = Math.min(this.target, this.progress + amount);
      return this.progress >= this.target;
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      rarity: this.rarity,
      unlockCondition: this.unlockCondition,
      unlocked: this.unlocked,
      unlockedAt: this.unlockedAt,
      progress: this.progress,
      target: this.target,
    };
  }

  static fromJSON(json) {
    const achievement = new Achievement(json);
    achievement.unlocked = json.unlocked;
    achievement.unlockedAt = json.unlockedAt;
    achievement.progress = json.progress;
    achievement.target = json.target;
    return achievement;
  }
}

class AchievementsSystem {
  constructor() {
    this.achievementsFile = path.join(process.cwd(), '.ultra', 'achievements.json');
    this.playerAchievements = new Map();
    this.availableAchievements = new Map();

    // Initialize available achievements
    Object.values(ACHIEVEMENTS).forEach((def) => {
      this.availableAchievements.set(def.id, new Achievement(def));
    });
  }

  /**
   * Initialize the achievements system
   */
  async initialize() {
    await this.loadAchievements();
  }

  /**
   * Load player achievements from file
   */
  async loadAchievements() {
    try {
      await fs.access(this.achievementsFile);
      const content = await fs.readFile(this.achievementsFile, 'utf8');
      const data = JSON.parse(content);

      // Load player's unlocked achievements
      if (data.playerAchievements) {
        for (const [id, ach] of Object.entries(data.playerAchievements)) {
          this.playerAchievements.set(id, Achievement.fromJSON(ach));
        }
      }
    } catch (error) {
      // File doesn't exist, initialize with empty map
      this.playerAchievements = new Map();
      await this.saveAchievements();
    }
  }

  /**
   * Save player achievements to file
   */
  async saveAchievements() {
    try {
      await fs.mkdir(path.dirname(this.achievementsFile), { recursive: true });

      const data = {
        playerAchievements: Object.fromEntries(
          Array.from(this.playerAchievements.entries()).map(([id, ach]) => [id, ach.toJSON()])
        ),
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(this.achievementsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`Failed to save achievements: ${error.message}`);
    }
  }

  /**
   * Check if an achievement is unlocked
   */
  isUnlocked(achievementId) {
    const achievement = this.playerAchievements.get(achievementId);
    return achievement ? achievement.unlocked : false;
  }

  /**
   * Get an achievement by ID
   */
  getAchievement(achievementId) {
    return (
      this.playerAchievements.get(achievementId) || this.availableAchievements.get(achievementId)
    );
  }

  /**
   * Get all achievements for a player
   */
  getPlayerAchievements() {
    return Array.from(this.playerAchievements.values());
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements() {
    return Array.from(this.playerAchievements.values()).filter((ach) => ach.unlocked);
  }

  /**
   * Get locked achievements
   */
  getLockedAchievements() {
    return Array.from(this.playerAchievements.values()).filter((ach) => !ach.unlocked);
  }

  /**
   * Award an achievement if conditions are met
   */
  async awardAchievement(achievementId, context = {}) {
    const availableAch = this.availableAchievements.get(achievementId);
    if (!availableAch) {
      return { success: false, message: `Achievement not found: ${achievementId}` };
    }

    // Check if already unlocked
    if (this.isUnlocked(achievementId)) {
      return { success: false, message: 'Already unlocked' };
    }

    // Check if conditions are met
    const conditionMet = this.checkCondition(availableAch, context);

    if (conditionMet) {
      // Create or update player's achievement
      const playerAch = this.playerAchievements.get(achievementId) || new Achievement(availableAch);

      if (playerAch.unlock()) {
        this.playerAchievements.set(achievementId, playerAch);
        await this.saveAchievements();

        // Show unlock notification
        this.showUnlockNotification(playerAch);

        return {
          success: true,
          achievement: playerAch,
          message: `Achievement unlocked: ${playerAch.name}!`,
        };
      }
    }

    // Update progress if applicable
    if (context.progressIncrement) {
      const playerAch = this.playerAchievements.get(achievementId) || new Achievement(availableAch);
      const progressMade = playerAch.updateProgress(context.progressIncrement);

      this.playerAchievements.set(achievementId, playerAch);
      await this.saveAchievements();

      if (progressMade) {
        // Condition is now met
        if (playerAch.unlock()) {
          await this.saveAchievements();
          this.showUnlockNotification(playerAch);

          return {
            success: true,
            achievement: playerAch,
            message: `Achievement unlocked: ${playerAch.name}!`,
          };
        }
      }
    }

    return { success: false, message: 'Conditions not met' };
  }

  /**
   * Check if achievement condition is met
   */
  checkCondition(achievement, context) {
    const condition = achievement.unlockCondition;

    switch (condition.type) {
      case 'challenge':
        return context.challengeCount >= condition.count;

      case 'challenge-type':
        return (
          context.challengeType === condition.subtype &&
          (context.challengeTypeCount || 0) >= condition.count
        );

      case 'time-efficiency':
        return context.timeEfficiency && context.timeEfficiency <= condition.threshold;

      case 'perfect-score':
        return context.score && context.score >= condition.threshold;

      case 'time-of-day': {
        const hour = new Date().getHours();
        if (condition.hourRange[0] <= condition.hourRange[1]) {
          return hour >= condition.hourRange[0] && hour <= condition.hourRange[1];
        } else {
          // Overnight range (e.g., 22 to 5)
          return hour >= condition.hourRange[0] || hour <= condition.hourRange[1];
        }
      }

      case 'multiplayer':
        return context.multiplayer && context.sessionCount >= condition.count;

      case 'creative-solution':
        return context.creativeSolution === true;

      default:
        return false;
    }
  }

  /**
   * Show achievement unlock notification
   */
  showUnlockNotification(achievement) {
    const color = RARITY_COLORS[achievement.rarity] || chalk.white;

    console.log('');
    printSuccess(color(`🎉 ACHIEVEMENT UNLOCKED: ${achievement.icon} ${achievement.name}!`));
    printInfo(color(`   ${achievement.description}`));
    printInfo(chalk.gray(`   Rarity: ${achievement.rarity.toUpperCase()}`));
    console.log('');
  }

  /**
   * Award achievements based on challenge completion
   */
  async awardChallengeAchievements(challengeName, score, duration, totalDuration) {
    const context = {
      challengeCount: 1,
      challengeType: challengeName.includes('auth')
        ? 'architecture'
        : challengeName.includes('bug')
          ? 'debugging'
          : 'coding',
      timeEfficiency: duration / totalDuration,
      score: score,
      creativeSolution: false, // Would be determined by challenge evaluation
    };

    // Update challenge type count
    const challengeType = context.challengeType;
    const typeCountKey = `${challengeType}Count`;
    context[typeCountKey] = (context[typeCountKey] || 0) + 1;

    // Check and award achievements
    const results = [];
    for (const [id, achievement] of this.availableAchievements.entries()) {
      if (!this.isUnlocked(id)) {
        const result = await this.awardAchievement(id, context);
        if (result.success) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Get achievement statistics
   */
  getStats() {
    const allAchievements = Array.from(this.availableAchievements.values());
    const unlocked = this.getUnlockedAchievements();

    const stats = {
      total: allAchievements.length,
      unlocked: unlocked.length,
      locked: allAchievements.length - unlocked.length,
      completionRate:
        allAchievements.length > 0 ? (unlocked.length / allAchievements.length) * 100 : 0,
      rarities: {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      },
    };

    // Count rarities
    unlocked.forEach((ach) => {
      stats.rarities[ach.rarity]++;
    });

    return stats;
  }

  /**
   * Render achievements display
   */
  renderAchievementsDisplay() {
    const unlocked = this.getUnlockedAchievements();
    const locked = this.getLockedAchievements();

    let display = '\n' + chalk.bgBlue.white('🏆 ACHIEVEMENTS 🏆') + '\n';
    display += chalk.blue('┌' + '─'.repeat(78) + '┐\n');

    // Stats header
    const stats = this.getStats();
    display +=
      chalk.blue('│ ') +
      chalk.bold.white(
        `Unlocked: ${stats.unlocked}/${stats.total} (${stats.completionRate.toFixed(1)}%)`.padEnd(
          76
        )
      ) +
      chalk.blue('│\n');
    display += chalk.blue('├' + '─'.repeat(78) + '┤\n');

    if (unlocked.length > 0) {
      display +=
        chalk.blue('│ ') +
        chalk.bold.yellow('UNLOCKED ACHIEVEMENTS:'.padEnd(76)) +
        chalk.blue('│\n');
      display += chalk.blue('├' + '─'.repeat(78) + '┤\n');

      unlocked.forEach((ach) => {
        const color = RARITY_COLORS[ach.rarity] || chalk.white;
        const progress = ach.target > 1 ? ` [${ach.progress}/${ach.target}]` : '';
        display +=
          chalk.blue('│ ') +
          color(`${ach.icon} ${ach.name} (${ach.rarity})`.padEnd(76)) +
          chalk.blue('│\n');
        display += chalk.blue('│ ') + chalk.gray(ach.description.padEnd(76)) + chalk.blue('│\n');
      });
    }

    if (locked.length > 0) {
      if (unlocked.length > 0) {
        display += chalk.blue('├' + '─'.repeat(78) + '┤\n');
      }
      display +=
        chalk.blue('│ ') + chalk.bold.yellow('LOCKED ACHIEVEMENTS:'.padEnd(76)) + chalk.blue('│\n');
      display += chalk.blue('├' + '─'.repeat(78) + '┤\n');

      locked.forEach((ach) => {
        const color = RARITY_COLORS[ach.rarity] || chalk.gray;
        const progress = ach.target > 1 ? ` [${ach.progress}/${ach.target}]` : '';
        display +=
          chalk.blue('│ ') +
          color(`${ach.icon} ${ach.name} (${ach.rarity})`.padEnd(76)) +
          chalk.blue('│\n');
        display += chalk.blue('│ ') + chalk.gray(ach.description.padEnd(76)) + chalk.blue('│\n');
      });
    }

    display += chalk.blue('└' + '─'.repeat(78) + '┘\n');

    return display;
  }
}

// Global instance
const achievementsSystem = new AchievementsSystem();

/**
 * Register achievements command
 */
export function registerAchievementsCommand(program) {
  const achievementsCmd = program
    .command('achievements')
    .alias('ach')
    .description('Achievements and unlockable badges');

  achievementsCmd
    .command('show')
    .description('Show your achievements')
    .action(async () => {
      try {
        await achievementsSystem.initialize();
        const display = achievementsSystem.renderAchievementsDisplay();
        console.log(display);
      } catch (error) {
        printError(chalk.red(`Achievements display failed: ${error.message}`));
      }
    });

  achievementsCmd
    .command('award')
    .description('Award an achievement (for testing)')
    .argument('<id>', 'Achievement ID')
    .action(async (id) => {
      try {
        await achievementsSystem.initialize();
        const result = await achievementsSystem.awardAchievement(id, { challengeCount: 1 });

        if (result.success) {
          printSuccess(chalk.green(result.message));
        } else {
          printWarning(chalk.yellow(result.message));
        }
      } catch (error) {
        printError(chalk.red(`Award achievement failed: ${error.message}`));
      }
    });

  achievementsCmd
    .command('list')
    .description('List all available achievements')
    .action(() => {
      printSuccess('📚 Available Achievements:\n');

      for (const [id, def] of Object.entries(ACHIEVEMENTS)) {
        const color = RARITY_COLORS[def.rarity] || chalk.white;
        printInfo(color(`${def.icon} ${def.name} (${def.rarity})`));
        printInfo(chalk.gray(`  ${def.description}`));
        printInfo(
          chalk.gray(
            `  Condition: ${def.unlockCondition.type} - ${def.unlockCondition.count || def.unlockCondition.threshold || def.unlockCondition.subtype || 'varies'}`
          )
        );
        console.log('');
      }
    });

  achievementsCmd
    .command('stats')
    .description('Show achievement statistics')
    .action(async () => {
      try {
        await achievementsSystem.initialize();
        const stats = achievementsSystem.getStats();

        printSuccess('📊 Achievement Statistics:');
        printInfo(`  Total Achievements: ${stats.total}`);
        printInfo(`  Unlocked: ${stats.unlocked}`);
        printInfo(`  Locked: ${stats.locked}`);
        printInfo(`  Completion Rate: ${stats.completionRate.toFixed(1)}%`);
        printInfo('  By Rarity:');
        printInfo(`    Common: ${stats.rarities.common}`);
        printInfo(`    Uncommon: ${stats.rarities.uncommon}`);
        printInfo(`    Rare: ${stats.rarities.rare}`);
        printInfo(`    Epic: ${stats.rarities.epic}`);
        printInfo(`    Legendary: ${stats.rarities.legendary}`);
      } catch (error) {
        printError(chalk.red(`Stats retrieval failed: ${error.message}`));
      }
    });

  achievementsCmd._examples = [
    { command: 'ultra-dex achievements show', description: 'Show your unlocked achievements' },
    { command: 'ultra-dex achievements list', description: 'List all available achievements' },
    { command: 'ultra-dex achievements stats', description: 'Show achievement statistics' },
  ];
}

export default {
  AchievementsSystem,
  Achievement,
  achievementsSystem,
  ACHIEVEMENTS,
  RARITY_COLORS,
  registerAchievementsCommand,
};
