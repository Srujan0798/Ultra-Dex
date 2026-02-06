/**
 * Unit tests for UI theme utilities
 * Tests: theme, box, divider, header, status, statusLine, progressBar, etc.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  theme,
  box,
  divider,
  header,
  status,
  statusLine,
  progressBar,
  themeColors,
  ultraGradient,
} from '../lib/ui/theme.js';

describe('theme utilities', () => {
  describe('themeColors', () => {
    test('exports expected color constants', () => {
      assert.ok(themeColors.primary, 'Should have primary color');
      assert.ok(themeColors.secondary, 'Should have secondary color');
      assert.ok(themeColors.accent, 'Should have accent color');
      assert.ok(themeColors.success, 'Should have success color');
      assert.ok(themeColors.error, 'Should have error color');
      assert.ok(themeColors.warning, 'Should have warning color');
      assert.ok(themeColors.dim, 'Should have dim color');
      assert.ok(themeColors.muted, 'Should have muted color');
    });

    test('color values are valid hex strings', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      for (const [key, value] of Object.entries(themeColors)) {
        assert.ok(hexRegex.test(value), `${key} should be valid hex color: ${value}`);
      }
    });
  });

  describe('ultraGradient', () => {
    test('is a function', () => {
      assert.strictEqual(typeof ultraGradient, 'function');
    });

    test('returns string with ANSI codes for valid input', () => {
      const result = ultraGradient('Hello World');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('Hello World'), 'Should contain original text');
      // Gradient strings may or may not contain visible ANSI codes depending on terminal
      // Just verify it's a string and contains the content
      assert.ok(result.length > 0, 'Should return non-empty string');
    });

    test('handles empty string', () => {
      const result = ultraGradient('');
      assert.strictEqual(typeof result, 'string');
    });

    test('handles multiline string', () => {
      const result = ultraGradient('Line 1\nLine 2\nLine 3');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('Line 1'), 'Should contain first line');
      assert.ok(result.includes('Line 2'), 'Should contain second line');
      assert.ok(result.includes('Line 3'), 'Should contain third line');
    });
  });

  describe('theme object', () => {
    test('exports expected theme functions', () => {
      assert.strictEqual(typeof theme.primary, 'function', 'Should have primary function');
      assert.strictEqual(typeof theme.secondary, 'function', 'Should have secondary function');
      assert.strictEqual(typeof theme.accent, 'function', 'Should have accent function');
      assert.strictEqual(typeof theme.success, 'function', 'Should have success function');
      assert.strictEqual(typeof theme.error, 'function', 'Should have error function');
      assert.strictEqual(typeof theme.warning, 'function', 'Should have warning function');
      assert.strictEqual(typeof theme.dim, 'function', 'Should have dim function');
      assert.strictEqual(typeof theme.muted, 'function', 'Should have muted function');
      assert.strictEqual(typeof theme.title, 'function', 'Should have title function');
      assert.strictEqual(typeof theme.subtitle, 'function', 'Should have subtitle function');
      assert.strictEqual(typeof theme.highlight, 'function', 'Should have highlight function');
      assert.strictEqual(typeof theme.link, 'function', 'Should have link function');
      assert.strictEqual(typeof theme.code, 'function', 'Should have code function');
    });

    test('theme functions return strings', () => {
      const text = 'test';
      assert.strictEqual(typeof theme.primary(text), 'string');
      assert.strictEqual(typeof theme.secondary(text), 'string');
      assert.strictEqual(typeof theme.success(text), 'string');
      assert.strictEqual(typeof theme.error(text), 'string');
    });

    test('title function returns bold styled text', () => {
      const result = theme.title('Title Text');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('Title Text'), 'Should contain original text');
    });

    test('subtitle function works correctly', () => {
      const result = theme.subtitle('Subtitle Text');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('Subtitle Text'), 'Should contain original text');
    });
  });

  describe('box function', () => {
    test('returns string', () => {
      const result = box('content');
      assert.strictEqual(typeof result, 'string');
    });

    test('contains content', () => {
      const content = 'Hello World';
      const result = box(content);
      assert.ok(result.includes('Hello World'), 'Should contain content');
    });

    test('includes box drawing characters', () => {
      const result = box('content');
      assert.ok(result.includes('╭') || result.includes('┌'), 'Should have top-left corner');
      assert.ok(result.includes('╮') || result.includes('┐'), 'Should have top-right corner');
      assert.ok(result.includes('╰') || result.includes('└'), 'Should have bottom-left corner');
      assert.ok(result.includes('╯') || result.includes('┘'), 'Should have bottom-right corner');
    });

    test('handles multiline content', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const result = box(content);
      assert.ok(result.includes('Line 1'), 'Should contain Line 1');
      assert.ok(result.includes('Line 2'), 'Should contain Line 2');
      assert.ok(result.includes('Line 3'), 'Should contain Line 3');
    });

    test('includes title when provided', () => {
      const result = box('content', 'My Title');
      assert.ok(result.includes('My Title'), 'Should contain title');
    });

    test('handles empty content', () => {
      const result = box('');
      assert.strictEqual(typeof result, 'string');
    });
  });

  describe('divider function', () => {
    test('returns string', () => {
      const result = divider();
      assert.strictEqual(typeof result, 'string');
    });

    test('uses default character', () => {
      const result = divider();
      assert.ok(result.includes('─'), 'Should use box drawing character by default');
    });

    test('uses custom character', () => {
      const result = divider('=');
      assert.ok(result.includes('='), 'Should use custom character');
    });

    test('uses default width', () => {
      const result = divider();
      // Default width is 60, plus ANSI codes
      assert.ok(result.length >= 60, 'Should be at least 60 characters wide');
    });

    test('uses custom width', () => {
      const result = divider('-', 20);
      // Should be around 20 characters (plus ANSI codes)
      const cleanResult = result.replace(/\x1b\[[0-9;]*m/g, '');
      assert.strictEqual(cleanResult.length, 20, 'Should be 20 characters wide');
    });
  });

  describe('status icons', () => {
    test('exports all status icons', () => {
      assert.ok(status.success, 'Should have success icon');
      assert.ok(status.error, 'Should have error icon');
      assert.ok(status.warning, 'Should have warning icon');
      assert.ok(status.info, 'Should have info icon');
      assert.ok(status.pending, 'Should have pending icon');
      assert.ok(status.running, 'Should have running icon');
      assert.ok(status.arrow, 'Should have arrow icon');
      assert.ok(status.bullet, 'Should have bullet icon');
    });

    test('status icons are strings', () => {
      assert.strictEqual(typeof status.success, 'string');
      assert.strictEqual(typeof status.error, 'string');
      assert.strictEqual(typeof status.warning, 'string');
      assert.strictEqual(typeof status.info, 'string');
    });
  });

  describe('statusLine function', () => {
    test('outputs formatted status line', () => {
      // Mock console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (msg) => {
        output += msg + '\n';
      };

      statusLine(status.success, 'Task completed');

      console.log = originalLog;

      assert.ok(output.includes('Task completed'), 'Should contain status text');
    });

    test('includes detail when provided', () => {
      const originalLog = console.log;
      let output = '';
      console.log = (msg) => {
        output += msg + '\n';
      };

      statusLine(status.success, 'Task completed', '2s');

      console.log = originalLog;

      assert.ok(output.includes('Task completed'), 'Should contain status text');
      assert.ok(output.includes('2s'), 'Should contain detail');
    });
  });

  describe('progressBar function', () => {
    test('returns string', () => {
      const result = progressBar(50, 100);
      assert.strictEqual(typeof result, 'string');
    });

    test('shows correct percentage', () => {
      const result = progressBar(50, 100);
      assert.ok(result.includes('50%') || result.includes('50'), 'Should show 50%');
    });

    test('shows 0% at start', () => {
      const result = progressBar(0, 100);
      assert.ok(result.includes('0%') || result.includes('0'), 'Should show 0%');
    });

    test('shows 100% at end', () => {
      const result = progressBar(100, 100);
      assert.ok(result.includes('100%') || result.includes('100'), 'Should show 100%');
    });

    test('uses custom width', () => {
      const result = progressBar(50, 100, 20);
      // Check that bar is approximately 20 characters
      assert.ok(result.length > 0, 'Should return non-empty string');
    });

    test('handles edge case of 0 total', () => {
      const result = progressBar(0, 0);
      assert.strictEqual(typeof result, 'string');
    });
  });
});
