// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const LEVEL_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

function shouldLog(level, minLevel) {
  return (LEVEL_PRIORITY[level] || 100) >= (LEVEL_PRIORITY[minLevel] || 20);
}

function normalizeTraceId(context = {}) {
  return context.traceId || context.traceID || context.requestId || context.requestID || null;
}

function createRecord(level, message, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    traceId: normalizeTraceId(context),
  };
}

export function createLogger(config = {}) {
  const minLevel = (config.level || 'info').toLowerCase();
  const mode = config.mode || 'console';
  const filePath = config.filePath || path.resolve(process.cwd(), '.ultra-dex/logs/app.log');
  const customTransports = Array.isArray(config.customTransports) ? config.customTransports : [];

  async function write(record) {
    const line = `${JSON.stringify(record)}\n`;

    if (mode === 'console' || mode === 'hybrid') {
      if (record.level === 'error' || record.level === 'fatal') {
        process.stderr.write(line);
      } else {
        process.stdout.write(line);
      }
    }

    if (mode === 'file' || mode === 'hybrid') {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.appendFile(filePath, line, 'utf8');
    }

    for (const transport of customTransports) {
      await transport(record);
    }
  }

  function log(level) {
    return async (message, context = {}) => {
      if (!shouldLog(level, minLevel)) return;
      const record = createRecord(level, message, context);
      await write(record);
    };
  }

  return {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    fatal: log('fatal'),
  };
}
