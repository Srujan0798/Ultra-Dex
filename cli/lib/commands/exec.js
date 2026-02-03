/**
 * ultra-dex exec command
 * Docker-based code execution sandbox for running generated code safely
 * This is what makes Ultra-Dex truly autonomous - it can VERIFY code works
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { spawn, exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { scanContent } from '../quality/scanner.js';

const execAsync = promisify(execCallback);

// ============================================================================
// SANDBOX CONFIGURATION
// ============================================================================

const SANDBOX_CONFIG = {
  // Docker image for sandboxed execution
  defaultImage: 'node:20-alpine',

  // Language-specific images
  images: {
    javascript: 'node:20-alpine',
    typescript: 'node:20-alpine',
    python: 'python:3.12-alpine',
    rust: 'rust:1.75-alpine',
    go: 'golang:1.22-alpine',
    ruby: 'ruby:3.3-alpine',
  },

  // Resource limits
  limits: {
    memory: '512m',
    cpus: '1.0',
    timeout: 60000, // 60 seconds
    networkDisabled: true,
  },

  // Workspace settings
  workspace: {
    containerPath: '/workspace',
    tempDir: '.ultra-dex/sandbox',
  }
};

// ============================================================================
// DOCKER UTILITIES
// ============================================================================

/**
 * Check if Docker is available
 */
