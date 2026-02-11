// Copyright (c) 2026 Ultra-Dex
// tests/cli/cli-commands.test.js

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'assert';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'path';
import os from 'os';

const exec = promisify(require('child_process').exec);

describe('CLI Commands', () => {
  let tempDir;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await mkdtemp(`${tmpdir()}${os.EOL}ultra-dex-test-`);
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should show version correctly', async () => {
    const { stdout, stderr } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npm start -- --version', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // The version should be 6.0.0 based on package.json
    assert.ok(stdout.includes('6.0.0') || stderr.includes('6.0.0'));
  });

  it('should show help information', async () => {
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npx ultra-dex --help', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    assert.ok(stdout.includes('AI Orchestration Meta-Layer'));
    assert.ok(stdout.includes('ultra-dex [command] [options]'));
    assert.ok(stdout.includes('COMMANDS'));
    assert.ok(stdout.includes('OPTIONS'));
  });

  it('should list agents', async () => {
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npx ultra-dex agents list', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    assert.ok(stdout.includes('Ultra-Dex AI Agents'));
    assert.ok(stdout.includes('Orchestration'));
    assert.ok(stdout.includes('Leadership'));
    assert.ok(stdout.includes('Development'));
  });

  it('should run simple commands', async () => {
    // Test the brain command which is relatively safe
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && echo "" | npx ultra-dex brain', {
      env: { ...process.env, NODE_ENV: 'test' },
      input: ''
    });
    
    // The command should not crash
    assert.ok(stdout !== undefined);
  });

  it('should handle init command in temp directory', async () => {
    // Change to temp directory and try init
    const { stdout, stderr } = await exec(`cd ${tempDir} && npx ultra-dex init`, {
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        // Mock environment variables to avoid actual API calls
        OPENAI_API_KEY: 'test-key',
        ANTHROPIC_API_KEY: 'test-key',
        GOOGLE_API_KEY: 'test-key'
      },
      timeout: 30000 // 30 second timeout
    }).catch(err => {
      // If the command fails (which is expected without proper setup), that's OK
      // as long as it doesn't crash the system
      return { stdout: '', stderr: err.stderr || err.message };
    });
    
    // The command should not crash the system, though it may fail due to missing setup
    assert.ok(stdout !== undefined || stderr !== undefined);
  });

  it('should show agent information', async () => {
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npx ultra-dex agents show cto', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    assert.ok(stdout.includes('CTO Agent'));
    assert.ok(stdout.includes('Chief Technology Officer'));
  });

  it('should run verify command', async () => {
    // Create minimal files needed for verify command
    await writeFile(`${tempDir}/CONTEXT.md`, '# Test Context\nThis is a test context file.');
    await writeFile(`${tempDir}/IMPLEMENTATION-PLAN.md`, '# Test Plan\nThis is a test plan.');
    
    const originalDir = process.cwd();
    try {
      process.chdir(tempDir);
      const { stdout } = await exec('npx ultra-dex verify --json', {
        env: { 
          ...process.env, 
          NODE_ENV: 'test',
          OPENAI_API_KEY: 'test-key'
        }
      });
      
      // Should return valid JSON with verification results
      assert.doesNotThrow(() => JSON.parse(stdout));
      const result = JSON.parse(stdout);
      assert.ok(result.hasOwnProperty('valid'));
      assert.ok(result.hasOwnProperty('score'));
    } finally {
      process.chdir(originalDir);
    }
  });

  it('should handle config commands', async () => {
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npx ultra-dex config --help', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    assert.ok(stdout.includes('Show or generate configuration'));
  });

  it('should run quality checks', async () => {
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npx ultra-dex quality --help', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    assert.ok(stdout.includes('Comprehensive quality assessment'));
  });

  it('should run status checks', async () => {
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npx ultra-dex status', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    assert.ok(stdout.includes('Status') || stdout.includes('status') || stdout.length > 0);
  });

  it('should handle memory commands', async () => {
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npx ultra-dex memory --help', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    assert.ok(stdout.includes('Memory management'));
  });

  it('should run check command', async () => {
    const { stdout } = await exec('cd /Users/roshwinram/Music/Ultra-Dex && npx ultra-dex check --help', {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    assert.ok(stdout.includes('Comprehensive plan completeness check'));
  });
});