import gradient from 'gradient-string';
import boxen from 'boxen';
import chalk from 'chalk';

const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);

const asciiLogo = `
██╗   ██╗██╗  ████████╗██████╗  █████╗       ██████╗ ███████╗██╗  ██╗
██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝ 
██║   ██║██║     ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗ 
╚██████╔╝███████╗██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝`;

export const banner = asciiLogo;

export function showBanner(version = '3.4.2') {
  console.log(ultraGradient(asciiLogo));
  console.log(boxen(
    `${chalk.hex('#8b5cf6').bold('🪐 Ultra-Dex')} ${chalk.dim('v' + version)}

` +
    `${chalk.hex('#6366f1')('AI Orchestration Meta-Layer')}

` +
    `${chalk.dim('github.com/Srujan0798/Ultra-Dex')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: '#8b5cf6',
      dimBorder: true
    }
  ));
}

export function showCompactBanner() {
  console.log(`  ${chalk.hex('#8b5cf6').bold('🪐 Ultra-Dex')} ${chalk.dim('v3.2.0')}`);
}

export function showWelcome() {
  showBanner();
}
