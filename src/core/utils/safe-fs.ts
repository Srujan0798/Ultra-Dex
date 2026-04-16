var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (
  decorators: Function[],
  target: object,
  key: PropertyKey = '',
  kind: number = 0
) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (
        kind
          ? (decorator as (value: object, propertyKey: PropertyKey, descriptor?: unknown) => unknown)(
              target,
              key,
              result
            )
          : (decorator as (value: object) => unknown)(result as object)
      ) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import path from 'path';

type ErrorDetails = Record<string, unknown>;
type FileSystemError = NodeJS.ErrnoException;

let DataCorruptionError = class extends Error {
  filePath: string;
  override cause: unknown;
  details: ErrorDetails;
  recoveryInstructions: string[];

  constructor(filePath: string, cause: unknown, details: ErrorDetails = {}) {
    super(
      `Data corruption detected in ${filePath}. Backup recovery was attempted. Manual recovery may be needed.`
    );
    this.name = 'CorruptionError';
    this.filePath = filePath;
    this.cause = cause;
    this.details = details;
    this.recoveryInstructions = [
      `Inspect the corrupted file at ${filePath}.`,
      `Check the backup at ${filePath}.bak.`,
      'Restore or repair the file, then retry the command.',
    ];
  }
};
DataCorruptionError = __decorateClass([singleton()], DataCorruptionError) as typeof DataCorruptionError;
function atomicWriteSync(filePath: string, data: string): void {
  const directory = path.dirname(filePath);
  const tmpPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.bak`;
  mkdirSync(directory, { recursive: true });
  if (existsSync(filePath)) {
    copyFileSync(filePath, backupPath);
  }
  writeFileSync(tmpPath, data, 'utf8');
  renameSync(tmpPath, filePath);
}
function safeReadJSON<T>(filePath: string, defaultValue: T | null = null): T | null {
  try {
    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    const fileError = error as FileSystemError;
    if (fileError?.code === 'ENOENT') {
      return defaultValue;
    }
    const backupPath = `${filePath}.bak`;
    if (existsSync(backupPath)) {
      try {
        const backup = readFileSync(backupPath, 'utf8');
        const recovered = JSON.parse(backup) as T;
        atomicWriteSync(filePath, backup);
        return recovered;
      } catch (backupError) {
        throw new DataCorruptionError(filePath, fileError, {
          backupPath,
          backupError: backupError instanceof Error ? backupError.message : String(backupError),
        });
      }
    }
    throw new DataCorruptionError(filePath, fileError, { backupPath });
  }
}
function safeReadJSONL<T = unknown>(filePath: string, defaultValue: T[] = []): T[] {
  try {
    const data = readFileSync(filePath, 'utf8');
    const validEntries: T[] = [];
    let corruptedLines = 0;
    for (const [index, line] of data.split('\n').filter(Boolean).entries()) {
      try {
        validEntries.push(JSON.parse(line) as T);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        corruptedLines += 1;
        console.warn(`[safe-fs] Skipping corrupt JSONL line ${index + 1} in ${filePath}: ${message}`);
      }
    }
    if (corruptedLines > 0 && validEntries.length === 0) {
      throw new SyntaxError('All JSONL lines are corrupted');
    }
    return validEntries;
  } catch (error) {
    const fileError = error as FileSystemError;
    if (fileError?.code === 'ENOENT') {
      return defaultValue;
    }
    const backupPath = `${filePath}.bak`;
    if (existsSync(backupPath)) {
      try {
        const backup = readFileSync(backupPath, 'utf8');
        const recovered = backup
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as T);
        atomicWriteSync(filePath, backup);
        return recovered;
      } catch (backupError) {
        throw new DataCorruptionError(filePath, fileError, {
          backupPath,
          backupError: backupError instanceof Error ? backupError.message : String(backupError),
        });
      }
    }
    throw new DataCorruptionError(filePath, fileError, { backupPath });
  }
}
export {
  DataCorruptionError as CorruptionError,
  DataCorruptionError,
  atomicWriteSync,
  safeReadJSON,
  safeReadJSONL,
};
