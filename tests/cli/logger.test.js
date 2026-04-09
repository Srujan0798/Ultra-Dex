// Copyright (c) 2026 Ultra-Dex

import { describe, test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import chalk from 'chalk';
import { Logger, LOG_LEVELS, THEMES } from '../../apps/cli/lib/utils/logger.js';

describe('Logger class', () => {
  let logMock;
  let originalEnv;

  beforeEach(() => {
    logMock = mock.method(console, 'log', () => {});
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    logMock.mock.restore();
    process.env = originalEnv;
  });

  test('should respect log levels', () => {
    const logger = new Logger({ level: 'warn', timestamps: false, colorize: false });

    logger.info('this should not be logged');
    assert.strictEqual(logMock.mock.callCount(), 0);

    logger.warn('this should be logged');
    assert.strictEqual(logMock.mock.callCount(), 1);
    assert.match(logMock.mock.calls[0].arguments[0], /this should be logged/);

    logger.error('this should also be logged');
    assert.strictEqual(logMock.mock.callCount(), 2);
  });

  test('should support debug logging when DEBUG env is set', () => {
    process.env.DEBUG = 'true';
    const logger = new Logger({ level: 'debug', timestamps: false, colorize: false });

    logger.debug('debug message');
    assert.strictEqual(logMock.mock.callCount(), 1);
    assert.match(logMock.mock.calls[0].arguments[0], /debug message/);
  });

  test('should not log debug when DEBUG env is not set', () => {
    delete process.env.DEBUG;
    const logger = new Logger({ level: 'info', timestamps: false, colorize: false });

    logger.debug('debug message');
    assert.strictEqual(logMock.mock.callCount(), 0);
  });

  test('should support different themes', () => {
    const logger = new Logger({ theme: 'doomsday', timestamps: false, colorize: true });

    // We can't easily check the exact chalk output because it depends on terminal support,
    // but we can check if the theme is correctly set.
    assert.strictEqual(logger.theme, 'doomsday');

    const theme = logger.getTheme();
    // Doomsday theme uses hex colors which results in specific chalk instances
    assert.ok(theme);
  });

  test('should support custom themes', () => {
    const customTheme = {
      info: (msg) => `CUSTOM_${msg}`,
      muted: (msg) => msg,
    };
    const logger = new Logger({ customTheme, timestamps: false, colorize: false });

    logger.info('message');
    assert.match(logMock.mock.calls[0].arguments[0], /CUSTOM_message/);
  });

  test('should format messages with prefix and timestamps', () => {
    const logger = new Logger({
      prefix: 'PRE:',
      timestamps: true,
      colorize: false,
    });

    logger.info('message');
    const output = logMock.mock.calls[0].arguments[0];

    // Check for ISO timestamp pattern [YYYY-MM-DDTHH:mm:ss.sssZ]
    assert.match(output, /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    assert.match(output, /PRE:/);
    assert.match(output, /message/);
  });

  test('should handle metadata (detail and context)', () => {
    const logger = new Logger({ timestamps: false, colorize: false });

    logger.info('main message', { detail: 'extra info', context: 'auth' });
    const output = logMock.mock.calls[0].arguments[0];

    assert.match(output, /main message/);
    assert.match(output, /· extra info/);
    assert.match(output, /\(auth\)/);
  });

  test('should support success() logging', () => {
    const logger = new Logger({ timestamps: false, colorize: false });

    logger.success('congrats');
    assert.strictEqual(logMock.mock.callCount(), 1);
    assert.match(logMock.mock.calls[0].arguments[0], /congrats/);
  });

  test('should support step() logging', () => {
    const logger = new Logger({ timestamps: false, colorize: false });

    logger.step(1, 5, 'task');
    assert.match(logMock.mock.calls[0].arguments[0], /\[1\/5\] task/);
  });

  test('should support header() logging', () => {
    const logger = new Logger({ timestamps: false, colorize: false });

    logger.header('SECTION');
    // header logs 3 lines: empty, text, separator
    assert.strictEqual(logMock.mock.callCount(), 3);
    assert.match(logMock.mock.calls[1].arguments[0], /SECTION/);
    assert.match(logMock.mock.calls[2].arguments[0], /─{10,}/);
  });

  test('should support table() logging', () => {
    const logger = new Logger({ timestamps: false, colorize: false });

    logger.table([
      ['id', 'name'],
      ['1', 'test'],
    ]);
    assert.strictEqual(logMock.mock.callCount(), 2);
    assert.strictEqual(logMock.mock.calls[0].arguments[0], 'id\tname');
    assert.strictEqual(logMock.mock.calls[1].arguments[0], '1\ttest');
  });

  test('child() should inherit options and allow overrides', () => {
    const parent = new Logger({ prefix: 'PARENT:', theme: 'default' });
    const child = parent.child({ prefix: 'CHILD:' });

    assert.strictEqual(child.theme, 'default');
    assert.strictEqual(child.prefix, 'CHILD:');
    assert.strictEqual(child.level, parent.level);
  });
});
