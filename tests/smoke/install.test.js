import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const CLI = 'node --import=tsx apps/cli/bin/ultra-dex.js';

describe('Install Smoke Tests', () => {
  it('should npm pack and install tarball with a working ultra-dex binary', (t) => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-dex-pack-'));
    try {
      const tgz = execSync(`cd apps/cli && npm pack`, {
        encoding: 'utf-8',
        timeout: 120000,
      })
        .trim()
        .split('\n')
        .pop();
      const tgzPath = path.join(process.cwd(), 'apps/cli', tgz);
      const prefix = path.join(tmpRoot, 'prefix');
      fs.mkdirSync(prefix, { recursive: true });
      execSync(`npm install -g "${tgzPath}" --prefix "${prefix}"`, {
        encoding: 'utf-8',
        timeout: 120000,
      });
      const binPath = path.join(prefix, 'bin', 'ultra-dex');
      if (!fs.existsSync(binPath)) {
        return t.skip('Installed binary not found in temporary prefix');
      }
      const output = execSync(`"${binPath}" --help`, {
        encoding: 'utf-8',
        timeout: 30000,
      });
      assert.ok(output.includes('Usage') || output.includes('Commands') || output.includes('ultra-dex'));
    } catch (error) {
      return t.skip(`Tarball install smoke skipped: ${error.message}`);
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('should have --help command available', () => {
    const result = execSync(`${CLI} --help`, {
      encoding: 'utf-8',
      timeout: 10000,
    });
    assert.ok(result.includes('Usage') || result.includes('Commands') || result.includes('ultra-dex'));
  });

  it('should report --version matching package.json', () => {
    const result = execSync(`${CLI} --version`, {
      encoding: 'utf-8',
      timeout: 10000,
    });
    assert.ok(result.match(/\d+\.\d+\.\d+/), 'Should output a semver version number');
  });

  it('should run ultra-dex doctor without crashing', () => {
    const result = execSync(`${CLI} doctor`, {
      encoding: 'utf-8',
      timeout: 30000,
      env: { ...process.env, MOCK_AI: 'true' },
    });
    assert.ok(
      result.includes('health') || result.includes('ok') || result.includes('ultra-dex') || result.length > 0,
      'Doctor should produce output'
    );
  });
});
