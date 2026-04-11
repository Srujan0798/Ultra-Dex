// Copyright (c) 2026 Ultra-Dex

import boxen from '../utils/boxen.js';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { VERSION } from '../utils/version.js';
import { logger } from '../utils/logger.js';

const asciiLogo = `
██╗   ██╗██╗  ████████╗██████╗  █████╗       ██████╗ ███████╗██╗  ██╗
██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝
██║   ██║██║     ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗
╚██████╔╝███████╗██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝`;

export const banner = asciiLogo;

/**
 * Display the Ultra-Dex visual banner
 */
export function showBanner(version = VERSION) {
  const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);

  logger.print(ultraGradient.multiline(asciiLogo));

  const info = [
    '',
    `${chalk.bold.magenta('v' + version)} ${chalk.bold.yellow('「 THE ENDGAME 」')} ${chalk.dim('🎮')}`,
    '',
    `${chalk.cyan('AI Orchestration Meta-Layer for SaaS Development')}`,
    '',
    `${chalk.green('✓')} ${chalk.white('Protocol 21')} ${chalk.green('ACTIVE')}`,
    `${chalk.green('✓')} ${chalk.white('Memory Tiers')} ${chalk.green('ONLINE')}`,
    `${chalk.green('✓')} ${chalk.white('Governance')} ${chalk.green('ENFORCED')}`,
    '',
    `${chalk.italic.dim('"Perfectly balanced, as all code should be."')}`,
  ].join('\n');

  logger.print(
    boxen(info, {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'bold',
      borderColor: '#d946ef',
      textAlignment: 'center',
      title: '🚀 ULTRA-DEX',
      titleAlignment: 'center',
    })
  );
}

export function showCompactBanner() {
  const shortGradient = gradient(['#6366f1', '#d946ef']);
  logger.print(`  ${shortGradient.bold('⚡ Ultra-Dex')} ${chalk.dim(`v${VERSION}`)}`);
}

export function registerBannerCommand(program) {
  program
    .command('banner')
    .description('Display the Ultra-Dex visual banner')
    .action(() => {
      showBanner();
    });
}

export default {
  banner,
  showBanner,
  showCompactBanner,
  registerBannerCommand,
};

/**
 * Handle errors in banner module
 * @param {Error} error - The error to handle
 * @param {string} [context='banner'] - Error context
 */
function _handleModuleError(error, context = 'banner') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
