import boxen from 'boxen';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { VERSION } from './version.js';

export function showVersionCard() {
  const version = VERSION;
  const ultra = gradient(['#6366f1', '#8b5cf6'])('Ultra-Dex');
  
  console.log(boxen(
    `${ultra} ${chalk.dim('v')}${chalk.bold.white(version)}

` +
    `${chalk.cyan('◆')} AI Orchestration Meta-Layer
` +
    `${chalk.magenta('◆')} 35 Commands • 16 Agents
` +
    `${chalk.yellow('◆')} MCP Server • Swarm Mode

` +
    `${chalk.dim('npm install -g ultra-dex')}
` +
    `${chalk.dim('github.com/Srujan0798/Ultra-Dex')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: '#8b5cf6',
      title: '🪐 Ultra-Dex',
      titleAlignment: 'center'
    }
  ));
}