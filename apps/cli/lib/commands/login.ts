import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import inquirer from 'inquirer';
import type { Command } from 'commander';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

interface SessionData {
  token: string;
  email?: string;
  role?: string;
  plan?: string;
  createdAt: string;
}

const SESSION_DIR = path.join(homedir(), '.ultra-dex');
const SESSION_PATH = path.join(SESSION_DIR, 'session.json');

function getApiBaseUrl(): string {
  return process.env.ULTRA_DEX_API_URL || `http://localhost:${process.env.PORT || '3000'}`;
}

function ensureSessionDir(): void {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 });
  }
}

function writeSession(session: SessionData): void {
  ensureSessionDir();
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  fs.chmodSync(SESSION_PATH, 0o600);
}

function readSession(): SessionData | null {
  if (!fs.existsSync(SESSION_PATH)) {
    return null;
  }

  const raw = fs.readFileSync(SESSION_PATH, 'utf8');
  return JSON.parse(raw) as SessionData;
}

function removeSession(): void {
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
  }
}

function getClerkLoginUrl(): string {
  return (
    process.env.CLERK_SIGN_IN_URL ||
    `${process.env.ULTRA_DEX_WEB_URL || 'https://ultra-dex.onrender.com'}/sign-in`
  );
}

async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST',
  token: string,
  body?: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with Clerk and store local CLI session')
    .option('--token <token>', 'Session token from Clerk')
    .option('--email <email>', 'Email to persist in local session')
    .option('--role <role>', 'Role to persist in local session', 'user')
    .option('--plan <plan>', 'Plan to persist in local session', 'free')
    .action(async (options: { token?: string; email?: string; role?: string; plan?: string }) => {
      const loginUrl = getClerkLoginUrl();
      printInfo(`Open Clerk login URL:\n${loginUrl}`);

      let token = options.token;
      if (!token) {
        const answers = await inquirer.prompt<{ token: string }>([
          {
            type: 'password',
            name: 'token',
            message: 'Paste your Clerk session token',
            mask: '*',
            validate: (value: string): true | string =>
              value?.trim().length > 0 ? true : 'Token is required',
          },
        ]);
        token = answers.token;
      }

      writeSession({
        token,
        email: options.email,
        role: options.role || 'user',
        plan: options.plan || 'free',
        createdAt: new Date().toISOString(),
      });

      printSuccess(`Session saved to ${SESSION_PATH}`);
      printInfo('File permissions set to 600');
    });

  program
    .command('logout')
    .description('Delete local CLI session')
    .action(async () => {
      removeSession();
      printSuccess('Logged out. Local session removed.');
    });

  program
    .command('whoami')
    .description('Show current user from local session and API')
    .action(async () => {
      const session = readSession();
      if (!session) {
        printWarning('No active session. Run: ultra-dex login');
        return;
      }

      let email = session.email || 'unknown';
      let role = session.role || 'user';
      let plan = session.plan || 'free';

      try {
        const profile = (await apiRequest('/api/user/profile', 'GET', session.token)) as {
          email?: string;
          role?: string;
          tier?: string;
        };

        if (profile.email) email = profile.email;
        if (profile.role) role = profile.role;
        if (profile.tier) plan = profile.tier;
      } catch {
        printWarning('Could not refresh profile from API; using local session values.');
      }

      printInfo(`email: ${email}`);
      printInfo(`role: ${role}`);
      printInfo(`plan: ${plan}`);
    });

  const apikeyCommand = program.command('apikey').description('API key operations');

  apikeyCommand
    .command('generate')
    .description('Generate an API key via /api/auth/apikey')
    .action(async () => {
      const session = readSession();
      if (!session) {
        printError('No active session. Run: ultra-dex login');
        return;
      }

      try {
        const response = (await apiRequest('/api/auth/apikey', 'POST', session.token, {})) as {
          apiKey?: string;
          key?: string;
        };
        const apiKey = response.apiKey || response.key;
        if (!apiKey) {
          throw new Error('API key missing in response');
        }
        printSuccess(`Generated API key: ${apiKey}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        printError(`Failed to generate API key: ${message}`);
      }
    });
}
