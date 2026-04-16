export interface LegacyLogger {
  log(entry?: unknown): void;
  debug(message: string, metadata?: unknown, ...args: unknown[]): void;
  info(message: string, metadata?: unknown, ...args: unknown[]): void;
  warn(message: string, metadata?: unknown, ...args: unknown[]): void;
  warning(message: string, metadata?: unknown, ...args: unknown[]): void;
  error(message: string, metadata?: unknown, ...args: unknown[]): void;
  success(message: string, metadata?: unknown, ...args: unknown[]): void;
  close(): void;
  stream: {
    write(message: string): void;
  };
  perf(operation: string, duration: number | string, metadata?: Record<string, unknown>): void;
  metric(name: string, value: number, metadata?: Record<string, unknown>): void;
  trace(message: string, metadata?: Record<string, unknown>): void;
}

export const logger: LegacyLogger;
