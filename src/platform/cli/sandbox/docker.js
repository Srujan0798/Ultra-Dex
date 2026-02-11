// Copyright (c) 2026 Ultra-Dex

/**
 * Multi-Runtime Docker Sandbox
 * Provides secure execution environment for multiple runtimes (Node.js, Python, Go, Rust)
 */

import fs from 'fs/promises';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

const execAsync = promisify(exec);

export const SANDBOX_CONFIG = {
  defaultImage: 'node:20-alpine',
  images: {
    javascript: 'node:20-alpine',
    typescript: 'node:20-alpine',
    python: 'python:3.12-alpine',
    go: 'golang:1.22-alpine',
    rust: 'rust:1.76-alpine',
    ruby: 'ruby:3.3-alpine',
  },
  memory: '512m',
  cpu: '1',
  workDir: '/workspace',
};

// Runtime configurations
const RUNTIME_CONFIGS = {
  node: {
    image: 'node:20-alpine',
    workDir: '/app',
    command: ['node'],
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    setupCommands: [
      'npm init -y',
      'npm install --save-dev typescript @types/node',
      'npx tsc --init --moduleResolution node --target es2022 --outDir dist --rootDir src',
    ],
  },
  python: {
    image: 'python:3.12-alpine',
    workDir: '/app',
    command: ['python'],
    extensions: ['.py'],
    setupCommands: ['pip install --upgrade pip', 'touch requirements.txt'],
  },
  go: {
    image: 'golang:1.22-alpine',
    workDir: '/app',
    command: ['go'],
    extensions: ['.go'],
    setupCommands: ['go mod init sandbox', 'go mod tidy'],
  },
  rust: {
    image: 'rust:1.76-alpine',
    workDir: '/app',
    command: ['cargo'],
    extensions: ['.rs'],
    setupCommands: ['cargo init .'],
  },
};

/**
 * Detect programming language from file extension
 * @param {string} [filePath=''] - Path to the file
 * @returns {string} Language identifier (javascript, typescript, python, go, rust, ruby)
 */
export function detectLanguage(filePath = '') {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.py':
      return 'python';
    case '.go':
      return 'go';
    case '.rs':
      return 'rust';
    case '.rb':
      return 'ruby';
    default:
      return 'javascript';
  }
}

/**
 * Detect runtime from file extension (alias for detectLanguage)
 * @param {string} [filePath=''] - Path to the file
 * @returns {string} Runtime identifier
 */
export function detectRuntimeFromExtension(filePath = '') {
  return detectLanguage(filePath);
}

/**
 * Get the shell command to execute a file in the given language
 * @param {string} language - Language identifier
 * @param {string} filename - File to execute
 * @returns {string} Shell command
 */
export function getExecCommand(language, filename) {
  switch (language) {
    case 'python':
      return `python ${filename}`;
    case 'go':
      return `go run ${filename}`;
    case 'rust':
      return `rustc ${filename} -o app && ./app`;
    case 'ruby':
      return `ruby ${filename}`;
    case 'typescript':
      return `node ${filename}`;
    case 'javascript':
    default:
      return `node ${filename}`;
  }
}

/**
 * Check if Docker is available on the system
 * @returns {Promise<boolean>} True if Docker is installed
 */
