// Copyright (c) 2026 Ultra-Dex

/**
 * Leaderboard System
 * Local high scores in .ultra/scores.json. ASCII leaderboard after challenge.
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';

// Leaderboard entry interface
class LeaderboardEntry {
  constructor(playerName, challenge, score, rank, date, duration) {
    this.playerName = playerName || 'Anonymous';
    this.challenge = challenge;
    this.score = score;
    this.rank = rank;
    this.date = date || new Date().toISOString();
    this.duration = duration || 0; // in seconds
    this.id = `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      playerName: this.playerName,
      challenge: this.challenge,
      score: this.score,
      rank: this.rank,
      date: this.date,
      duration: this.duration,
    };
  }

  static fromJSON(json) {
    const entry = new LeaderboardEntry();
    entry.id = json.id;
    entry.playerName = json.playerName;
    entry.challenge = json.challenge;
    entry.score = json.score;
    entry.rank = json.rank;
    entry.date = json.date;
    entry.duration = json.duration;
    return entry;
  }
}

class LeaderboardSystem {
  constructor() {
    this.leaderboardFile = path.join(process.cwd(), '.ultra', 'scores.json');
    this.entries = [];
    this.playerName = process.env.USER || process.env.USERNAME || 'Player';
  }

  /**
   * Initialize the leaderboard system
   */
  async initialize() {
    await this.loadScores();
  }

  /**
   * Load scores from file
   */
  async loadScores() {
    try {
      await fs.access(this.leaderboardFile);
      const content = await fs.readFile(this.leaderboardFile, 'utf8');
      const data = JSON.parse(content);

      this.entries = Array.isArray(data) ? data.map(LeaderboardEntry.fromJSON) : [];
    } catch (error) {
      // File doesn't exist, initialize with empty array
      this.entries = [];
      await this.saveScores();
    }
  }

  /**
   * Save scores to file
   */
  async saveScores() {
    try {
      await fs.mkdir(path.dirname(this.leaderboardFile), { recursive: true });
      await fs.writeFile(this.leaderboardFile, JSON.stringify(this.entries, null, 2));
    } catch (error) {
      throw new Error(`Failed to save scores: ${error.message}`);
    }
  }

  /**
   * Add a new score
   */
  async addScore(playerName, challenge, score, rank, duration) {
    const entry = new LeaderboardEntry(
      playerName,
      challenge,
      score,
      rank,
      new Date().toISOString(),
      duration
    );
    this.entries.push(entry);

    // Sort by score (descending) and keep top 100
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, 100);

    await this.saveScores();
    return entry;
  }

  /**
   * Get top scores
   */
  getTopScores(limit = 10) {
    return this.entries.slice(0, limit);
  }

  /**
   * Get player's rank
   */
  getPlayerRank(playerName) {
    const playerEntries = this.entries.filter((entry) => entry.playerName === playerName);
    if (playerEntries.length === 0) {
      return { rank: -1, totalPlayers: this.entries.length, scores: [] };
    }

    // Sort entries by score for this player
    playerEntries.sort((a, b) => b.score - a.score);

    // Find the highest rank among all entries for this player
    const allSorted = [...this.entries].sort((a, b) => b.score - a.score);
    const playerRank = allSorted.findIndex((entry) => entry.playerName === playerName) + 1;

    return {
      rank: playerRank,
      totalPlayers: this.entries.length,
      scores: playerEntries,
    };
  }

  /**
   * Get scores for a specific challenge
   */
  getChallengeScores(challengeName, limit = 10) {
    const challengeEntries = this.entries
      .filter((entry) => entry.challenge === challengeName)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return challengeEntries;
  }

  /**
   * Get scores for a specific player
   */
  getPlayerScores(playerName) {
    return this.entries
      .filter((entry) => entry.playerName === playerName)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get leaderboard statistics
   */
  getStats() {
    if (this.entries.length === 0) {
      return {
        totalScores: 0,
        totalPlayers: 0,
        topScore: 0,
        averageScore: 0,
        challenges: [],
      };
    }

    const players = [...new Set(this.entries.map((entry) => entry.playerName))];
    const challenges = [...new Set(this.entries.map((entry) => entry.challenge))];
    const topScore = Math.max(...this.entries.map((entry) => entry.score));
    const averageScore =
      this.entries.reduce((sum, entry) => sum + entry.score, 0) / this.entries.length;

    return {
      totalScores: this.entries.length,
      totalPlayers: players.length,
      topScore,
      averageScore,
      challenges,
    };
  }

  /**
   * Render ASCII leaderboard
   */
  renderASCIIBoard(limit = 10) {
    const topScores = this.getTopScores(limit);

    if (topScores.length === 0) {
      return chalk.yellow('No scores yet! Be the first to complete a challenge.');
    }

    let board = '\n' + chalk.bgBlue.white('🏆 ULTRA-DEX LEADERBOARD 🏆') + '\n';
    board += chalk.blue('┌' + '─'.repeat(78) + '┐\n');

    // Header
    board +=
      chalk.blue('│ ') +
      chalk.bold.white('Rank'.padEnd(6)) +
      chalk.bold.white('Player'.padEnd(20)) +
      chalk.bold.white('Challenge'.padEnd(20)) +
      chalk.bold.white('Score'.padEnd(12)) +
      chalk.bold.white('Rank'.padEnd(10)) +
      chalk.blue('│\n');
    board += chalk.blue('├' + '─'.repeat(78) + '┤\n');

    // Entries
    topScores.forEach((entry, index) => {
      const rank = index + 1;
      const rankText =
        rank === 1
          ? chalk.yellow('🥇')
          : rank === 2
            ? chalk.grey('🥈')
            : rank === 3
              ? chalk.yellow('🥉')
              : ` ${rank}.`;

      const playerText =
        entry.playerName.length > 18 ? entry.playerName.substring(0, 15) + '...' : entry.playerName;

      const challengeText =
        entry.challenge.length > 18 ? entry.challenge.substring(0, 15) + '...' : entry.challenge;

      const scoreText = entry.score.toString().padStart(10);

      let rankBadge = chalk.green(entry.rank);
      if (entry.rank.includes('Grandmaster')) rankBadge = chalk.magenta(entry.rank);
      else if (entry.rank.includes('Master')) rankBadge = chalk.red(entry.rank);
      else if (entry.rank.includes('Expert')) rankBadge = chalk.cyan(entry.rank);
      else if (entry.rank.includes('Advanced')) rankBadge = chalk.blue(entry.rank);

      board +=
        chalk.blue('│ ') +
        chalk.yellow(rankText.padEnd(6)) +
        chalk.white(playerText.padEnd(20)) +
        chalk.gray(challengeText.padEnd(20)) +
        chalk.green(scoreText.padEnd(12)) +
        rankBadge.padEnd(10) +
        chalk.blue('│\n');
    });

    board += chalk.blue('└' + '─'.repeat(78) + '┘\n');

    // Add legend
    board += chalk.gray('\nLegend: 🥇 Gold (1st), 🥈 Silver (2nd), 🥉 Bronze (3rd)\n');

    return board;
  }

  /**
   * Render challenge-specific leaderboard
   */
  renderChallengeBoard(challengeName, limit = 10) {
    const challengeScores = this.getChallengeScores(challengeName, limit);

    if (challengeScores.length === 0) {
      return chalk.yellow(`No scores for challenge: ${challengeName}`);
    }

    let board = `\n${chalk.bgBlue.white(`🏆 ${challengeName.toUpperCase()} LEADERBOARD 🏆`)}\n`;
    board += chalk.blue('┌' + '─'.repeat(68) + '┐\n');

    // Header
    board +=
      chalk.blue('│ ') +
      chalk.bold.white('Rank'.padEnd(6)) +
      chalk.bold.white('Player'.padEnd(20)) +
      chalk.bold.white('Score'.padEnd(12)) +
      chalk.bold.white('Rank'.padEnd(10)) +
      chalk.bold.white('Time'.padEnd(10)) +
      chalk.blue('│\n');
    board += chalk.blue('├' + '─'.repeat(68) + '┤\n');

    // Entries
    challengeScores.forEach((entry, index) => {
      const rank = index + 1;
      const rankText =
        rank === 1
          ? chalk.yellow('🥇')
          : rank === 2
            ? chalk.grey('🥈')
            : rank === 3
              ? chalk.yellow('🥉')
              : ` ${rank}.`;

      const playerText =
        entry.playerName.length > 18 ? entry.playerName.substring(0, 15) + '...' : entry.playerName;

      const scoreText = entry.score.toString().padStart(10);
      const timeText = `${Math.floor(entry.duration / 60)}m${entry.duration % 60}s`.padStart(8);

      let rankBadge = chalk.green(entry.rank);
      if (entry.rank.includes('Grandmaster')) rankBadge = chalk.magenta(entry.rank);
      else if (entry.rank.includes('Master')) rankBadge = chalk.red(entry.rank);
      else if (entry.rank.includes('Expert')) rankBadge = chalk.cyan(entry.rank);
      else if (entry.rank.includes('Advanced')) rankBadge = chalk.blue(entry.rank);

      board +=
        chalk.blue('│ ') +
        chalk.yellow(rankText.padEnd(6)) +
        chalk.white(playerText.padEnd(20)) +
        chalk.green(scoreText.padEnd(12)) +
        rankBadge.padEnd(10) +
        chalk.gray(timeText.padEnd(10)) +
        chalk.blue('│\n');
    });

    board += chalk.blue('└' + '─'.repeat(68) + '┘\n');

    return board;
  }

  /**
   * Clear all scores (admin function)
   */
  async clearScores() {
    this.entries = [];
    await this.saveScores();
  }
}

