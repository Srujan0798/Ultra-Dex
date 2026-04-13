/**
 * Ultra-Dex Structured Logger
 *
 * Production-grade logging with levels, structured output, and multiple transports.
 * Supports JSON for production and pretty printing for development.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Log Levels
// ──────────────────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ──────────────────────────────────────────────────────────────────────────────
// Log Entry
// ──────────────────────────────────────────────────────────────────────────────

export interface LogContext {
  workflowId?: string;
  taskId?: string;
  nodeId?: string;
  agentType?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  metadata?: Record<string, unknown>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Transport Interface
// ──────────────────────────────────────────────────────────────────────────────

export interface LogTransport {
  log(entry: LogEntry): void;
  flush?(): Promise<void>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Console Transport
// ──────────────────────────────────────────────────────────────────────────────

export class ConsoleTransport implements LogTransport {
  private json: boolean;
  private colorize: boolean;

  constructor(options?: { json?: boolean; colorize?: boolean }) {
    this.json = options?.json ?? process.env.NODE_ENV === 'production';
    this.colorize = options?.colorize ?? process.env.NODE_ENV !== 'production';
  }

  log(entry: LogEntry): void {
    if (this.json) {
      console.log(JSON.stringify({
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        ...entry.context,
        ...entry.metadata,
        error: entry.error ? {
          message: entry.error.message,
          stack: entry.error.stack,
        } : undefined,
      }));
      return;
    }

    const color = this.getColor(entry.level);
    const reset = '\x1b[0m';
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const err = entry.error ? `\n${entry.error.stack}` : '';
    
    console.log(
      `${color}[${entry.timestamp}] ${entry.level.toUpperCase()}:${reset} ${entry.message}${ctx}${err}`
    );
  }

  private getColor(level: LogLevel): string {
    if (!this.colorize) return '';
    switch (level) {
      case 'debug': return '\x1b[36m'; // cyan
      case 'info': return '\x1b[32m'; // green
      case 'warn': return '\x1b[33m'; // yellow
      case 'error': return '\x1b[31m'; // red
      case 'fatal': return '\x1b[35m'; // magenta
      default: return '';
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// File Transport
// ──────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs/promises';
import * as path from 'path';

export class FileTransport implements LogTransport {
  private filepath: string;
  private buffer: string[] = [];
  private maxBuffer = 100;

  constructor(filepath: string) {
    this.filepath = filepath;
  }

  log(entry: LogEntry): void {
    this.buffer.push(JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      ...entry.context,
      error: entry.error?.message,
    }));

    if (this.buffer.length >= this.maxBuffer) {
      this.flush().catch(() => {});
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const data = this.buffer.join('\n') + '\n';
    this.buffer = [];
    
    try {
      await fs.mkdir(path.dirname(this.filepath), { recursive: true });
      await fs.appendFile(this.filepath, data);
    } catch {
      // Fail silently - logging shouldn't break execution
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Logger
// ──────────────────────────────────────────────────────────────────────────────

export interface LoggerConfig {
  level?: LogLevel;
  transports?: LogTransport[];
  defaultContext?: LogContext;
}

export class Logger {
  private level: number;
  private transports: LogTransport[];
  private defaultContext?: LogContext;

  constructor(config?: LoggerConfig) {
    this.level = LEVELS[config?.level ?? 'info'];
    this.transports = config?.transports ?? [new ConsoleTransport()];
    this.defaultContext = config?.defaultContext;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, metadata?: Record<string, unknown>): void {
    if (LEVELS[level] < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.defaultContext, ...context },
      error,
      metadata,
    };

    for (const transport of this.transports) {
      transport.log(entry);
    }
  }

  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.log('debug', message, context, undefined, metadata);
  }

  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.log('info', message, context, undefined, metadata);
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.log('warn', message, context, undefined, metadata);
  }

  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.log('error', message, context, error, metadata);
  }

  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.log('fatal', message, context, error, metadata);
  }

  /** Create child logger with additional default context */
  child(additionalContext: LogContext): Logger {
    return new Logger({
      level: Object.keys(LEVELS).find(k => LEVELS[k as LogLevel] === this.level) as LogLevel,
      transports: this.transports,
      defaultContext: { ...this.defaultContext, ...additionalContext },
    });
  }

  async flush(): Promise<void> {
    await Promise.all(this.transports.map(t => t.flush?.()));
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Global Logger
// ──────────────────────────────────────────────────────────────────────────────

let _globalLogger: Logger | undefined;

export function getGlobalLogger(): Logger {
  if (!_globalLogger) {
    _globalLogger = new Logger({
      level: (process.env.LOG_LEVEL as LogLevel) ?? 'info',
      transports: [
        new ConsoleTransport(),
        ...(process.env.LOG_FILE ? [new FileTransport(process.env.LOG_FILE)] : []),
      ],
    });
  }
  return _globalLogger;
}

export function setGlobalLogger(logger: Logger): void {
  _globalLogger = logger;
}
