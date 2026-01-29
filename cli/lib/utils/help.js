import chalk from 'chalk';
import gradient from 'gradient-string';
import { isDoomsdayMode } from './theme-state.js';
import { showHelp as showDoomsdayHelp } from '../themes/doomsday.js';

const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);

export function showHelp() {
  if (isDoomsdayMode()) {
    return showDoomsdayHelp();
  }

  console.log('');
  console.log(ultraGradient('  ═══════════════════════════════════════════════'));
  console.log(ultraGradient('  ║        U L T R A - D E X  :  O R C H E S T R A T I O N'));
  console.log(ultraGradient('  ═══════════════════════════════════════════════'));
  console.log('');
  
  const sections = [
    {
      title: '🚀 PROJECT SETUP',
      commands: [
        ['init', 'Initialize new project'],
        ['generate', 'Generate implementation plan'],
        ['swarm', 'Run agent pipeline']
      ]
    },
    {
      title: '🛡️ QUALITY & DEFENSE',
      commands: [
        ['review', 'Run code review'],
        ['validate', 'Check project integrity'],
        ['hooks', 'Install git hooks']
      ]
    },
    {
      title: '⚡ ACTIVE KERNEL',
      commands: [
        ['serve', 'Start MCP server & dashboard'],
        ['dashboard', 'Open web dashboard'],
        ['agents', 'List available agents']
      ]
    },
    {
      title: '📦 DEPLOYMENT',
      commands: [
        ['build', 'Execute next task'],
        ['deploy', 'Deploy application'],
        ['doctor', 'System diagnostics']
      ]
    }
  ];
  
  sections.forEach(section => {
    console.log(`  ${chalk.hex('#8b5cf6').bold(section.title)}`);
    section.commands.forEach(([cmd, desc]) => {
      console.log(`    ${chalk.hex('#6366f1')(cmd.padEnd(16))} ${chalk.dim(desc)}`);
    });
    console.log('');
  });
  
  console.log(chalk.dim('  "AI Orchestration Meta-Layer for Professional SaaS Development"'));
  console.log('');
}
