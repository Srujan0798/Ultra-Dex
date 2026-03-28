
import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { executeTool } from '../../lib/tools/execution.js';

describe('Tool Execution Integration Tests', () => {
  const binaryFile = 'test_binary.bin';

  before(async () => {
    // Create a binary file
    const buffer = Buffer.from([0xFF, 0xFE, 0x00, 0x00]);
    await fs.writeFile(binaryFile, buffer);
  });

  after(async () => {
    await fs.unlink(binaryFile).catch(() => {});
  });

  test('should handle large output by truncating', async () => {
    // Generate > 1MB output
    const largeOutputCmd = "node -e 'console.log(\"a\".repeat(1024 * 1024 + 100))'";
    const result = await executeTool({
      function: {
        name: 'run_shell',
        arguments: JSON.stringify({ command: largeOutputCmd })
      }
    });

    assert.strictEqual(result.success, false, 'Should fail due to truncation');
    assert.match(result.error, /truncated/, 'Error should mention truncation');
    assert.ok(result.stdout.includes('...[Output Truncated]'), 'Output should contain truncation marker');
  });

  test('should handle binary file reading by erroring', async () => {
    const result = await executeTool({
      function: {
        name: 'read_file',
        arguments: JSON.stringify({ filePath: binaryFile })
      }
    });

    assert.strictEqual(result.success, false, 'Should fail to read binary file');
    assert.match(result.error, /Cannot read binary file/, 'Error should mention binary file');
  });

  test('should handle normal execution within timeout', async () => {
    const start = Date.now();
    const sleepCmd = "node -e 'setTimeout(() => {}, 1000)'"; // 1s
    const result = await executeTool({
      function: {
        name: 'run_shell',
        arguments: JSON.stringify({ command: sleepCmd })
      }
    });
    
    assert.strictEqual(result.success, true, 'Should succeed within timeout');
    const duration = Date.now() - start;
    assert.ok(duration >= 1000, 'Should take at least 1s');
  });
});
