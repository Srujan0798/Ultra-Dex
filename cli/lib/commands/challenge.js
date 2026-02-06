// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import leaderboardModule from '../gamification/leaderboard.js';
import achievementsModule from '../gamification/achievements.js';
import { fileURLToPath } from 'url';

const { LeaderboardSystem } = leaderboardModule;
const { AchievementsSystem } = achievementsModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHALLENGE_DIR = path.resolve(__dirname, '../../assets/challenges');

async function listChallenges() {
  try {
    const entries = await fs.readdir(CHALLENGE_DIR);
    return entries.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  } catch {
    return [];
  }
}

async function loadChallenge(name) {
  const fileName = name.endsWith('.json') ? name : `${name}.json`;
  const candidate = path.join(CHALLENGE_DIR, fileName);
  try {
    const raw = await fs.readFile(candidate, 'utf8');
    return JSON.parse(raw);
  } catch {
    throw new Error(`Challenge '${name}' not found.`);
  }
}

function rankForScore(score) {
  if (score >= 95) return 'S-Class';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

async function countdown(seconds, label) {
  for (let remaining = seconds; remaining >= 0; remaining--) {
    process.stdout.write(`\r${chalk.cyan(label)} ${chalk.yellow(String(remaining).padStart(3))}s `);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  process.stdout.write('\n');
}

export function registerChallengeCommand(program) {
  const cmd = program.command('challenge').description('Gamified build challenges');

  cmd
    .command('list')
    .description('List available challenges')
    .action(async () => {
      const challenges = await listChallenges();
      if (!challenges.length) {
        printWarning('No challenges found.');
        return;
      }
      challenges.forEach((c) => printInfo(`- ${c}`));
    });

  cmd
    .command('start [name]')
    .description('Start a timed challenge')
    .option('--fast', 'Run with accelerated timers')
    .option('--player <name>', 'Player name override')
    .action(async (name = 'auth-30m', options) => {
      try {
        const challenge = await loadChallenge(name);
        const leaderboard = new LeaderboardSystem();
        const achievements = new AchievementsSystem();
        await leaderboard.initialize();
        await achievements.initialize();

        const startTime = Date.now();
        const totalMinutes = challenge.stages.reduce((sum, stage) => sum + stage.minutes, 0);
        const totalSeconds = options.fast ? challenge.stages.length : totalMinutes * 60;

        printSuccess(`\n🏁 Challenge Started: ${challenge.title}`);
        printInfo(`Stages: ${challenge.stages.length} · Total Time: ${totalMinutes} minutes`);

        for (const stage of challenge.stages) {
          printInfo(`\n⏱️  ${stage.name} (${stage.minutes}m)`);
          const seconds = options.fast ? 1 : stage.minutes * 60;
          await countdown(seconds, stage.name);
        }

        const durationSec = Math.round((Date.now() - startTime) / 1000);
        const efficiency = totalSeconds ? durationSec / totalSeconds : 1;
        const score = Math.max(0, Math.round((1 - Math.min(1, efficiency)) * 100));
        const rank = rankForScore(score);

        printSuccess(`\nChallenge Complete! Rank: ${rank}`);
        printInfo(`Score: ${score} · Duration: ${durationSec}s`);

        await leaderboard.addScore(options.player, name, score, rank, durationSec);
        const awarded = await achievements.awardChallengeAchievements(
          name,
          score / 100,
          durationSec,
          totalSeconds
        );

        if (awarded.length) {
          printSuccess('Achievements unlocked:');
          awarded.forEach((a) => printInfo(`- ${a.achievement?.name || 'Achievement'}`));
        }

        printInfo('\nLeaderboard:');
        console.log(leaderboard.renderASCIIBoard(5));
      } catch (error) {
        printError(chalk.red(`Challenge failed: ${error.message}`));
      }
    });

  cmd._examples = [
    { command: 'ultra-dex challenge list', description: 'List challenges' },
    { command: 'ultra-dex challenge start auth-30m', description: 'Start auth challenge' },
    { command: 'ultra-dex challenge start auth-30m --fast', description: 'Fast mode' },
  ];
}

export default {
  registerChallengeCommand,
};
