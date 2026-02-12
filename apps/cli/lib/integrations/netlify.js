// Copyright (c) 2026 Ultra-Dex — Netlify Integration

import { execSync } from 'child_process';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts }).trim();
  } catch (err) {
    throw new Error(`[netlify] ${err.stderr || err.message}`);
  }
}

function ensureCli() {
  try {
    run('npx netlify --version');
  } catch {
    throw new Error('[netlify] Netlify CLI not found. Install with: npm i -g netlify-cli');
  }
}

export function deploy(options = {}) {
  ensureCli();
  const args = ['npx netlify deploy'];
  if (options.prod) args.push('--prod');
  if (options.dir) args.push(`--dir=${options.dir}`);
  if (options.site) args.push(`--site=${options.site}`);
  if (options.message) args.push(`--message="${options.message}"`);
  return run(args.join(' '));
}

export function status(options = {}) {
  ensureCli();
  const args = ['npx netlify status'];
  if (options.json) args.push('--json');
  return run(args.join(' '));
}

export function logs(options = {}) {
  ensureCli();
  const siteId = options.site || '';
  return run(`npx netlify api listSiteDeploys --data '{"site_id":"${siteId}"}'`);
}

export async function connect() {
  ensureCli();
  run('npx netlify status');
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
  const cmd = program.command('netlify').description('Netlify platform integration');

  cmd
    .command('deploy')
    .description('Deploy to Netlify')
    .option('--prod', 'Deploy to production')
    .option('--dir <path>', 'Publish directory')
    .option('--site <id>', 'Site ID')
    .option('-m, --message <msg>', 'Deploy message')
    .action((opts) => {
      console.log(deploy(opts));
    });

  cmd
    .command('status')
    .description('Check Netlify site status')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      console.log(status(opts));
    });

  cmd
    .command('logs')
    .description('View recent deploy logs')
    .option('--site <id>', 'Site ID')
    .action((opts) => {
      console.log(logs(opts));
    });

  return cmd;
}

export const integration = {
  id: 'netlify',
  name: 'Netlify',
  connect,
  disconnect,
  sync,
  deploy,
  status,
  logs,
};

export default integration;
