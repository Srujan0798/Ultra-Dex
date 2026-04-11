// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex exec command
 * Docker-based code execution sandbox for running generated code safely
 */

import chalk from 'chalk';
import ora from '../utils/ora.js';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import {
  checkDocker,
  ensureImage,
  executeInSandbox,
  detectLanguage,
  getExecCommand,
  SANDBOX_CONFIG,
} from '../sandbox/docker.js';
import { assertSafeCommand, assertSafePath } from '../sandbox/permissions.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';
// ============================================================================
// LOCAL EXECUTION (UNSAFE)
// ============================================================================

/**
 * Execute a command locally (unsafe mode)
 * @param {string} command - Command to execute
 * @param {number} timeout - Timeout in milliseconds
 * @param {Object} options - Spawn options
 * @returns {Promise<Object>} Execution result (stdout, stderr, exitCode, duration)
 */
async function spawnLocal(command, timeout, options = {}) {
  return new Promise((resolve, reject) => {
    const result = { stdout: '', stderr: '', exitCode: null, timedOut: false, duration: 0 };
    const startTime = Date.now();
    const proc = spawn(command, {
      shell: true,
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
    });

    const timeoutId = setTimeout(() => {
      result.timedOut = true;
      proc.kill('SIGKILL');
    }, timeout);

    proc.stdout.on('data', (data) => (result.stdout += data.toString()));
    proc.stderr.on('data', (data) => (result.stderr += data.toString()));

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      result.exitCode = code;
      result.duration = Date.now() - startTime;
      resolve(result);
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new AppError(`Failed to execute command: ${command}`, { cause: err }));
    });
  });
}

// ============================================================================
// CLI COMMAND
// ============================================================================

/**
 * Register the exec command with Commander
 * @param {Command} program - Commander program instance
 * @returns {void}
 */
