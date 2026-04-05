import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const CLI_PATH = path.resolve(process.cwd(), 'apps/cli/bin/ultra-dex.js');

describe('CLI Command: run error paths', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-run-error-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('shows clear error when no AI provider configured', async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [CLI_PATH, 'run', 'planner', '-t', 'Test task'],
      {
        cwd: tmpDir,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: '', // Unset API keys
          NVIDIA_API_KEY: '',
          OPENAI_API_KEY: '',
          GOOGLE_AI_KEY: '',
          ULTRA_DEX_ENABLE_LOCAL_PROVIDERS: '', // Disable local providers
          NODE_ENV: 'test',
          NO_COLOR: '',
          ULTRA_DEX_SKIP_UPDATE_CHECK: 'true',
          ULTRA_DEX_V2_ROUTING: '',
          // Additional vars to prevent any provider detection
          ULTRA_DEX_DEFAULT_PROVIDER: '',
          ANTHROPIC_AUTH_TOKEN: '', // Also unset this as it might be used
          ANTHROPIC_BASE_URL: '', // Unset base URL
        },
        maxBuffer: 4 * 1024 * 1024,
      }
    );

    const output = stdout + stderr;
    // Debug output to see what we're getting
    // console.log('OUTPUT:', output);
    assert.match(output, /❌ No AI provider configured or available/);
    assert.match(output, /To fix this, either:/);
    assert.match(output, /export ANTHROPIC_API_KEY/);
    assert.match(output, /export NVIDIA_API_KEY/);
    assert.match(output, /export OPENAI_API_KEY/);
    assert.match(output, /export GOOGLE_AI_KEY/);
    assert.match(output, /export ULTRA_DEX_ENABLE_LOCAL_PROVIDERS=1/);
  });

  test('shows clear error when provider specified but not configured', async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [CLI_PATH, 'run', 'planner', '-t', 'Test task', '--provider', 'openai'],
      {
        cwd: tmpDir,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: '',
          NVIDIA_API_KEY: '',
          OPENAI_API_KEY: '',
          GOOGLE_AI_KEY: '',
          ULTRA_DEX_ENABLE_LOCAL_PROVIDERS: '',
          NODE_ENV: 'test',
          NO_COLOR: '',
          ULTRA_DEX_SKIP_UPDATE_CHECK: 'true',
          ULTRA_DEX_V2_ROUTING: '',
        },
        maxBuffer: 4 * 1024 * 1024,
      }
    );

    const output = stdout + stderr;
    assert.match(output, /❌ No AI provider configured or available/);
    assert.match(output, /To fix this, either:/);
    assert.match(output, /export OPENAI_API_KEY/);
  });

  test('exits with code 1 when no provider available', async () => {
    const { exitCode } = await execFileAsync(
      process.execPath,
      [CLI_PATH, 'run', 'planner', '-t', 'Test task'],
      {
        cwd: tmpDir,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: '',
          NVIDIA_API_KEY: '',
          OPENAI_API_KEY: '',
          GOOGLE_AI_KEY: '',
          ULTRA_DEX_ENABLE_LOCAL_PROVIDERS: '',
          NODE_ENV: 'test',
          NO_COLOR: '',
          ULTRA_DEX_SKIP_UPDATE_CHECK: 'true',
          ULTRA_DEX_V2_ROUTING: '',
        },
      }
    ).catch((result) => result);

    assert.strictEqual(exitCode, 1);
  });
});
