/**
 * Unit tests for file utilities
 * Tests: readFileSafe, pathExists, resolveAssetPath, copyDirectory
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSafe, pathExists, resolveAssetPath, copyDirectory } from '../lib/utils/files.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('file utilities', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-files-test-'));
  });

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('readFileSafe', () => {
    test('reads existing file', async () => {
      const filePath = path.join(tmpDir, 'test.txt');
      await fs.writeFile(filePath, 'Hello World');

      const result = await readFileSafe(filePath, 'Test File');

      assert.strictEqual(result.label, 'Test File');
      assert.strictEqual(result.content, 'Hello World');
    });

    test('returns empty content for non-existent file', async () => {
      const result = await readFileSafe(path.join(tmpDir, 'non-existent.txt'), 'Missing');

      assert.strictEqual(result.label, 'Missing');
      assert.strictEqual(result.content, '');
    });

    test('handles empty label parameter', async () => {
      const filePath = path.join(tmpDir, 'test.txt');
      await fs.writeFile(filePath, 'content');

      const result = await readFileSafe(filePath);

      assert.strictEqual(result.label, '');
      assert.strictEqual(result.content, 'content');
    });

    test('handles permission errors gracefully', async () => {
      // Create a file and make it unreadable (on Unix systems)
      const filePath = path.join(tmpDir, 'unreadable.txt');
      await fs.writeFile(filePath, 'secret');

      // On Windows, chmod doesn't work the same way
      // So we'll just test that it returns empty on any error
      try {
        await fs.chmod(filePath, 0o000);
        const result = await readFileSafe(filePath);
        assert.strictEqual(result.content, '');
      } finally {
        // Restore permissions for cleanup
        try {
          await fs.chmod(filePath, 0o644);
        } catch {}
      }
    });
  });

  describe('pathExists', () => {
    test('returns true for existing file', async () => {
      const filePath = path.join(tmpDir, 'exists.txt');
      await fs.writeFile(filePath, 'content');

      const result = await pathExists(filePath, 'file');

      assert.strictEqual(result, true);
    });

    test('returns false for non-existent file', async () => {
      const result = await pathExists(path.join(tmpDir, 'non-existent.txt'), 'file');

      assert.strictEqual(result, false);
    });

    test('returns true for existing directory', async () => {
      const dirPath = path.join(tmpDir, 'subdir');
      await fs.mkdir(dirPath);

      const result = await pathExists(dirPath, 'dir');

      assert.strictEqual(result, true);
    });

    test('returns false when checking file but path is directory', async () => {
      const dirPath = path.join(tmpDir, 'subdir');
      await fs.mkdir(dirPath);

      const result = await pathExists(dirPath, 'file');

      assert.strictEqual(result, false);
    });

    test('returns false when checking directory but path is file', async () => {
      const filePath = path.join(tmpDir, 'file.txt');
      await fs.writeFile(filePath, 'content');

      const result = await pathExists(filePath, 'dir');

      assert.strictEqual(result, false);
    });

    test('defaults to checking for file', async () => {
      const filePath = path.join(tmpDir, 'default-check.txt');
      await fs.writeFile(filePath, 'content');

      const result = await pathExists(filePath);

      assert.strictEqual(result, true);
    });
  });

  describe('resolveAssetPath', () => {
    test('joins base path with relative path', () => {
      const result = resolveAssetPath('/base/dir', 'relative/path');

      assert.ok(result.includes('base'));
      assert.ok(result.includes('relative'));
      assert.ok(result.includes('path'));
    });

    test('handles absolute base path', () => {
      const result = resolveAssetPath('/absolute/base', 'file.txt');

      assert.strictEqual(path.isAbsolute(result), true);
    });

    test('handles relative base path', () => {
      const result = resolveAssetPath('relative/base', 'file.txt');

      assert.ok(result.includes('relative'));
      assert.ok(result.includes('base'));
      assert.ok(result.includes('file.txt'));
    });

    test('handles nested relative paths', () => {
      const result = resolveAssetPath('/base', 'deep/nested/path/file.txt');

      assert.ok(result.includes('deep'));
      assert.ok(result.includes('nested'));
      assert.ok(result.includes('file.txt'));
    });
  });

  describe('copyDirectory', () => {
    test('copies all files from source to target', async () => {
      const sourceDir = path.join(tmpDir, 'source');
      const targetDir = path.join(tmpDir, 'target');

      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(sourceDir, 'file2.txt'), 'content2');

      await copyDirectory(sourceDir, targetDir);

      const file1Content = await fs.readFile(path.join(targetDir, 'file1.txt'), 'utf8');
      const file2Content = await fs.readFile(path.join(targetDir, 'file2.txt'), 'utf8');

      assert.strictEqual(file1Content, 'content1');
      assert.strictEqual(file2Content, 'content2');
    });

    test('recursively copies subdirectories', async () => {
      const sourceDir = path.join(tmpDir, 'source');
      const targetDir = path.join(tmpDir, 'target');
      const subDir = path.join(sourceDir, 'subdir');

      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(subDir, 'nested.txt'), 'nested content');

      await copyDirectory(sourceDir, targetDir);

      const nestedContent = await fs.readFile(path.join(targetDir, 'subdir', 'nested.txt'), 'utf8');
      assert.strictEqual(nestedContent, 'nested content');
    });

    test('handles empty source directory', async () => {
      const sourceDir = path.join(tmpDir, 'empty-source');
      const targetDir = path.join(tmpDir, 'target');

      await fs.mkdir(sourceDir);

      await copyDirectory(sourceDir, targetDir);

      const targetExists = await pathExists(targetDir, 'dir');
      assert.strictEqual(targetExists, true);
    });

    test('creates target directory if it does not exist', async () => {
      const sourceDir = path.join(tmpDir, 'source');
      const targetDir = path.join(tmpDir, 'new-target');

      await fs.mkdir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'file.txt'), 'content');

      await copyDirectory(sourceDir, targetDir);

      const targetExists = await pathExists(targetDir, 'dir');
      assert.strictEqual(targetExists, true);
    });

    test('overwrites existing files in target', async () => {
      const sourceDir = path.join(tmpDir, 'source');
      const targetDir = path.join(tmpDir, 'target');

      await fs.mkdir(sourceDir, { recursive: true });
      await fs.mkdir(targetDir, { recursive: true });

      await fs.writeFile(path.join(sourceDir, 'file.txt'), 'new content');
      await fs.writeFile(path.join(targetDir, 'file.txt'), 'old content');

      await copyDirectory(sourceDir, targetDir);

      const content = await fs.readFile(path.join(targetDir, 'file.txt'), 'utf8');
      assert.strictEqual(content, 'new content');
    });
  });
});
