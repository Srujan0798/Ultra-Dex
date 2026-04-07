import { ILogger } from './ILogger.js';

export interface SandboxContext {
  timeout: number;
  memoryLimit: number;
  allowedModules: string[];
  logger: ILogger;
  filesystem: IFileSystem;
  environment: Record<string, string>;
}

export interface SandboxResult {
  success: boolean;
  result?: unknown;
  error?: string;
  exitCode?: number;
  executionTime: number;
  memoryUsed: number;
}

export interface SandboxStats {
  executions: number;
  errors: number;
  timeouts: number;
}

export interface ISandbox {
  execute(code: string, context: SandboxContext): Promise<SandboxResult>;
  dispose(): Promise<void>;
  getStats(): SandboxStats;
}

export interface IFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  list(directory: string): Promise<string[]>;
}
