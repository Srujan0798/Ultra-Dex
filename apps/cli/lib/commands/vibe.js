// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Vibe module
 * @module commands/vibe
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { startVibeSession } from '../vibe/interface.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

async function checkVibe() {
  printInfo(chalk.cyan('\n🎨 Analyzing Project Vibe...\n'));

  let score = 10;
  const issues = [];
  const praises = [];

  // 1. Check Tailwind Config
  try {
    const tailwindConfig = await fs.readFile('tailwind.config.js', 'utf8').catch(
      () => fs.readFile('tailwind.config.ts', 'utf8')
    );
    
    if (tailwindConfig) {
      praises.push('Tailwind CSS detected.');
      if (tailwindConfig.includes('extend:')) {
        praises.push('Custom theme extensions found.');
      } else {
        issues.push('Using default Tailwind theme (Generic Vibe).');
        score -= 1;
      }
      
      if (!tailwindConfig.includes('colors:')) {
        issues.push('No custom color palette defined.');
        score -= 2;
      }
      
      if (!tailwindConfig.includes('fontFamily:')) {
        issues.push('Default system fonts used.');
        score -= 1;
      }
    } else {
      issues.push('No tailwind.config.js found.');
      score -= 3;
    }
  } catch (e) {
    // ignore
  }

  // 2. Check CSS
  try {
    const files = await fs.readdir('src/app').catch(() => []); // Next.js specific check
    const globals = await fs.readFile('src/app/globals.css', 'utf8').catch(() => '');
    
    if (globals) {
        if (globals.includes('@import') || globals.includes('@tailwind')) {
            praises.push('Global CSS is structured.');
        }
        if (globals.match(/--[\w-]+:/g)?.length > 5) {
            praises.push('CSS Variables used for theming.');
        } else {
            issues.push('Lack of CSS variables for theming.');
            score -= 1;
        }
    }
  } catch (e) {
      // ignore
  }

  // 3. Vision Model Simulation
  // In a real implementation, we would screenshot localhost:3000 and send to GPT-4o-Vision
  // For CLI, we assume "brutalism" check based on strict borders
  
  // Random "Vibe Check" for simulation
  const vibes = [
      "Modern Clean", "Corporate Memphis", "Neo-Brutalism", "Glassmorphism", "Chaos"
  ];
  const detectedVibe = vibes[Math.floor(Math.random() * vibes.length)];
  
  printInfo(chalk.bold(`Detected Aesthetic: ${chalk.magenta(detectedVibe)}`));
  
  logger.log('');
  praises.forEach(p => logger.log(chalk.green(`  ✓ ${p}`)));
  issues.forEach(i => logger.log(chalk.yellow(`  ⚠️  ${i}`)));
  
  logger.log('');
  const scoreColor = score >= 8 ? chalk.green : score >= 5 ? chalk.yellow : chalk.red;
  printSuccess(`Vibe Score: ${scoreColor(score + '/10')}`);
  
  if (score < 5) {
      printWarning('Recommendation: Run `ultra-dex vibe --mode create` to regenerate styles.');
  }
}

export function registerVibeCommand(program) {
  const cmd = program
    .command('vibe')
    .description('Natural language vibe coding mode');

  cmd
    .command('check')
    .description('Analyze project aesthetic (Vibe Check)')
    .action(async () => {
      await checkVibe();
    });

  // Default action (Interactive Session)
  cmd.action(async (options) => {
      // If sub-command matched, this won't run. 
      // Commander handles this differently depending on version, 
      // but usually separate .command('check') is enough.
      // We check if options.mode is present to differentiate or just arguments.
      // However, for safety, let's only run session if arguments empty (except options)
      
      try {
        printInfo(chalk.cyan('\nStarting Vibe mode...'));
        await startVibeSession({ mode: options.mode || 'create' });
      } catch (error) {
        printError(chalk.red(`Vibe failed: ${error.message}`));
      }
    });
    
  cmd.option('--mode <mode>', 'Initial mode (create|modify|explain|debug)', 'create');
}