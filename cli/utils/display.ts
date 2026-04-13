/**
 * CLI display utilities — ANSI colors, formatting, table rendering.
 * No external deps. Used by all CLI commands.
 */

export const c = {
  bold:  (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:   (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red:   (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow:(s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan:  (s: string) => `\x1b[36m${s}\x1b[0m`,
  blue:  (s: string) => `\x1b[34m${s}\x1b[0m`,
  gray:  (s: string) => `\x1b[90m${s}\x1b[0m`,
};

export function stateColor(state: string): string {
  switch (state) {
    case 'SUCCESS':   return c.green(state);
    case 'FAILED':    return c.red(state);
    case 'ROLLBACK':  return c.red(state);
    case 'RUNNING':   return c.cyan(state);
    case 'VERIFYING': return c.cyan(state);
    case 'RETRY':     return c.yellow(state);
    case 'BLOCKED':   return c.yellow(state);
    case 'READY':     return c.blue(state);
    default:          return c.gray(state);
  }
}

export function pad(s: string, n: number): string {
  return s.padEnd(n);
}

export function hr(char = '─', len = 60): string {
  return c.gray(char.repeat(len));
}

export function elapsedMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function fatal(msg: string): never {
  process.stderr.write(`${c.red('Error:')} ${msg}\n`);
  process.exit(1);
}
