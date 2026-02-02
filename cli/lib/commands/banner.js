import gradient from 'gradient-string';
import boxen from 'boxen';
import chalk from 'chalk';
import { VERSION } from '../utils/version.js';

// Define the colors for the vertical transition
const redToPurpleGradient = gradient(['#dc2626', '#7c3aed']);

const asciiLogo = `
██╗   ██╗██╗  ████████╗██████╗  █████╗       ██████╗ ███████╗██╗  ██╗
██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝
██║   ██║██║     ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗
╚██████╔╝███████╗██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝`;

export const banner = asciiLogo;

export function showBanner(version = VERSION) {
  // Apply the gradient VERTICALLY (Top to Bottom)
  console.log(redToPurpleGradient.multiline(asciiLogo));

  console.log(boxen(
    `${chalk.hex('#dc2626').bold('⚡ ULTRA-DEX')} ${chalk.dim('v' + version)}

` +
    `${chalk.hex('#6366f1')('AI Orchestration Meta-Layer')}
` +
    `${chalk.green.dim('● SYSTEM ACTIVATED')}

` +
    `${chalk.dim('Perfectly balanced, as all code should be.')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: '#dc2626',
      title: 'ULTRA-DEX',
      titleAlignment: 'center'
    }
  ));
}

export function showCompactBanner() {
  console.log(`  ${chalk.hex('#dc2626').bold('⚡ Ultra-Dex')} ${chalk.dim('v' + VERSION)}`);
}

export function showWelcome() {
  showBanner();
}