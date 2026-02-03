import chalk from 'chalk';
import { theme, status } from './theme.js';

class Logger {
  constructor() {
    this.level = 'info';
    this.quiet = false;
  }

  setQuiet(quiet) {
    this.quiet = quiet;
  }

  info(message, detail = '') {
    if (this.quiet) return;
    const detailText = detail ? theme.dim(` · ${detail}`) : '';
    console.log(`  ${status.info} ${message}${detailText}`);
  }

  success(message, detail = '') {
    if (this.quiet) return;
    const detailText = detail ? theme.dim(` · ${detail}`) : '';
    console.log(`  ${status.success} ${theme.success(message)}${detailText}`);
  }

  warn(message, detail = '') {
    if (this.quiet) return;
    const detailText = detail ? theme.dim(` · ${detail}`) : '';
    console.log(`  ${status.warning} ${theme.warning(message)}${detailText}`);
  }

  error(message, error = null) {
    console.log(`  ${status.error} ${theme.error(message)}`);
    if (error && error.message) {
      console.log(`    ${theme.dim('→')} ${theme.dim(error.message)}`);
    }
    if (error && error.stack && process.env.DEBUG) {
      console.log(theme.dim(error.stack.split('\n').map(line => `      ${line}`).join('\n')));
    }
  }

  debug(message, detail = '') {
    if (this.quiet || !process.env.DEBUG) return;
    const detailText = detail ? theme.dim(` · ${detail}`) : '';
    console.log(`  ${theme.dim('⚙')} ${theme.dim(message)}${detailText}`);
  }

  step(current, total, message) {
    if (this.quiet) return;
    const stepText = theme.dim(`[${current}/${total}]`);
    console.log(`  ${stepText} ${message}`);
  }

  header(text) {
    if (this.quiet) return;
    console.log('');
    console.log(theme.title(`  ${text}`));
    console.log(theme.primary('  ' + '─'.repeat(Math.max(10, text.length + 4))));
  }

  spacer() {
    if (this.quiet) return;
    console.log('');
  }
}

export const logger = new Logger();
export default logger;