export async function checkDocker() {
  try {
    await execAsync('docker --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a Docker image is available locally, pulling if necessary
 * @param {string} image - Docker image tag
 * @param {Object} [spinner] - Ora spinner instance for progress
 */
export async function ensureImage(image, spinner) {
  try {
    await execAsync(`docker image inspect ${image}`);
  } catch {
    if (spinner) spinner.text = `Pulling Docker image ${image}...`;
    await execAsync(`docker pull ${image}`);
  }
}

/**
 * Execute code or a command inside a Docker sandbox container
 * @param {string} input - Code string or shell command
 * @param {Object} [options={}] - Execution options
 * @param {number} [options.timeout=30000] - Timeout in ms
 * @param {boolean} [options.allowNetwork=false] - Allow network access
 * @param {string} [options.language='javascript'] - Language/runtime
 * @param {string} [options.image] - Docker image override
 * @param {boolean} [options.isCommand=false] - If true, treat input as command
 * @param {boolean} [options.mountProject=false] - Mount project dir
 * @returns {Promise<Object>} Execution result with stdout, stderr, exitCode, duration
 */
export async function executeInSandbox(input, options = {}) {
  const start = Date.now();
  const timeout = options.timeout ?? 30000;
  const allowNetwork = options.allowNetwork ?? false;
  const language = options.language || options.runtime || 'javascript';
  const image = options.image || SANDBOX_CONFIG.images[language] || SANDBOX_CONFIG.defaultImage;
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const runDir = path.join(process.cwd(), '.ultra-dex', 'sandbox', runId);
  await fs.mkdir(runDir, { recursive: true });

  let command;
  let filename;
  if (options.isCommand) {
    command = input;
  } else {
    const extMap = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      go: 'go',
      rust: 'rs',
      ruby: 'rb',
    };
    const ext = extMap[language] || 'txt';
    filename = options.filename || `code.${ext}`;
    await fs.writeFile(path.join(runDir, filename), input, 'utf8');
    command = getExecCommand(language, filename);
  }

  const mountDir = options.mountProject ? process.cwd() : runDir;
  const dockerArgs = [
    'run',
    '--rm',
    '--network',
    allowNetwork ? 'bridge' : 'none',
    '--memory',
    options.memory || SANDBOX_CONFIG.memory,
    '--cpus',
    options.cpus || SANDBOX_CONFIG.cpu,
    '-v',
    `${mountDir}:${SANDBOX_CONFIG.workDir}`,
    '-w',
    SANDBOX_CONFIG.workDir,
    image,
    'sh',
    '-c',
    command,
  ];

  const result = { stdout: '', stderr: '', exitCode: null, timedOut: false, duration: 0 };
  const proc = spawn('docker', dockerArgs);

  const timeoutId = setTimeout(() => {
    result.timedOut = true;
    proc.kill('SIGKILL');
  }, timeout);

  proc.stdout.on('data', (data) => {
    result.stdout += data.toString();
  });

  proc.stderr.on('data', (data) => {
    result.stderr += data.toString();
  });

  return await new Promise((resolve) => {
    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      result.exitCode = code;
      result.duration = Date.now() - start;
      resolve(result);
    });
  });
}

/**
 * Docker Sandbox Class
 * Provides a high-level API for secure code execution in Docker containers
 */
export class DockerSandbox {
  /**
   * Create a new DockerSandbox instance
   * @param {Object} [options={}] - Sandbox configuration
   * @param {boolean} [options.enabled=true] - Enable sandbox
   * @param {number} [options.timeout=30000] - Execution timeout in ms
   * @param {string} [options.memoryLimit='512m'] - Container memory limit
   * @param {string} [options.networkMode='none'] - Docker network mode
   * @param {string} [options.workDir] - Working directory for sandbox files
   */
  constructor(options = {}) {
    this.enabled = options.enabled ?? true;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.memoryLimit = options.memoryLimit || '512m';
    this.networkMode = options.networkMode || 'none'; // No network by default for security
    this.workDir = options.workDir || '/tmp/ultra-dex-sandbox';
    this.containerPrefix = 'ultra-dex-sandbox';
  }

  /**
   * Initialize the sandbox environment
   */
  async initialize() {
    if (!this.enabled) {
      printWarning(chalk.yellow('⚠️  Docker sandbox disabled'));
      return;
    }

    try {
      // Check if Docker is available
      await execAsync('docker --version');
      printSuccess(chalk.green('✅ Docker is available'));

      // Create working directory
      await fs.mkdir(this.workDir, { recursive: true });

      // Pull required images
      for (const [runtime, config] of Object.entries(RUNTIME_CONFIGS)) {
        printInfo(chalk.blue(`🐳 Pulling ${runtime} image: ${config.image}`));
        try {
          await execAsync(`docker pull ${config.image}`);
        } catch (pullError) {
          printWarning(chalk.yellow(`⚠️  Could not pull ${config.image}: ${pullError.message}`));
        }
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new AppError('Docker is not installed or not in PATH', {
          code: 'DOCKER_NOT_AVAILABLE',
        });
      }
      throw error;
    }
  }

  /**
   * Detect runtime from file extension
   */
  detectRuntime(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    for (const [runtime, config] of Object.entries(RUNTIME_CONFIGS)) {
      if (config.extensions.includes(ext)) {
        return runtime;
      }
    }

    // Default to node if no match found
    return 'node';
  }

