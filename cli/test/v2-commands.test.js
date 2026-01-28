import assert from 'assert';
import { execSync } from 'child_process';
import { test } from 'node:test';
import path from 'path';

const CLI = `node ${path.resolve(process.cwd(), 'bin/ultra-dex.js')}`;

test('v2.4 Command Smoke Tests', async (t) => {
  
  await t.test('agents command lists agents', () => {
    const output = execSync(`${CLI} agents`).toString();
    assert.ok(output.includes('Ultra-Dex AI Agents'));
    assert.ok(output.includes('backend'));
    assert.ok(output.includes('cto'));
  });

  await t.test('agent command shows specific prompt', () => {
    const output = execSync(`${CLI} agent backend`).toString();
    assert.ok(output.includes('# Backend Developer Agent'));
  });

  await t.test('config --mcp generates json', () => {
    // dry run or capture output
    const output = execSync(`${CLI} config --mcp`).toString();
    assert.ok(output.includes('claude_desktop_config.json'));
    assert.ok(output.includes('"ultra-dex"'));
  });

  await t.test('swarm command exists', () => {
    // We expect it to run or show help, ensuring the command is registered
    try {
        execSync(`${CLI} swarm --help`);
    } catch (e) {
        assert.fail('swarm command failed');
    }
  });

  await t.test('serve command help works', () => {
    const output = execSync(`${CLI} serve --help`).toString();
    assert.ok(output.includes('Active Kernel'));
  });
});