export function registerExecCommand(program) {
  program
    .command('exec [file]')
    .description('Execute code in isolated Docker sandbox')
    .option('-c, --code <code>', 'Execute inline code')
    .option('-l, --language <lang>', 'Language (js, ts, py, go, rs, rb)')
    .option('--runtime <runtime>', 'Runtime (node|python|go|rust|custom)')
    .option('--image <image>', 'Docker image override')
    .option('--dockerfile <path>', 'Custom Dockerfile to build image')
    .option('-t, --timeout <ms>', 'Timeout in milliseconds', '30000')
    .option('--sandbox', 'Run in Docker sandbox (default)')
    .option('--allow-network', 'Allow network access in sandbox')
    .option('--command <cmd>', 'Run shell command instead of file')
    .option('--test', 'Run npm test in sandbox')
    .option('--unsafe', 'Run directly on host (no sandbox)')
    .option('--safe', 'Block execution if safety checks fail')
    .action(async (file, options) => {
      try {
        if (options.unsafe) {
          printWarning('\n⚠️  Unsafe execution enabled (no sandbox).');
        } else {
          printInfo('\n🐳 Ultra-Dex Code Sandbox\n');
        }

        if (!options.unsafe) {
          const hasDocker = await checkDocker();
          if (!hasDocker) {
            throw new AppError('Docker not found.', {
              suggestions: [
                'Install Docker: https://docs.docker.com/get-docker/',
                'Ensure Docker Desktop is running',
                'Run with --unsafe (not recommended for untrusted code)',
              ],
            });
          }
        }

        const timeout = parseInt(options.timeout, 10);
        let result;

        if (options.test) {
          result = options.unsafe
            ? await handleUnsafeTestExecution(timeout)
            : await handleTestExecution(timeout);
        } else if (options.command) {
          result = options.unsafe
            ? await handleUnsafeCommandExecution(options.command, timeout)
            : await handleCommandExecution(options.command, timeout, options.allowNetwork);
        } else if (options.code) {
          result = options.unsafe
            ? await handleUnsafeCodeExecution(options.code, options.language, timeout)
            : await handleCodeExecution(options.code, options.language, timeout, options);
        } else if (file) {
          result = options.unsafe
            ? await handleUnsafeFileExecution(file, options.language, timeout)
            : await handleFileExecution(file, options.language, timeout, options);
        } else {
          throw new ValidationError('No execution target specified.', [
            'Provide a file: ultra-dex exec script.js',
            'Provide inline code: ultra-dex exec -c "logger.log(1)"',
            'Run tests: ultra-dex exec --test',
          ]);
        }

        displayExecutionResult(result, timeout, options.allowNetwork);
      } catch (error) {
        await handleError(error, { command: 'exec', file, options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}

/**
 * Handle npm test execution
 * @param {number} timeout - Execution timeout
 * @returns {Promise<Object>} Execution result
 */
async function handleTestExecution(timeout) {
  const spinner = ora('Running npm test in sandbox...').start();
  const result = await executeInSandbox('npm test', {
    timeout,
    allowNetwork: true,
    isCommand: true,
    mountProject: true,
  });
  if (result.exitCode === 0) spinner.succeed(chalk.green('Tests passed!'));
  else spinner.fail(chalk.red('Tests failed'));
  return result;
}

/**
 * Handle arbitrary command execution
 * @param {string} command - Command to run
 * @param {number} timeout - Execution timeout
 * @param {boolean} allowNetwork - Allow network access
 * @returns {Promise<Object>} Execution result
 */
async function handleCommandExecution(command, timeout, allowNetwork) {
  const spinner = ora(`Executing: ${command}`).start();
  const result = await executeInSandbox(command, {
    timeout,
    allowNetwork,
    isCommand: true,
    mountProject: true,
  });
  if (result.exitCode === 0) spinner.succeed();
  else spinner.fail();
  return result;
}

/**
 * Resolve Docker image for execution
 * @param {string} language - Target language
 * @param {Object} options - Command options
 * @returns {Promise<string>} Docker image tag
 */
async function resolveImage(language, options) {
  if (options.image) return options.image;
  if (options.dockerfile) {
    const tag = `ultra-dex-custom:${Date.now()}`;
    await execSyncSafe(`docker build -f ${options.dockerfile} -t ${tag} .`);
    return tag;
  }
  return SANDBOX_CONFIG.images[language] || SANDBOX_CONFIG.defaultImage;
}

/**
 * Execute command synchronously and safely
 * @param {string} cmd - Command to run
 * @throws {AppError} If execution fails
 */
async function execSyncSafe(cmd) {
  try {
    const { execSync } = await import('child_process');
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    throw new AppError(`Failed to build Docker image: ${error.message}`);
  }
}

/**
 * Handle inline code execution
 * @param {string} code - Code to execute
 * @param {string} lang - Language identifier
 * @param {number} timeout - Timeout in ms
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
async function handleCodeExecution(code, lang, timeout, options) {
  const language = lang || 'javascript';
  const image = await resolveImage(language, options);
  const spinner = ora('Preparing sandbox...').start();
  await ensureImage(image, spinner);
  spinner.text = 'Executing code...';
  const result = await executeInSandbox(code, {
    language,
    runtime: options.runtime,
    timeout,
    allowNetwork: options.allowNetwork,
    safeMode: options.safe,
    image,
  });
  return result;
}

/**
 * Handle file execution
 * @param {string} file - File path
 * @param {string} lang - Language identifier
 * @param {number} timeout - Timeout in ms
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
async function handleFileExecution(file, lang, timeout, options) {
  const language = lang || detectLanguage(file);
  const image = await resolveImage(language, options);
  const spinner = ora('Preparing sandbox...').start();
  await ensureImage(image, spinner);
  spinner.text = `Executing ${file}...`;
  const code = await fs.readFile(file, 'utf8');
  const result = await executeInSandbox(code, {
    filename: path.basename(file),
    language,
    runtime: options.runtime,
    timeout,
    allowNetwork: options.allowNetwork,
    safeMode: options.safe,
    image,
  });
  return result;
}

/**
 * Handle unsafe test execution (local)
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Object>} Execution result
 */
async function handleUnsafeTestExecution(timeout) {
  const spinner = ora('Running npm test (unsafe mode)...').start();
  assertSafeCommand('npm test');
  const result = await spawnLocal('npm test', timeout);
  if (result.exitCode === 0) spinner.succeed(chalk.green('Tests passed!'));
  else spinner.fail(chalk.red('Tests failed'));
  return result;
}

/**
 * Handle unsafe command execution (local)
 * @param {string} command - Command to run
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Object>} Execution result
 */
async function handleUnsafeCommandExecution(command, timeout) {
  const spinner = ora(`Executing (unsafe): ${command}`).start();
  assertSafeCommand(command);
  const result = await spawnLocal(command, timeout);
  if (result.exitCode === 0) spinner.succeed();
  else spinner.fail();
  return result;
}

/**
 * Handle unsafe code execution (local)
 * @param {string} code - Code to execute
 * @param {string} lang - Language
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Object>} Execution result
 */
async function handleUnsafeCodeExecution(code, lang, timeout) {
  const language = lang || 'javascript';
  const tempDir = path.join(process.cwd(), '.ultra-dex', 'unsafe-exec');
  const extMap = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    rust: 'rs',
    go: 'go',
    ruby: 'rb',
  };
  const ext = extMap[language] || 'txt';
  const filename = `unsafe-${Date.now()}.${ext}`;
  const tempFile = path.join(tempDir, filename);
  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(tempFile, code, 'utf8');

  const execCmd = getExecCommand(language, filename);
  assertSafeCommand(execCmd);

  const spinner = ora('Executing code (unsafe)...').start();
  const result = await spawnLocal(execCmd, timeout, { cwd: tempDir });
  if (result.exitCode === 0) spinner.succeed();
  else spinner.fail();
  return result;
}

/**
 * Handle unsafe file execution (local)
 * @param {string} file - File path
 * @param {string} lang - Language
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Object>} Execution result
 */
async function handleUnsafeFileExecution(file, lang, timeout) {
  const resolved = assertSafePath(file, process.cwd());
  const language = lang || detectLanguage(resolved);
  const execCmd = getExecCommand(language, path.basename(resolved));
  assertSafeCommand(execCmd);

  const spinner = ora(`Executing ${file} (unsafe)...`).start();
  const result = await spawnLocal(execCmd, timeout, { cwd: path.dirname(resolved) });
  if (result.exitCode === 0) spinner.succeed();
  else spinner.fail();
  return result;
}

/**
 * Display execution result in a formatted box
 * @param {Object} result - Execution result object
 * @param {number} timeout - Timeout setting
 * @param {boolean} allowNetwork - Network setting
 */
function displayExecutionResult(result, timeout, allowNetwork) {
  if (result.timedOut) {
    printError(`\n❌ Execution timed out after ${timeout}ms`);
  } else if (result.exitCode === 0) {
    printSuccess(`\n✅ Completed in ${result.duration}ms`);
  } else {
    printWarning(`\n⚠️  Exited with code ${result.exitCode}`);
  }

  process.stdout.write(chalk.gray('┌' + '─'.repeat(50) + '┐\n'));
  if (result.stdout) {
    result.stdout
      .trim()
      .split('\n')
      .forEach((line) => process.stdout.write(`│ ${line.padEnd(48)} │\n`));
  }
  if (result.stderr) {
    process.stdout.write('│' + '─'.repeat(50) + '│\n');
    process.stdout.write(`│ ${chalk.red('STDERR:'.padEnd(48))} │\n`);
    result.stderr
      .trim()
      .split('\n')
      .forEach((line) => process.stdout.write(`│ ${chalk.red(line.padEnd(48))} │\n`));
  }
  process.stdout.write(chalk.gray('└' + '─'.repeat(50) + '┘\n'));
  printInfo(
    chalk.gray(
      `⏱️  Duration: ${result.duration}ms | 🔒 Network: ${allowNetwork ? 'Enabled' : 'Disabled'}`
    )
  );
}
