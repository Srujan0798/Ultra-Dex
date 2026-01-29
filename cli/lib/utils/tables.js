import Table from 'cli-table3';
import chalk from 'chalk';
import gradient from 'gradient-string';

export function createTable(headers, rows) {
  const table = new Table({
    head: headers.map(h => gradient(['#6366f1', '#8b5cf6'])(h)),
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│'
    },
    style: {
      head: ['magenta'],
      border: ['dim']
    }
  });
  
  rows.forEach(row => table.push(row));
  return table.toString();
}

export function showAgentsTable(agents) {
  const headers = ['Tier', 'Agent', 'Status'];
  const rows = agents.map(a => [
    chalk.dim(a.tier || 'N/A'),
    chalk.cyan(a.name),
    a.status === 'ready' ? chalk.green('●') : chalk.yellow('○')
  ]);
  console.log(createTable(headers, rows));
}

export function showCommandsTable(commands) {
  const headers = ['Command', 'Description'];
  const rows = commands.map(c => [
    chalk.cyan(c.name),
    chalk.dim(c.description)
  ]);
  console.log(createTable(headers, rows));
}