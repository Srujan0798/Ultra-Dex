// Copyright (c) 2026 Ultra-Dex — Railway Integration

import { execSync } from 'child_process';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts }).trim();
  } catch (err) {
    throw new Error(`[railway] ${err.stderr || err.message}`);
  }
}

function ensureCli() {
  try {
    run('railway --version');
  } catch {
    throw new Error('[railway] Railway CLI not found. Install with: npm i -g @railway/cli');
  }
}

export function deploy(options = {}) {
  ensureCli();
  const args = ['railway up'];
  if (options.detach) args.push('--detach');
  if (options.service) args.push(`--service ${options.service}`);
  if (options.environment) args.push(`--environment ${options.environment}`);
  return run(args.join(' '));
}

export function status(options = {}) {
  ensureCli();
  const args = ['railway status'];
  if (options.json) args.push('--json');
  return run(args.join(' '));
}

export function logs(options = {}) {
  ensureCli();
  const args = ['railway logs'];
  if (options.lines) args.push(`--lines ${options.lines}`);
  if (options.service) args.push(`--service ${options.service}`);
  return run(args.join(' '));
}

export async function connect() {
  ensureCli();
  run('railway status');
  return { ok: true, connected: true };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function sync({ direction = 'both', state = {} } = {}, _config = {}) {
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return { ok: true, direction, pulled, pushed, timestamp: new Date().toISOString() };
}

export function registerCommands(program) {
  const cmd = program.command('railway').description('Railway platform integration');

  cmd
    .command('deploy')
    .description('Deploy to Railway')
    .option('--detach', 'Run in background')
    .option('--service <name>', 'Service name')
    .option('--environment <env>', 'Target environment')
    .action((opts) => {
      console.log(deploy(opts));
    });

  cmd
    .command('status')
    .description('Check Railway project status')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      console.log(status(opts));
    });

  cmd
    .command('logs')
    .description('View Railway logs')
    .option('--lines <n>', 'Number of lines', '100')
    .option('--service <name>', 'Service name')
    .action((opts) => {
      console.log(logs(opts));
    });

  return cmd;
}

export const integration = {
  id: 'railway',
  name: 'Railway',
  connect,
  disconnect,
  sync,
  deploy,
  status,
  logs,
};

export default integration;
