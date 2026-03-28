import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { Logger } from '../lib/utils/logger.js';

const customTheme = {
  debug: (value) => `<debug>${value}</debug>`,
  info: (value) => `<info>${value}</info>`,
  warn: (value) => `<warn>${value}</warn>`,
  error: (value) => `<error>${value}</error>`,
  success: (value) => `<success>${value}</success>`,
  muted: (value) => `<muted>${value}</muted>`,
  dim: (value) => `<dim>${value}</dim>`,
  bold: (value) => `<bold>${value}</bold>`,
  accent: (value) => `<accent>${value}</accent>`,
};

describe('structured logger', () => {
  const originalConsoleLog = console.log;
  const originalDebug = process.env.DEBUG;
  let output = [];

  beforeEach(() => {
    output = [];
    console.log = (...args) => output.push(args.join(' '));
    delete process.env.DEBUG;
  });

  afterEach(() => {
    console.log = originalConsoleLog;

    if (originalDebug === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalDebug;
    }
  });

  test('applies level filtering', () => {
    const logger = new Logger({
      level: 'warn',
      timestamps: false,
      colorize: false,
      customTheme,
    });

    logger.info('hidden');
    logger.warn('visible');

    assert.equal(output.length, 1);
    assert.match(output[0], /visible/);
  });

  test('formats themed output with prefix and redacted metadata', () => {
    const logger = new Logger({
      timestamps: false,
      prefix: '[cycle-3]',
      customTheme,
    });

    logger.info('Token sk-123456789012345678901234 leaked', {
      detail: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
      context: 'auth',
      apiKey: 'sk-123456789012345678901234',
    });

    assert.equal(output.length, 1);
    assert.match(output[0], /\[cycle-3\]/);
    assert.match(output[0], /\[REDACTED\]/);
    assert.match(output[0], /auth/);
  });

  test('emits structured JSON when json mode is enabled', () => {
    const logger = new Logger({
      json: true,
      timestamps: false,
      prefix: 'cycle-3',
    });

    logger.error('failed to connect', {
      access_token: 'super-secret-token-value-123456789',
      context: 'network',
    });

    assert.equal(output.length, 1);

    const payload = JSON.parse(output[0]);
    assert.equal(payload.level, 'error');
    assert.equal(payload.prefix, 'cycle-3');
    assert.equal(payload.context, 'network');
    assert.match(payload.access_token, /\[REDACTED\]/);
  });

  test('records success logs in history and redacts details', () => {
    const logger = new Logger({
      timestamps: false,
      customTheme,
    });

    logger.success('completed', {
      detail: 'sk-123456789012345678901234',
    });

    assert.equal(output.length, 1);
    assert.equal(logger.history.length, 1);
    assert.equal(logger.history[0].meta.status, 'success');
    assert.match(output[0], /completed/);
    assert.match(output[0], /\[REDACTED\]/);
  });

  test('only emits debug logs when DEBUG is set', () => {
    const logger = new Logger({
      level: 'info',
      timestamps: false,
      customTheme,
    });

    logger.debug('hidden debug');
    assert.equal(output.length, 0);

    process.env.DEBUG = '1';
    logger.debug('visible debug');
    assert.equal(output.length, 1);
    assert.match(output[0], /visible debug/);
  });
});
