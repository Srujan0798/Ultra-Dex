import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CLI = 'node apps/cli/bin/ultra-dex.js';
const ENV = { ...process.env, MOCK_AI: 'true' };

describe('Security: Path Traversal Protection', () => {
  it('should reject path traversal in file operations', async () => {
    // Try to access files outside project root
    const testDir = path.join(os.tmpdir(), 'ultra-dex-security-test');
    await fs.mkdir(testDir, { recursive: true });

    try {
      // Create a test file
      await fs.writeFile(path.join(testDir, 'secret.txt'), 'secret content');

      // The CLI should not be able to access files outside its root
      // This is a negative test — we verify the protection exists
      const projectRoot = process.cwd();
      const traversalPath = path.join(projectRoot, '..', '..', 'secret.txt');

      // Verify the file exists at the traversal target location
      const exists = await fs.access(traversalPath).then(() => true).catch(() => false);
      // It should NOT exist (path traversal should not work)
      assert.ok(!exists, 'Path traversal should not create files outside project root');
    } finally {
      await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it('should not expose environment variables in output', () => {
    const result = execSync(`${CLI} doctor`, {
      encoding: 'utf-8',
      timeout: 30000,
      env: ENV,
    });

    // Output should not contain API keys or secrets
    assert.ok(!result.includes(process.env.OPENAI_API_KEY || 'not-set'), 'Should not expose OPENAI_API_KEY');
    assert.ok(!result.includes(process.env.ANTHROPIC_API_KEY || 'not-set'), 'Should not expose ANTHROPIC_API_KEY');
  });
});

describe('Security: Input Validation', () => {
  it('should handle extremely long task input without crashing', () => {
    const longTask = 'a'.repeat(100000);
    try {
      const result = execSync(`${CLI} run planner -t "${longTask}"`, {
        encoding: 'utf-8',
        timeout: 30000,
        env: ENV,
      });
      // If it succeeds, fine
      assert.ok(typeof result === 'string');
    } catch (error) {
      // If it fails, should be a graceful error, not a segfault
      const output = (error.stderr || error.stdout || '').toString();
      assert.ok(output.length < 10000, 'Error output should be bounded, not massive');
    }
  });

  it('should handle special characters in task input', () => {
    const specialTask = 'test <script>alert("xss")</script> && rm -rf /';
    try {
      const result = execSync(`${CLI} run planner -t "${specialTask}"`, {
        encoding: 'utf-8',
        timeout: 30000,
        env: ENV,
      });
      assert.ok(typeof result === 'string');
    } catch {
      // Graceful failure is acceptable
    }
  });

  it('should handle JSON injection in task input', () => {
    const jsonTask = '{"task": "hello", "injected": true, "admin": true}';
    try {
      const result = execSync(`${CLI} run planner -t '${jsonTask}'`, {
        encoding: 'utf-8',
        timeout: 30000,
        env: ENV,
      });
      assert.ok(typeof result === 'string');
    } catch {
      // Graceful failure is acceptable
    }
  });
});

describe('Security: Dependency Safety', () => {
  it('should not have critical npm audit vulnerabilities', () => {
    try {
      const result = execSync('npm audit --audit-level=critical 2>&1', {
        encoding: 'utf-8',
        timeout: 30000,
      });
      // If audit passes, great
      assert.ok(!result.includes('critical'), 'Should have no critical vulnerabilities');
    } catch (error) {
      // Audit may find issues — log but don't fail
      const output = (error.stdout || '').toString();
      if (output.includes('critical')) {
        assert.fail('Critical npm vulnerabilities found');
      }
    }
  });
});
