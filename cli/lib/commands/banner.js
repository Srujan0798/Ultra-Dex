// Copyright (c) 2026 Ultra-Dex

import boxen from 'boxen';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { VERSION } from '../utils/version.js';
import { theme } from '../ui/theme.js';

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

  console.log(ultraGradient.multiline(asciiLogo));

  const info = [
    `${chalk.bold('⚡ ULTRA-DEX')} ${chalk.dim(`v${version}`)}`,
    `${chalk.magenta('AI Orchestration Meta-Layer for SaaS')}`,
    '',
    `${chalk.green('●')} ${chalk.white('CORE SYSTEMS:')} ${chalk.green('ONLINE')}`,
    `${chalk.green('●')} ${chalk.white('NEURAL LINK:')} ${chalk.green('ESTABLISHED')}`,
    '',
    `${chalk.italic.dim('"Perfectly balanced, as all code should be."')}`,
  ].join('\n');

  console.log(
    boxen(info, {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'double',
      borderColor: '#8b5cf6',
      textAlignment: 'center',
      title: 'System Boot',
      titleAlignment: 'left',
    })
  );
}

export function showCompactBanner() {
  const shortGradient = gradient(['#6366f1', '#d946ef']);
  console.log(`  ${shortGradient.bold('⚡ Ultra-Dex')} ${chalk.dim(`v${VERSION}`)}`);
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