async function checkDocker() {
  try {
    await execAsync('docker --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Pull Docker image if not available
 */
async function ensureImage(image, spinner) {
  try {
    await execAsync(`docker image inspect ${image} > /dev/null 2>&1`);
    return true;
  } catch {
    spinner.text = `Pulling Docker image: ${image}...`;
    try {
      await execAsync(`docker pull ${image}`);
      return true;
    } catch (err) {
      return false;
    }
  }
}

/**
 * Detect language from file extension
 */
function detectLanguage(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  const langMap = {
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.rb': 'ruby',
  };
  return langMap[ext] || 'javascript';
}

/**
 * Get execution command for language
 */
function getExecCommand(language, filename) {
  const commands = {
    javascript: `node ${filename}`,
    typescript: `npx tsx ${filename}`,
    python: `python ${filename}`,
    rust: `rustc ${filename} -o /tmp/out && /tmp/out`,
    go: `go run ${filename}`,
    ruby: `ruby ${filename}`,
  };
  return commands[language] || `node ${filename}`;
}

// ============================================================================
// SANDBOX EXECUTOR
// ============================================================================

/**
 * Execute code in Docker sandbox
 */
export async function executeInSandbox(code, options = {}) {
  const {
    language = 'javascript',
    filename = 'main.js',
    timeout = SANDBOX_CONFIG.limits.timeout,
    allowNetwork = false,
    env = {},
    workdir = process.cwd(),
    safeMode = false
  } = options;

  // Pre-flight Safety Check
  const issues = scanContent(code);
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  
  if (issues.length > 0) {
      console.log(chalk.yellow('\n⚠️  Safety Check Warnings:'));
      issues.forEach(i => console.log(`  ${chalk.red(i.ruleName)}: ${i.message}`));
      
      if (safeMode && criticalIssues.length > 0) {
          throw new Error(`Execution blocked by Safe Mode due to critical issues.`);
      }
  }

  const image = SANDBOX_CONFIG.images[language] || SANDBOX_CONFIG.defaultImage;
  const tempDir = path.join(workdir, SANDBOX_CONFIG.workspace.tempDir);
  const tempFile = path.join(tempDir, filename);

  // Ensure temp directory exists
  await fs.mkdir(tempDir, { recursive: true });

  // Write code to temp file
  await fs.writeFile(tempFile, code, 'utf8');

  // Build Docker command
  const dockerArgs = [
    'run',
    '--rm',
    '-i',
    `--memory=${SANDBOX_CONFIG.limits.memory}`,
    `--cpus=${SANDBOX_CONFIG.limits.cpus}`,
    allowNetwork ? '' : '--network=none',
    `-v`, `${tempDir}:${SANDBOX_CONFIG.workspace.containerPath}:ro`,
    `-w`, SANDBOX_CONFIG.workspace.containerPath,
  ];

  // Add environment variables
  for (const [key, value] of Object.entries(env)) {
    dockerArgs.push('-e', `${key}=${value}`);
  }

  dockerArgs.push(image);

  // Add execution command
  const execCmd = getExecCommand(language, filename);
  dockerArgs.push('sh', '-c', execCmd);

  // Filter empty strings
  const filteredArgs = dockerArgs.filter(Boolean);

  return new Promise((resolve, reject) => {
    const result = {
      stdout: '',
      stderr: '',
      exitCode: null,
      timedOut: false,
      duration: 0,
    };

    const startTime = Date.now();
    const proc = spawn('docker', filteredArgs);

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

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      result.exitCode = code;
      result.duration = Date.now() - startTime;
      resolve(result);
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

/**
 * Execute a file in sandbox
 */
export async function executeFile(filepath, options = {}) {
  const code = await fs.readFile(filepath, 'utf8');
  const language = detectLanguage(filepath);
  const filename = path.basename(filepath);

  return executeInSandbox(code, {
    ...options,
    language,
    filename,
  });
}

/**
 * Execute npm/shell command in sandbox
 */
export async function executeCommand(command, options = {}) {
  const {
    timeout = SANDBOX_CONFIG.limits.timeout,
    workdir = process.cwd(),
    allowNetwork = true, // Commands often need network
  } = options;

  const tempDir = path.join(workdir, SANDBOX_CONFIG.workspace.tempDir);
  await fs.mkdir(tempDir, { recursive: true });

  const dockerArgs = [
    'run',
    '--rm',
    '-i',
    `--memory=${SANDBOX_CONFIG.limits.memory}`,
    `--cpus=${SANDBOX_CONFIG.limits.cpus}`,
    allowNetwork ? '' : '--network=none',
    `-v`, `${workdir}:${SANDBOX_CONFIG.workspace.containerPath}`,
    `-w`, SANDBOX_CONFIG.workspace.containerPath,
    SANDBOX_CONFIG.defaultImage,
    'sh', '-c', command,
  ].filter(Boolean);

  return new Promise((resolve, reject) => {
    const result = {
      stdout: '',
      stderr: '',
      exitCode: null,
      timedOut: false,
      duration: 0,
    };

    const startTime = Date.now();
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

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      result.exitCode = code;
      result.duration = Date.now() - startTime;
      resolve(result);
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

// ============================================================================
// TEST RUNNER
// ============================================================================

/**
 * Run tests in sandbox
 */
export async function runTests(testCommand = 'npm test', options = {}) {
  const spinner = ora('Running tests in sandbox...').start();

  try {
    const result = await executeCommand(testCommand, {
      ...options,
      allowNetwork: true, // Tests may need to install deps
    });

    if (result.exitCode === 0) {
      spinner.succeed(chalk.green('Tests passed!'));
    } else {
      spinner.fail(chalk.red('Tests failed'));
    }

    return result;
  } catch (err) {
    spinner.fail(chalk.red(`Test execution failed: ${err.message}`));
    throw err;
  }
}

// ============================================================================
// CLI COMMAND
// ============================================================================

export function registerExecCommand(program) {
  program
    .command('exec [file]')
    .description('Execute code in isolated Docker sandbox')
    .option('-c, --code <code>', 'Execute inline code')
    .option('-l, --language <lang>', 'Language (js, ts, py, go, rs, rb)')
    .option('-t, --timeout <ms>', 'Timeout in milliseconds', '60000')
    .option('--allow-network', 'Allow network access in sandbox')
    .option('--command <cmd>', 'Run shell command instead of file')
    .option('--test', 'Run npm test in sandbox')
    .option('--safe', 'Block execution if safety checks fail')
    .action(async (file, options) => {
      console.log(chalk.cyan('\n🐳 Ultra-Dex Code Sandbox\n'));

      // Check Docker availability
      const spinner = ora('Checking Docker...').start();
      const hasDocker = await checkDocker();

      if (!hasDocker) {
        spinner.fail(chalk.red('Docker not found. Please install Docker to use the sandbox.'));
        console.log(chalk.yellow('\nInstall Docker: https://docs.docker.com/get-docker/'));
        return;
      }
      spinner.succeed('Docker available');

      const timeout = parseInt(options.timeout, 10);

      try {
        let result;

        if (options.test) {
          // Run tests
          result = await runTests('npm test', { timeout, allowNetwork: true });
        } else if (options.command) {
          // Run shell command
          spinner.start(`Executing: ${options.command}`);
          result = await executeCommand(options.command, {
            timeout,
            allowNetwork: options.allowNetwork,
          });
        } else if (options.code) {
          // Execute inline code
          const language = options.language || 'javascript';
          const image = SANDBOX_CONFIG.images[language];

          spinner.start('Preparing sandbox...');
          await ensureImage(image, spinner);

          spinner.text = 'Executing code...';
          result = await executeInSandbox(options.code, {
            language,
            timeout,
            allowNetwork: options.allowNetwork,
            safeMode: options.safe
          });
        } else if (file) {
          // Execute file
          const language = options.language || detectLanguage(file);
          const image = SANDBOX_CONFIG.images[language];

          spinner.start('Preparing sandbox...');
          await ensureImage(image, spinner);

          spinner.text = `Executing ${file}...`;
          result = await executeFile(file, {
            timeout,
            allowNetwork: options.allowNetwork,
            safeMode: options.safe
          });
        } else {
          spinner.fail('No code, file, or command specified');
          console.log(chalk.yellow('\nUsage:'));
          console.log('  ultra-dex exec script.js');
          console.log('  ultra-dex exec -c "console.log(1+1)"');
          console.log('  ultra-dex exec --command "npm test"');
          console.log('  ultra-dex exec --test');
          return;
        }

        // Show results
        if (result.timedOut) {
          spinner.fail(chalk.red(`Execution timed out after ${timeout}ms`));
        } else if (result.exitCode === 0) {
          spinner.succeed(chalk.green(`Completed in ${result.duration}ms`));
        } else {
          spinner.warn(chalk.yellow(`Exited with code ${result.exitCode}`));
        }

        // Print output
        console.log(chalk.gray('┌' + '─'.repeat(50) + '┐'));
        
        if (result.stdout) {
          // console.log(chalk.bold('\n📤 Output:'));
          const lines = result.stdout.trim().split('\n');
          lines.forEach(line => console.log(`│ ${line.padEnd(48)} │`));
        }

        if (result.stderr) {
          console.log('│' + '─'.repeat(50) + '│');
          console.log(`│ ${chalk.red('STDERR:'.padEnd(48))} │`);
          const lines = result.stderr.trim().split('\n');
          lines.forEach(line => console.log(`│ ${chalk.red(line.padEnd(48))} │`));
        }
        
        console.log(chalk.gray('└' + '─'.repeat(50) + '┘'));

        // Summary
        console.log(chalk.gray(`\n⏱️  Duration: ${result.duration}ms`));
        console.log(chalk.gray(`🔒 Network: ${options.allowNetwork ? 'Enabled' : 'Disabled'}`));

      } catch (err) {
        spinner.fail(chalk.red(`Execution failed: ${err.message}`));
      }
    });
}

export default {
  registerExecCommand,
  executeInSandbox,
  executeFile,
  executeCommand,
  runTests,
  checkDocker,
};