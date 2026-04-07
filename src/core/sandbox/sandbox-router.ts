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
import { VirtualFileSystem, NullFileSystem } from './virtual-fs.js';
const { DockerSandbox } = await import('../../../apps/cli/lib/sandbox/docker.js');
let SandboxRouter = class {
  constructor(vmSandbox, config, logger) {
    this.config = config;
    this.logger = logger;
    this.vmSandbox = vmSandbox;
  }
  dockerSandbox = null;
  vmSandbox;
  /**
   * Select the appropriate sandbox based on task requirements
   */
  selectSandbox(task) {
    if (
      task.language === 'javascript' &&
      !task.requiresFilesystem &&
      !task.requiresNetwork &&
      task.expectedDurationMs < 100
    ) {
      this.logger.debug('Selected IsolatedVM sandbox', {
        reason: 'Pure JS, no FS/network, fast execution',
      });
      return this.vmSandbox;
    }
    this.logger.debug('Selected Docker sandbox', {
      reason:
        task.language !== 'javascript'
          ? 'Non-JS language'
          : task.requiresFilesystem
            ? 'Requires filesystem'
            : task.requiresNetwork
              ? 'Requires network'
              : 'Long-running task',
    });
    return this.getDockerSandbox();
  }
  /**
   * Execute task in appropriate sandbox
   */
  async execute(task, context) {
    const sandbox = this.selectSandbox(task);
    const sandboxContext = this.buildContext(task, context);
    return sandbox.execute(task.code, sandboxContext);
  }
  /**
   * Get sandbox selection statistics
   */
  getSelectionStats(task) {
    const reasons = [];
    if (task.language !== 'javascript') {
      reasons.push(`Language: ${task.language} (requires Docker)`);
      return { selected: 'docker', reasons };
    }
    if (task.requiresFilesystem) {
      reasons.push('Requires filesystem access');
    }
    if (task.requiresNetwork) {
      reasons.push('Requires network access');
    }
    if (task.expectedDurationMs >= 100) {
      reasons.push(`Expected duration: ${task.expectedDurationMs}ms (>= 100ms)`);
    }
    const selected = reasons.length === 0 ? 'isolated-vm' : 'docker';
    return { selected, reasons };
  }
  /**
   * Dispose all sandboxes
   */
  async dispose() {
    await this.vmSandbox.dispose();
    if (this.dockerSandbox) {
      await this.dockerSandbox.cleanup?.();
    }
  }
  getDockerSandbox() {
    if (!this.dockerSandbox) {
      this.dockerSandbox = new DockerSandbox({
        enabled: true,
        timeout: 3e4,
        memoryLimit: '512m',
        networkMode: 'none',
      });
    }
    return this.dockerSandbox;
  }
  buildContext(task, context) {
    return {
      timeout: task.timeout || this.config.get('sandbox.timeout', 5e3),
      memoryLimit: task.memoryLimit || this.config.get('sandbox.memoryLimit', 128),
      allowedModules: task.allowedModules || [],
      logger: context.logger,
      filesystem: task.requiresFilesystem ? new VirtualFileSystem() : new NullFileSystem(),
      environment: task.environment || {},
    };
  }
};
SandboxRouter = __decorateClass(
  [
    singleton(),
    __decorateParam(0, inject(DI_TOKENS.IsolatedVMSandbox)),
    __decorateParam(1, inject(DI_TOKENS.ConfigService)),
    __decorateParam(2, inject(DI_TOKENS.Logger)),
  ],
  SandboxRouter
);
export { SandboxRouter };
