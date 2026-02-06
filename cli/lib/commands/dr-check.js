// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import net from 'net';
import path from 'path';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

export function registerDrCheckCommand(program) {
  program
    .command('dr-check')
    .description('Disaster Recovery readiness check')
    .option('--backup-path <path>', 'Path to backup directory or file', '.ultra-dex/backups')
    .option('--db-url <url>', 'Database connection URL (defaults to DATABASE_URL)')
    .option('--health-url <url>', 'Health check URL', 'http://localhost:3000/health')
    .option('--timeout <ms>', 'Health check timeout', '5000')
    .action(async (options) => {
      try {
        const results = [];

        const backupPath = path.resolve(options.backupPath);
        const backupExists = await exists(backupPath);
        results.push({
          name: 'Backups',
          status: backupExists ? 'ok' : 'fail',
          detail: backupExists ? backupPath : 'No backup found',
        });

        const dbUrl = options.dbUrl || process.env.DATABASE_URL;
        const dbStatus = await checkDatabase(dbUrl, Number.parseInt(options.timeout, 10));
        results.push({
          name: 'Database Connectivity',
          status: dbStatus.ok ? 'ok' : 'fail',
          detail: dbStatus.detail,
        });

        const timeout = Number.parseInt(options.timeout, 10);
        const healthUrl = options.healthUrl;
        const healthStatus = await checkHealth(healthUrl, timeout);
        results.push({
          name: 'API Health',
          status: healthStatus.ok ? 'ok' : 'fail',
          detail: healthStatus.detail,
        });

        printInfo(chalk.bold('\nDisaster Recovery Check\n'));
        results.forEach((result) => {
          if (result.status === 'ok') {
            printSuccess(`  ✅ ${result.name}: ${result.detail}`);
          } else {
            printError(`  ❌ ${result.name}: ${result.detail}`);
          }
        });

        const failures = results.filter((r) => r.status !== 'ok');
        if (failures.length > 0) {
          printError('\nSystem Critical');
          process.exitCode = 1;
          return;
        }

        printSuccess('\nAll Systems Go');
      } catch (error) {
        await handleError(error, { command: 'dr-check', options });
        process.exitCode = 1;
      }
    });
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function checkHealth(url, timeoutMs) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      return { ok: false, detail: `HTTP ${response.status}` };
    }

    return { ok: true, detail: 'Healthy' };
  } catch (error) {
    return { ok: false, detail: error.name === 'AbortError' ? 'Timed out' : error.message };
  }
}

async function checkDatabase(dbUrl, timeoutMs) {
  if (!dbUrl) {
    return { ok: false, detail: 'DATABASE_URL missing' };
  }

  let parsed;
  try {
    parsed = new URL(dbUrl);
  } catch {
    return { ok: false, detail: 'Invalid DATABASE_URL' };
  }

  const host = parsed.hostname;
  const protocol = parsed.protocol.replace(':', '');
  const defaultPorts = { postgresql: 5432, postgres: 5432, mysql: 3306 };
  const port = parsed.port ? Number.parseInt(parsed.port, 10) : defaultPorts[protocol];

  if (!host || !port) {
    return { ok: false, detail: 'Unsupported database URL' };
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ ok: false, detail: 'DB check timed out' });
    }, timeoutMs || 3000);

    socket.on('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve({ ok: true, detail: `${host}:${port} reachable` });
    });

    socket.on('error', (error) => {
      clearTimeout(timer);
      resolve({ ok: false, detail: error.message });
    });
  });
}

export default {
  registerDrCheckCommand,
};
