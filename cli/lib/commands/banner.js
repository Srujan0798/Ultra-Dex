import boxen from 'boxen';
import chalk from 'chalk';
import { VERSION } from '../utils/version.js';
import { theme, ultraGradient } from '../ui/theme.js';

const asciiLogo = `
██╗   ██╗██╗  ████████╗██████╗  █████╗       ██████╗ ███████╗██╗  ██╗
██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝
██║   ██║██║     ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗
╚██████╔╝███████╗██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝`;

export const banner = asciiLogo;

export function showBanner(version = VERSION) {
  // Apply the gradient multiline
  console.log(ultraGradient(asciiLogo));

  console.log(boxen(
    `${theme.primary.bold('⚡ ULTRA-DEX')} ${theme.dim('v' + version)}

` +
    `${theme.secondary('AI Orchestration Meta-Layer')}
` +
    `${theme.success.dim('● SYSTEM ACTIVATED')}

` +
    `${theme.dim('Perfectly balanced, as all code should be.')}`,
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
  console.log(`  ${theme.primary.bold('⚡ Ultra-Dex')} ${theme.dim('v' + VERSION)}`);
}