  /**
   * Create a Dockerfile for the specified runtime
   */
  async createDockerfile(runtime, customDockerfile) {
    if (customDockerfile) {
      // Use custom Dockerfile if provided
      const customPath = path.resolve(customDockerfile);
      await fs.access(customPath);
      return customPath;
    }

    const config = RUNTIME_CONFIGS[runtime];
    if (!config) {
      throw new AppError(`Unsupported runtime: ${runtime}`, { code: 'UNSUPPORTED_RUNTIME' });
    }

    const dockerfileContent = `
FROM ${config.image}

# Set working directory
WORKDIR ${config.workDir}

# Copy files
COPY . .

# Set non-root user for security
RUN addgroup -g 1001 -S sandbox && \\
    adduser -u 1001 -S sandbox -G sandbox

# Change ownership to non-root user
RUN chown -R sandbox:sandbox ${config.workDir}

# Switch to non-root user
USER sandbox

# Default command
CMD ["sh"]
`;

    const dockerfilePath = path.join(this.workDir, `Dockerfile.${runtime}`);
    await fs.writeFile(dockerfilePath, dockerfileContent.trim());

    return dockerfilePath;
  }

  /**
   * Execute code in sandbox
   */
  async execute(code, options = {}) {
    if (!this.enabled) {
      throw new AppError('Sandbox is disabled', { code: 'SANDBOX_DISABLED' });
    }

    const runtime = options.runtime || this.detectRuntime(options.filePath || '');
    const config = RUNTIME_CONFIGS[runtime];

    if (!config) {
      throw new AppError(`Unsupported runtime: ${runtime}`, { code: 'UNSUPPORTED_RUNTIME' });
    }

    // Create a temporary directory for this execution
    const execId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const execDir = path.join(this.workDir, execId);

    try {
      await fs.mkdir(execDir, { recursive: true });

      // Write code to file
      let fileName;
      if (options.filePath) {
        fileName = path.basename(options.filePath);
      } else {
        const extMap = {
          node: '.js',
          python: '.py',
          go: '.go',
          rust: '.rs',
        };
        fileName = `code${extMap[runtime] || '.js'}`;
      }

      const codePath = path.join(execDir, fileName);
      await fs.writeFile(codePath, code);

      // Create Dockerfile
      const dockerfilePath = await this.createDockerfile(runtime);

      // Build image
      const imageName = `${this.containerPrefix}-${runtime}-${execId}`;
      printInfo(chalk.blue(`🔨 Building sandbox image: ${imageName}`));

      const buildResult = await execAsync(
        `docker build -f "${dockerfilePath}" -t ${imageName} "${execDir}"`
      );

      // Run container
      printInfo(chalk.blue(`🏃 Running in ${runtime} sandbox...`));

      const containerName = `${this.containerPrefix}-${execId}`;
      const runCommand = [
        'docker',
        'run',
        '--rm',
        '--network',
        this.networkMode,
        '--memory',
        this.memoryLimit,
        '--name',
        containerName,
        '-v',
        `${execDir}:/app`,
        '-w',
        config.workDir,
        ...(options.privileged ? ['--privileged'] : []),
        ...(options.mounts || []).map((mount) => `--mount=${mount}`),
        imageName,
        ...config.command,
        fileName,
      ].join(' ');

      // Execute with timeout
      const execution = execAsync(runCommand);

      // Set up timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new AppError(`Execution timed out after ${this.timeout}ms`, {
              code: 'EXECUTION_TIMEOUT',
            })
          );
        }, this.timeout);
      });

      // Race the execution against the timeout
      const result = await Promise.race([execution, timeoutPromise]);

      printSuccess(chalk.green('✅ Execution completed successfully'));

      return {
        success: true,
        output: result.stdout,
        error: result.stderr,
        runtime,
        executionTime: Date.now() - parseInt(execId, 36),
        container: containerName,
      };
    } catch (error) {
      if (error.code === 'EXECUTION_TIMEOUT') {
        // Try to stop the container if it's still running
        try {
          await execAsync(`docker stop ${this.containerPrefix}-${execId}`);
        } catch (stopError) {
          // Ignore errors when stopping timed-out container
        }
        throw error;
      }

      printError(chalk.red(`❌ Execution failed: ${error.message}`));

      return {
        success: false,
        error: error.message,
        runtime,
        executionTime: Date.now() - parseInt(execId, 36),
      };
    } finally {
      // Clean up temporary directory
      try {
        await fs.rm(execDir, { recursive: true, force: true });
      } catch (cleanupError) {
        printWarning(
          chalk.yellow(`⚠️  Could not clean up sandbox directory: ${cleanupError.message}`)
        );
      }
    }
  }

  /**
   * Execute a file in the sandbox
   */
  async executeFile(filePath, options = {}) {
    if (!this.enabled) {
      throw new AppError('Sandbox is disabled', { code: 'SANDBOX_DISABLED' });
    }

    const runtime = options.runtime || this.detectRuntime(filePath);
    const code = await fs.readFile(filePath, 'utf8');

    return this.execute(code, { ...options, filePath, runtime });
  }

  /**
   * Check if Docker is available
   */
  async isDockerAvailable() {
    try {
      await execAsync('docker --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get sandbox status
   */
  getSandboxStatus() {
    return {
      enabled: this.enabled,
      dockerAvailable: this.isDockerAvailable(),
      timeout: this.timeout,
      memoryLimit: this.memoryLimit,
      networkMode: this.networkMode,
      workDir: this.workDir,
      supportedRuntimes: Object.keys(RUNTIME_CONFIGS),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clean up old containers
   */
  async cleanup() {
    try {
      // Remove containers with our prefix
      const { stdout } = await execAsync(
        `docker ps -a --format "{{.Names}}" | grep ${this.containerPrefix}`
      );
      const containers = stdout
        .trim()
        .split('\n')
        .filter((name) => name);

      for (const container of containers) {
        try {
          await execAsync(`docker rm -f ${container}`);
          printInfo(chalk.gray(`🧹 Cleaned up container: ${container}`));
        } catch (removeError) {
          printWarning(
            chalk.yellow(`⚠️  Could not remove container ${container}: ${removeError.message}`)
          );
        }
      }

      printSuccess(chalk.green(`✅ Cleaned up ${containers.length} old containers`));
    } catch (error) {
      // No containers to clean up
      if (!error.stdout?.includes('no such file')) {
        printInfo(chalk.gray('No old containers to clean up'));
      }
    }
  }
}

/**
 * Create and initialize a Docker sandbox
 */
export async function createDockerSandbox(options = {}) {
  const sandbox = new DockerSandbox(options);
  await sandbox.initialize();
  return sandbox;
}

/**
 * Register the sandbox command with Commander
 */
export function registerSandboxCommand(program) {
  program
    .command('exec')
    .description('Execute code in secure Docker sandbox')
    .option('--runtime <runtime>', 'Runtime to use (node, python, go, rust)', 'node')
    .option('--file <path>', 'File to execute')
    .option('--code <code>', 'Code to execute directly')
    .option('--timeout <ms>', 'Execution timeout in milliseconds', '30000')
    .option('--memory <limit>', 'Memory limit (e.g., 512m, 1g)', '512m')
    .option('--network <mode>', 'Network mode (none, bridge, host)', 'none')
    .option('--custom-dockerfile <path>', 'Use custom Dockerfile')
    .option('--privileged', 'Run with privileged access (use with caution)')
    .option(
      '--mount <mount-spec>',
      'Additional volume mounts',
      (val, memo) => memo.concat([val]),
      []
    )
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n🔒 Ultra-Dex Secure Docker Sandbox\n'));

        if (!options.file && !options.code) {
          printError(chalk.red('❌ Either --file or --code must be specified'));
          process.exitCode = 1;
          return;
        }

        const sandboxOptions = {
          enabled: true,
          timeout: parseInt(options.timeout),
          memoryLimit: options.memory,
          networkMode: options.network,
          workDir: path.join(process.cwd(), '.ultra-dex', 'sandbox'),
        };

        const sandbox = await createDockerSandbox(sandboxOptions);

        let result;
        if (options.file) {
          result = await sandbox.executeFile(options.file, {
            runtime: options.runtime,
            customDockerfile: options.customDockerfile,
            privileged: options.privileged,
            mounts: options.mount,
          });
        } else {
          result = await sandbox.execute(options.code, {
            runtime: options.runtime,
            customDockerfile: options.customDockerfile,
            privileged: options.privileged,
            mounts: options.mount,
          });
        }

        if (result.success) {
          printSuccess(chalk.green('\n✅ Execution completed successfully\n'));
          if (result.output) {
            printInfo(chalk.blue('Output:'));
            console.log(result.output);
          }
        } else {
          printError(chalk.red('\n❌ Execution failed\n'));
          if (result.error) {
            printError(chalk.red(result.error));
          }
        }

        // Show execution stats
        printInfo(chalk.gray(`\n⏱️  Execution time: ${result.executionTime}ms`));
        printInfo(chalk.gray(`📦 Runtime: ${result.runtime}`));
        if (result.container) {
          printInfo(chalk.gray(`🐳 Container: ${result.container}`));
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Sandbox execution failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  DockerSandbox,
  createDockerSandbox,
  registerSandboxCommand,
  detectRuntimeFromExtension,
};
