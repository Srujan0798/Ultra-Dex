var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import ivm from 'isolated-vm';
import { singleton, inject } from 'tsyringe';
import { DI_TOKENS } from '../di/tokens.js';
import { VirtualFileSystem } from './virtual-fs.js';
let IsolatedVMSandbox = class {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
    this.maxIsolates = this.config.get('sandbox.isolatedVm.maxIsolates', 100);
    this.defaultTimeout = this.config.get('sandbox.isolatedVm.timeout', 5e3);
    this.defaultMemoryLimit = this.config.get('sandbox.isolatedVm.memoryLimit', 128);
  }
  isolates = [];
  stats = {
    executions: 0,
    errors: 0,
    timeouts: 0,
  };
  maxIsolates;
  defaultTimeout;
  defaultMemoryLimit;
  async execute(code, context) {
    const startTime = Date.now();
    const executionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (this.isolates.length >= this.maxIsolates) {
      this.logger.warn('Isolate pool limit reached, disposing oldest isolate');
      this.disposeOldestIsolate();
    }
    const memoryLimit = context.memoryLimit || this.defaultMemoryLimit;
    const timeout = context.timeout || this.defaultTimeout;
    this.logger.debug('Creating isolated VM', {
      executionId,
      memoryLimit,
      timeout,
    });
    const isolate = new ivm.Isolate({
      memoryLimit,
      // MB
    });
    this.isolates.push({ isolate, createdAt: Date.now() });
    try {
      const jail = await isolate.createContext();
      const consoleRef = new ivm.Reference({
        log: (...args) => {
          const message = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
            .join(' ');
          context.logger.info(`[sandbox] ${message}`);
        },
        error: (...args) => {
          const message = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
            .join(' ');
          context.logger.error(`[sandbox] ${message}`);
        },
        warn: (...args) => {
          const message = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
            .join(' ');
          context.logger.warn(`[sandbox] ${message}`);
        },
      });
      await jail.global.set('_console', consoleRef, { reference: true });
      await this.injectAllowedModules(jail, context.allowedModules);
      if (context.filesystem instanceof VirtualFileSystem) {
        await this.injectFileSystem(jail, context.filesystem);
      }
      const wrappedCode = `
        (async () => {
          const console = _console;
          try {
            ${code}
          } catch (error) {
            return { __error: error.message, __stack: error.stack };
          }
        })()
      `;
      this.logger.debug('Compiling script', { executionId, codeLength: code.length });
      const script = await isolate.compileScript(wrappedCode);
      this.logger.debug('Executing script', { executionId, timeout });
      const result = await script.run(jail, { timeout });
      this.stats.executions++;
      if (result && typeof result === 'object' && '__error' in result) {
        return {
          success: false,
          error: result.__error,
          exitCode: 1,
          executionTime: Date.now() - startTime,
          memoryUsed: 0,
          // Heap metrics are unavailable from the current isolated-vm execution path.
        };
      }
      let copiedResult;
      if (result instanceof ivm.Reference) {
        copiedResult = await result.copy();
      } else if (result instanceof ivm.ExternalCopy) {
        copiedResult = result.copy();
      } else {
        copiedResult = result;
      }
      this.logger.debug('Script executed successfully', {
        executionId,
        executionTime: Date.now() - startTime,
      });
      return {
        success: true,
        result: copiedResult,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        // Heap metrics are unavailable from the current isolated-vm execution path.
      };
    } catch (error) {
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('timeout') || errorMessage.includes('Script execution timed out')) {
        this.stats.timeouts++;
        this.logger.warn('Script execution timed out', { executionId, timeout });
        return {
          success: false,
          error: `Execution timed out after ${timeout}ms`,
          exitCode: 124,
          // Standard timeout exit code
          executionTime: Date.now() - startTime,
          memoryUsed: 0,
        };
      }
      if (errorMessage.includes('memory limit')) {
        this.logger.error('Script exceeded memory limit', new Error(errorMessage), {
          executionId,
          memoryLimit,
        });
        return {
          success: false,
          error: `Memory limit exceeded (${memoryLimit}MB)`,
          exitCode: 137,
          // OOM exit code
          executionTime: Date.now() - startTime,
          memoryUsed: memoryLimit * 1024 * 1024,
        };
      }
      this.logger.error('Script execution failed', error, { executionId });
      return {
        success: false,
        error: errorMessage,
        exitCode: 1,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
      };
    } finally {
      isolate.dispose();
      this.isolates = this.isolates.filter((r) => r.isolate !== isolate);
    }
  }
  async dispose() {
    this.logger.info('Disposing all isolates', { count: this.isolates.length });
    for (const record of this.isolates) {
      record.isolate.dispose();
    }
    this.isolates = [];
  }
  getStats() {
    return { ...this.stats };
  }
  async injectAllowedModules(jail, allowedModules) {
    for (const mod of allowedModules) {
      switch (mod) {
        case 'crypto': {
          const cryptoRef = new ivm.Reference({
            randomUUID: () => crypto.randomUUID(),
            randomBytes: (size) => {
              if (size > 1024) {
                throw new Error('randomBytes size limit exceeded (max 1024)');
              }
              return crypto.randomBytes(size).toString('hex');
            },
          });
          await jail.global.set('_crypto', cryptoRef, { reference: true });
          break;
        }
        case 'util': {
          const utilRef = new ivm.Reference({
            inspect: (obj) => JSON.stringify(obj),
          });
          await jail.global.set('_util', utilRef, { reference: true });
          break;
        }
      }
    }
  }
  async injectFileSystem(jail, fs) {
    const fsRef = new ivm.Reference({
      readFile: async (path) => {
        return fs.readFile(path);
      },
      writeFile: async (path, content) => {
        return fs.writeFile(path, content);
      },
      exists: async (path) => {
        return fs.exists(path);
      },
    });
    await jail.global.set('_fs', fsRef, { reference: true });
  }
  disposeOldestIsolate() {
    if (this.isolates.length === 0) return;
    const oldest = this.isolates.reduce((prev, current) =>
      prev.createdAt < current.createdAt ? prev : current
    );
    oldest.isolate.dispose();
    this.isolates = this.isolates.filter((r) => r !== oldest);
    this.logger.debug('Disposed oldest isolate');
  }
};
IsolatedVMSandbox = __decorateClass(
  [
    singleton(),
    __decorateParam(0, inject(DI_TOKENS.Logger)),
    __decorateParam(1, inject(DI_TOKENS.ConfigService)),
  ],
  IsolatedVMSandbox
);
export { IsolatedVMSandbox };
