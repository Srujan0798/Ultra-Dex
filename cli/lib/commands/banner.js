// Ultra-Dex CLI — Banner with Doomsday Theme
// Matrix-style green interface like Gemini CLI

import chalk from 'chalk';

// Doomsday green theme (like Gemini CLI's green)
const green = chalk.hex('#22c55e');
const brightGreen = chalk.hex('#4ade80');
const dimGreen = chalk.hex('#166534');
const gray = chalk.hex('#6b7280');

const logo = `
  ██╗   ██╗██╗  ████████╗██████╗  █████╗ ██████╗ ███████╗██╗  ██╗
  ██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝
  ██║   ██║██║     ██║   ██████╔╝███████║██║  ██║█████╗   ╚███╔╝ 
  ██║   ██║██║     ██║   ██╔══██╗██╔══██║██║  ██║██╔══╝   ██╔██╗ 
  ╚██████╔╝███████╗██║   ██║  ██║██║  ██║██████╔╝███████╗██╔╝ ██╗
   ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝`;

export const banner = green(logo);

export function showBanner() {
    console.log('');
    console.log(green(logo));
    console.log('');
    console.log(gray('  ─────────────────────────────────────────────────────────────'));
    console.log(`  ${green.bold('ULTRA-DEX')} ${gray('v3.1.0')} ${gray('•')} ${brightGreen('AI Orchestration Meta-Layer')}`);
    console.log(gray('  ─────────────────────────────────────────────────────────────'));
    console.log('');
}

export function showCompactBanner() {
    console.log('');
    console.log(`  ${green.bold('◆ ULTRA-DEX')} ${gray('v3.1.0')}`);
    console.log('');
}

export function showWelcome() {
    showBanner();

    console.log(gray('  Welcome to Ultra-Dex. What would you like to do?'));
    console.log('');

    const commands = [
        ['init', 'Initialize new project'],
        ['generate', 'Create implementation plan'],
        ['agents', 'Browse 16 AI agents'],
        ['swarm', 'Run autonomous pipeline'],
        ['serve', 'Start MCP server'],
        ['dashboard', 'Open monitoring UI'],
    ];

    commands.forEach(([cmd, desc]) => {
        console.log(`  ${green('→')} ${brightGreen(cmd.padEnd(14))} ${gray(desc)}`);
    });

    console.log('');
    console.log(gray('  Run ') + brightGreen('ultra-dex <command> --help') + gray(' for more information'));
    console.log('');
}
