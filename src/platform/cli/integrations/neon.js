// Copyright (c) 2026 Ultra-Dex — Neon Integration

const NEON_API = 'https://console.neon.tech/api/v2';

async function neonFetch(endpoint, apiKey, options = {}) {
  const url = `${NEON_API}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[neon] ${res.status}: ${text}`);
  }
  return res.json();
}

export async function deploy(options = {}) {
  const apiKey = options.apiKey || process.env.NEON_API_KEY;
  if (!apiKey) throw new Error('[neon] NEON_API_KEY required');

  const result = await neonFetch('/projects', apiKey, {
    method: 'POST',
    body: {
      project: {
        name: options.name || `ultra-dex-${Date.now()}`,
        region_id: options.region || 'aws-us-east-2',
        pg_version: options.pgVersion || 16,
      },
    },
  });

  return {
    projectId: result.project?.id,
    connectionUri: result.connection_uris?.[0]?.connection_uri,
    host: result.endpoints?.[0]?.host,
  };
}

export async function status(options = {}) {
  const apiKey = options.apiKey || process.env.NEON_API_KEY;
  if (!apiKey) throw new Error('[neon] NEON_API_KEY required');

  if (options.projectId) {
    return neonFetch(`/projects/${options.projectId}`, apiKey);
  }
  return neonFetch('/projects', apiKey);
}

export async function logs(options = {}) {
  const apiKey = options.apiKey || process.env.NEON_API_KEY;
  if (!apiKey) throw new Error('[neon] NEON_API_KEY required');
  if (!options.projectId) throw new Error('[neon] --project required for logs');

  return neonFetch(`/projects/${options.projectId}/operations`, apiKey);
}

export async function connect(config = {}) {
  const apiKey = config.apiKey || process.env.NEON_API_KEY;
  if (!apiKey) {
    throw new Error('[neon] NEON_API_KEY required');
  }
  await neonFetch('/projects', apiKey);
  return { ok: true, connected: true };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function listProjects(config = {}) {
  return status({ apiKey: config.apiKey });
}

export async function sync({ direction = 'both', state = {} } = {}, _config = {}) {
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return { ok: true, direction, pulled, pushed, timestamp: new Date().toISOString() };
}

export function registerCommands(program) {
  const cmd = program.command('neon').description('Neon serverless Postgres integration');

  cmd
    .command('deploy')
    .description('Create a new Neon project/database')
    .option('--name <name>', 'Project name')
    .option('--region <id>', 'Region (default: aws-us-east-2)')
    .option('--pg-version <ver>', 'PostgreSQL version', '16')
    .action(async (opts) => {
      const result = await deploy(opts);
      logger.log('Neon project created:', JSON.stringify(result, null, 2));
    });

  cmd
    .command('status')
    .description('Check Neon project status')
    .option('--project <id>', 'Project ID (omit for all)')
    .action(async (opts) => {
      const result = await status({ projectId: opts.project });
      logger.log(JSON.stringify(result, null, 2));
    });

  cmd
    .command('logs')
    .description('View Neon project operations')
    .requiredOption('--project <id>', 'Project ID')
    .action(async (opts) => {
      const result = await logs({ projectId: opts.project });
      logger.log(JSON.stringify(result, null, 2));
    });

  return cmd;
}

export const integration = {
  id: 'neon',
  name: 'Neon',
  connect,
  disconnect,
  sync,
  listProjects,
  deploy,
  logs,
};

export default integration;
