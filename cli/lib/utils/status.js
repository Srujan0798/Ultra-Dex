import chalk from 'chalk';
import figures from 'figures';

export const icons = {
  success: chalk.hex('#22c55e')(figures.tick),
  error: chalk.hex('#ef4444')(figures.cross),
  warning: chalk.hex('#f59e0b')(figures.warning),
  info: chalk.hex('#6366f1')(figures.info),
  pending: chalk.hex('#6b7280')(figures.circle),
  running: chalk.hex('#d946ef')(figures.play),
  pointer: chalk.hex('#8b5cf6')(figures.pointer),
  bullet: chalk.dim(figures.bullet)
};

export function showInfinityStatus() {
  // Deprecated function, kept for compatibility if called elsewhere but showing nothing or simple status
}

export function statusLine(icon, text) {
  console.log(`  ${icon} ${text}`);
}

export function header(text) {
  console.log('');
  console.log(chalk.bold.hex('#8b5cf6')(`  ${text}`));
  console.log(chalk.dim('  ' + '─'.repeat(50)));
}

export function separator() {
  console.log('');
}
