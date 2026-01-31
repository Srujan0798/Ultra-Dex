/**
 * Unit tests for validation utilities
 * Tests: validateProjectName, validateSafePath, assertValidPath
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectName, validateSafePath, assertValidPath } from '../lib/utils/validation.js';

describe('validation utilities', () => {
  describe('validateProjectName', () => {
    test('accepts valid project names', () => {
      assert.strictEqual(validateProjectName('my-project'), true);
      assert.strictEqual(validateProjectName('MyProject'), true);
      assert.strictEqual(validateProjectName('project123'), true);
      assert.strictEqual(validateProjectName('my-project-123'), true);
      assert.strictEqual(validateProjectName('a'), true);
    });

    test('rejects empty or whitespace names', () => {
      assert.strictEqual(validateProjectName(''), 'Project name is required');
      assert.strictEqual(validateProjectName('   '), 'Project name is required');
      assert.strictEqual(validateProjectName(null), 'Project name is required');
      assert.strictEqual(validateProjectName(undefined), 'Project name is required');
    });

    test('rejects names with special characters', () => {
      assert.strictEqual(
        validateProjectName('my_project'),
        'Project name must use only letters, numbers, and dashes'
      );
      assert.strictEqual(
        validateProjectName('my@project'),
        'Project name must use only letters, numbers, and dashes'
      );
      assert.strictEqual(
        validateProjectName('my project'),
        'Project name must use only letters, numbers, and dashes'
      );
      assert.strictEqual(
        validateProjectName('my#project'),
        'Project name must use only letters, numbers, and dashes'
      );
    });

    test('rejects names with invalid characters including path separators', () => {
      // Path separators like / \ and .. all fail the regex check first
      assert.strictEqual(
        validateProjectName('my/project'),
        'Project name must use only letters, numbers, and dashes'
      );
      assert.strictEqual(
        validateProjectName('my\\project'),
        'Project name must use only letters, numbers, and dashes'
      );
      // Note: ".." also fails regex before path separator check
      assert.strictEqual(
        validateProjectName('my../project'),
        'Project name must use only letters, numbers, and dashes'
      );
    });

    test('trims whitespace before validation', () => {
      assert.strictEqual(validateProjectName('  my-project  '), true);
      assert.strictEqual(validateProjectName('  my_project  '), 'Project name must use only letters, numbers, and dashes');
    });
  });

  describe('validateSafePath', () => {
    test('accepts valid safe paths', () => {
      assert.strictEqual(validateSafePath('my-file.txt'), true);
      assert.strictEqual(validateSafePath('my/directory'), true);
      assert.strictEqual(validateSafePath('my-file'), true);
      assert.strictEqual(validateSafePath('file-with-dashes'), true);
      assert.strictEqual(validateSafePath('/absolute/path'), true);
    });

    test('rejects empty or whitespace paths', () => {
      assert.strictEqual(validateSafePath(''), 'Path is required');
      assert.strictEqual(validateSafePath('   '), 'Path is required');
      assert.strictEqual(validateSafePath(null), 'Path is required');
      assert.strictEqual(validateSafePath(undefined), 'Path is required');
    });

    test('rejects paths with parent directory traversal', () => {
      assert.strictEqual(
        validateSafePath('../etc/passwd'),
        'Path cannot include ".."'
      );
      assert.strictEqual(
        validateSafePath('my/../secret'),
        'Path cannot include ".."'
      );
      assert.strictEqual(
        validateSafePath('..'),
        'Path cannot include ".."'
      );
    });

    test('uses custom label in error messages', () => {
      assert.strictEqual(
        validateSafePath('', 'Agent name'),
        'Agent name is required'
      );
      assert.strictEqual(
        validateSafePath('../secret', 'File path'),
        'File path cannot include ".."'
      );
    });

    test('trims whitespace before validation', () => {
      assert.strictEqual(validateSafePath('  my-file.txt  '), true);
      assert.strictEqual(validateSafePath('  ../secret  '), 'Path cannot include ".."');
    });
  });

  describe('assertValidPath', () => {
    test('returns input for valid paths', () => {
      assert.strictEqual(assertValidPath('my-file.txt'), 'my-file.txt');
      assert.strictEqual(assertValidPath('my/directory'), 'my/directory');
    });

    test('throws for invalid paths', () => {
      assert.throws(() => {
        assertValidPath('../secret');
      }, /cannot include/);

      assert.throws(() => {
        assertValidPath('');
      }, /is required/);
    });

    test('includes label in error message', () => {
      assert.throws(() => {
        assertValidPath('../secret', 'Config file');
      }, /Config file cannot include/);
    });
  });
});
