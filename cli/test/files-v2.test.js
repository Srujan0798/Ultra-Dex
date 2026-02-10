import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { readFileSafe, pathExists, copyDirectory } from '../lib/utils/files.js';

test('Files: readFileSafe', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
  const testFile = path.join(tmpDir, 'test.txt');
  await fs.writeFile(testFile, 'hello world');

  const result = await readFileSafe(testFile, 'TestFile');
  assert.strictEqual(result.label, 'TestFile');
  assert.strictEqual(result.content, 'hello world');

  const missing = await readFileSafe(path.join(tmpDir, 'missing.txt'), 'Missing');
  assert.strictEqual(missing.content, '');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('Files: pathExists', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
  const testFile = path.join(tmpDir, 'test.txt');
  await fs.writeFile(testFile, 'content');

  assert.strictEqual(await pathExists(testFile, 'file'), true);
  assert.strictEqual(await pathExists(tmpDir, 'dir'), true);
  assert.strictEqual(await pathExists(testFile, 'dir'), false);
  assert.strictEqual(await pathExists(path.join(tmpDir, 'none'), 'file'), false);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('Files: copyDirectory', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-copy-test-'));
  const src = path.join(tmpRoot, 'src');
  const dest = path.join(tmpRoot, 'dest');

  await fs.mkdir(path.join(src, 'sub'), { recursive: true });
  await fs.writeFile(path.join(src, 'a.txt'), 'A');
  await fs.writeFile(path.join(src, 'sub', 'b.txt'), 'B');

  await copyDirectory(src, dest);

  assert.strictEqual(await pathExists(path.join(dest, 'a.txt')), true);
  assert.strictEqual(await pathExists(path.join(dest, 'sub', 'b.txt')), true);
  assert.strictEqual(await fs.readFile(path.join(dest, 'a.txt'), 'utf8'), 'A');

  await fs.rm(tmpRoot, { recursive: true, force: true });
});

/**
 * Error handler for files-v2.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[files-v2.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