// Global instance
const leaderboardSystem = new LeaderboardSystem();

/**
 * Register leaderboard command
 */
export function registerLeaderboardCommand(program) {
  const leaderboardCmd = program
    .command('leaderboard')
    .alias('lb')
    .description('Leaderboard system for challenge scores');

  leaderboardCmd
    .command('show')
    .description('Show the global leaderboard')
    .option('-l, --limit <number>', 'Number of entries to show', '10')
    .action(async (options) => {
      try {
        await leaderboardSystem.initialize();
        const board = leaderboardSystem.renderASCIIBoard(parseInt(options.limit));
        logger.log(board);
      } catch (error) {
        printError(chalk.red(`Leaderboard display failed: ${error.message}`));
      }
    });

  leaderboardCmd
    .command('challenge')
    .description('Show leaderboard for a specific challenge')
    .argument('<challenge>', 'Challenge name')
    .option('-l, --limit <number>', 'Number of entries to show', '10')
    .action(async (challenge, options) => {
      try {
        await leaderboardSystem.initialize();
        const board = leaderboardSystem.renderChallengeBoard(challenge, parseInt(options.limit));
        logger.log(board);
      } catch (error) {
        printError(chalk.red(`Challenge leaderboard failed: ${error.message}`));
      }
    });

  leaderboardCmd
    .command('player')
    .description("Show a player's scores")
    .argument('<player>', 'Player name')
    .action(async (player) => {
      try {
        await leaderboardSystem.initialize();
        const playerScores = leaderboardSystem.getPlayerScores(player);

        if (playerScores.length === 0) {
          printWarning(chalk.yellow(`No scores found for player: ${player}`));
          return;
        }

        printSuccess(chalk.green(`Scores for ${player}:`));
        playerScores.forEach((score, index) => {
          printInfo(`${index + 1}. ${score.challenge}: ${score.score} pts (${score.rank})`);
        });

        const playerRank = leaderboardSystem.getPlayerRank(player);
        printInfo(
          chalk.cyan(`Overall Rank: ${playerRank.rank} of ${playerRank.totalPlayers} players`)
        );
      } catch (error) {
        printError(chalk.red(`Player scores failed: ${error.message}`));
      }
    });

  leaderboardCmd
    .command('stats')
    .description('Show leaderboard statistics')
    .action(async () => {
      try {
        await leaderboardSystem.initialize();
        const stats = leaderboardSystem.getStats();

        printSuccess('📊 Leaderboard Statistics:');
        printInfo(`  Total Scores: ${stats.totalScores}`);
        printInfo(`  Total Players: ${stats.totalPlayers}`);
        printInfo(`  Highest Score: ${stats.topScore}`);
        printInfo(`  Average Score: ${stats.averageScore.toFixed(2)}`);
        printInfo(`  Challenges: ${stats.challenges.join(', ')}`);
      } catch (error) {
        printError(chalk.red(`Stats retrieval failed: ${error.message}`));
      }
    });

  leaderboardCmd._examples = [
    { command: 'ultra-dex leaderboard show', description: 'Show global leaderboard' },
    {
      command: 'ultra-dex leaderboard challenge build-auth',
      description: 'Show build-auth challenge leaderboard',
    },
    { command: 'ultra-dex leaderboard player john', description: "Show john's scores" },
    { command: 'ultra-dex leaderboard stats', description: 'Show leaderboard statistics' },
  ];
}

export default {
  LeaderboardSystem,
  LeaderboardEntry,
  leaderboardSystem,
  registerLeaderboardCommand,
};
