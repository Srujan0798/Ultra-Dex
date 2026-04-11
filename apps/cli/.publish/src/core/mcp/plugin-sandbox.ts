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
import { singleton, inject } from 'tsyringe';
import { DI_TOKENS } from '../di/tokens.js';
let PluginSandbox = class {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
  }
  allowedBuiltins = /* @__PURE__ */ new Set([
    'assert',
    'buffer',
    'crypto',
    'events',
    'path',
    'querystring',
    'stream',
    'string_decoder',
    'timers',
    'url',
    'util',
    'zlib',
  ]);
  dangerousModules = /* @__PURE__ */ new Set([
    'child_process',
    'cluster',
    'dgram',
    'dns',
    'http',
    'https',
    'net',
    'os',
    'repl',
    'tls',
    'v8',
    'vm',
  ]);
  /**
   * Execute plugin code in sandbox
   */
  async execute(code, context) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    try {
      const result = await this.runInVM2(code, context);
      const executionTime = Date.now() - startTime;
      const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;
      return {
        success: true,
        result,
        executionTime,
        memoryUsed,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;
      return {
        success: false,
        error: this.sanitizeError(error),
        executionTime,
        memoryUsed,
      };
    }
  }
  /**
   * Execute plugin function with context
   */
  async executeFunction(fn, args, context) {
    const startTime = Date.now();
    const timeoutMs = context.timeout || 5e3;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Plugin execution timeout after ${timeoutMs}ms`)),
        timeoutMs
      );
    });
    try {
      const result = await Promise.race([fn(...args), timeoutPromise]);
      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        // Would need more sophisticated tracking
      };
    } catch (error) {
      return {
        success: false,
        error: this.sanitizeError(error),
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
      };
    }
  }
  /**
   * Validate plugin code for security issues
   */
  validateCode(code) {
    const violations = [];
    if (/\beval\s*\(/i.test(code) || /new\s+Function\s*\(/i.test(code)) {
      violations.push({
        type: 'eval',
        message: 'Plugin uses eval() or new Function() which is not allowed',
      });
    }
    this.dangerousModules.forEach((mod) => {
      const regex = new RegExp(`require\\s*\\(\\s*['"]${mod}['"]\\s*\\)`, 'i');
      if (regex.test(code)) {
        violations.push({
          type: 'module',
          message: `Plugin imports dangerous module: ${mod}`,
        });
      }
    });
    if (/\bprocess\s*\.\s*(env|exit|kill|chdir|umask)/i.test(code)) {
      violations.push({
        type: 'process',
        message: 'Plugin accesses restricted process properties',
      });
    }
    if (/\bfs\s*\.\s*(write|append|unlink|rmdir|chmod)/i.test(code)) {
      violations.push({
        type: 'filesystem',
        message: 'Plugin performs filesystem write operations without permission',
      });
    }
    if (/\bhttp\s*\.\s*request|\bhttps\s*\.\s*request|fetch\s*\(/i.test(code)) {
      violations.push({
        type: 'network',
        message: 'Plugin makes network requests without permission',
      });
    }
    return violations;
  }
  /**
   * Create sandboxed require function
   */
  createSandboxedRequire(context) {
    return (moduleName) => {
      if (!this.isModuleAllowed(moduleName, context)) {
        throw new Error(`Module '${moduleName}' is not allowed in plugin sandbox`);
      }
      try {
        return require(moduleName);
      } catch (error) {
        this.logger.error('Sandbox module load error', error);
        throw error;
      }
    };
  }
  /**
   * Create sandboxed console
   */
  createSandboxedConsole(context) {
    const prefix = `[Plugin:${context.pluginId}]`;
    return {
      ...console,
      log: (...args) => this.logger.info(`${prefix} ${args.join(' ')}`),
      error: (...args) => this.logger.error(`${prefix} ${args.join(' ')}`),
      warn: (...args) => this.logger.warn(`${prefix} ${args.join(' ')}`),
      info: (...args) => this.logger.info(`${prefix} ${args.join(' ')}`),
      debug: (...args) => this.logger.debug(`${prefix} ${args.join(' ')}`),
    };
  }
  async runInVM2(code, context) {
    try {
      const { VM } = await import('vm2');
      const vm = new VM({
        timeout: context.timeout || 5e3,
        sandbox: {
          console: this.createSandboxedConsole(context),
          require: this.createSandboxedRequire(context),
          Buffer,
          process: this.createSandboxedProcess(context),
        },
      });
      return vm.run(code);
    } catch (error) {
      if (error.message.includes('vm2')) {
        return this.runInNodeVM(code, context);
      }
      throw error;
    }
  }
  async runInNodeVM(code, context) {
    const { runInNewContext } = await import('vm');
    const sandbox = {
      console: this.createSandboxedConsole(context),
      require: this.createSandboxedRequire(context),
      Buffer,
      process: this.createSandboxedProcess(context),
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Date,
      Math,
      JSON,
      Object,
      Array,
      String,
      Number,
      Boolean,
      Promise,
      Error,
      Map,
      Set,
      WeakMap,
      WeakSet,
      RegExp,
      DateConstructor: Date,
    };
    return runInNewContext(code, sandbox, {
      timeout: context.timeout || 5e3,
      displayErrors: true,
    });
  }
  createSandboxedProcess(context) {
    return {
      // Limited process info
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      // No access to env, exit, etc.
    };
  }
  isModuleAllowed(moduleName, context) {
    if (context.allowedModules?.includes(moduleName)) {
      return true;
    }
    if (this.allowedBuiltins.has(moduleName)) {
      return true;
    }
    if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
      return true;
    }
    if (moduleName === 'fs' && context.permissions?.includes('filesystem:read')) {
      return true;
    }
    if (
      (moduleName === 'http' || moduleName === 'https') &&
      context.permissions?.includes('network')
    ) {
      return true;
    }
    return false;
  }
  sanitizeError(error) {
    const sanitized = error.message;
    return sanitized;
  }
};
PluginSandbox = __decorateClass(
  [
    singleton(),
    __decorateParam(0, inject(DI_TOKENS.Logger)),
    __decorateParam(1, inject(DI_TOKENS.ConfigService)),
  ],
  PluginSandbox
);
export { PluginSandbox };
