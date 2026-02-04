/**
 * ultra-dex exec command
 * Docker-based code execution sandbox for running generated code safely
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { spawn, exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { scanContent } from '../quality/scanner.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError, SecurityError } from '../utils/errors.js';

const execAsync = promisify(execCallback);

// ============================================================================
// SANDBOX CONFIGURATION
// ============================================================================

const SANDBOX_CONFIG = {
  defaultImage: 'node:20-alpine',
  images: {
    javascript: 'node:20-alpine',
    typescript: 'node:20-alpine',
    python: 'python:3.12-alpine',
    rust: 'rust:1.75-alpine',
    go: 'golang:1.22-alpine',
    ruby: 'ruby:3.3-alpine',
  },
  limits: {
    memory: '512m',
    cpus: '1.0',
    timeout: 60000,
    networkDisabled: true,
  },
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
    if (spinner) spinner.text = `Pulling Docker image: ${image}...`;
    try {
      await execAsync(`docker pull ${image}`);
      return true;
    } catch (err) {
      throw new AppError(`Failed to pull Docker image: ${image}`, { cause: err });
    }
  }
}

/**
 * Detect language from file extension
 */
function detectLanguage(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  const langMap = {
    '.js': 'javascript', '.mjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python', '.rs': 'rust',
    '.go': 'go', '.rb': 'ruby',
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
export async function executeInSandbox(input, options = {}) {
  const {
    language = 'javascript',
    filename = 'main.js',
    timeout = SANDBOX_CONFIG.limits.timeout,
    allowNetwork = false,
    env = {},
    workdir = process.cwd(),
    safeMode = false,
    isCommand = false,
    mountProject = false
  } = options;

  let execCmd;
  const tempDir = path.join(workdir, SANDBOX_CONFIG.workspace.tempDir);
  
  if (isCommand) {
    execCmd = input;
  } else {
    // Pre-flight Safety Check
    const issues = scanContent(input);
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    
    if (issues.length > 0) {
        printWarning(`\n⚠️  Safety Check Warnings for ${filename}:`);
        issues.forEach(i => process.stdout.write(`  ${chalk.red(i.ruleName)}: ${i.message}\n`));

        if (safeMode && criticalIssues.length > 0) {
            throw new SecurityError(`Execution blocked by Safe Mode due to critical issues in ${filename}`);
        }
    }

    const tempFile = path.join(tempDir, filename);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempFile, input, 'utf8');
    execCmd = getExecCommand(language, filename);
  }

  const image = SANDBOX_CONFIG.images[language] || SANDBOX_CONFIG.defaultImage;

  const dockerArgs = [
    'run', '--rm', '-i',
    `--memory=${SANDBOX_CONFIG.limits.memory}`,
    `--cpus=${SANDBOX_CONFIG.limits.cpus}`,
    allowNetwork ? '' : '--network=none',
    `-v`, mountProject ? `${workdir}:${SANDBOX_CONFIG.workspace.containerPath}:rw` : `${tempDir}:${SANDBOX_CONFIG.workspace.containerPath}:ro`,
    `-w`, SANDBOX_CONFIG.workspace.containerPath,
  ];

  for (const [key, value] of Object.entries(env)) {
    dockerArgs.push('-e', `${key}=${value}`);
  }

  dockerArgs.push(image);
  dockerArgs.push('sh', '-c', execCmd);

  return spawnProcess('docker', dockerArgs.filter(Boolean), timeout);
}

async function spawnProcess(cmd, args, timeout) {
    return new Promise((resolve, reject) => {
        const result = { stdout: '', stderr: '', exitCode: null, timedOut: false, duration: 0 };
        const startTime = Date.now();
        const proc = spawn(cmd, args);

        const timeoutId = setTimeout(() => {
          result.timedOut = true;
          proc.kill('SIGKILL');
        }, timeout);

        proc.stdout.on('data', (data) => result.stdout += data.toString());
        proc.stderr.on('data', (data) => result.stderr += data.toString());

        proc.on('close', (code) => {
          clearTimeout(timeoutId);
          result.exitCode = code;
          result.duration = Date.now() - startTime;
          resolve(result);
        });

        proc.on('error', (err) => {
          clearTimeout(timeoutId);
          reject(new AppError(`Failed to spawn process: ${cmd}`, { cause: err }));
        });
    });
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
      try {
        printInfo('\n🐳 Ultra-Dex Code Sandbox\n');

        const hasDocker = await checkDocker();
        if (!hasDocker) {
          throw new AppError('Docker not found.', {
              suggestions: [
                  'Install Docker: https://docs.docker.com/get-docker/',
                  'Ensure Docker Desktop is running',
                  'Run without sandbox (not recommended for untrusted code)'
              ]
          });
        }

        const timeout = parseInt(options.timeout, 10);
        let result;

        if (options.test) {
          result = await handleTestExecution(timeout);
        } else if (options.command) {
          result = await handleCommandExecution(options.command, timeout, options.allowNetwork);
        } else if (options.code) {
          result = await handleCodeExecution(options.code, options.language, timeout, options);
        } else if (file) {
          result = await handleFileExecution(file, options.language, timeout, options);
        } else {
          throw new ValidationError('No execution target specified.', [
              'Provide a file: ultra-dex exec script.js',
              'Provide inline code: ultra-dex exec -c "console.log(1)"',
              'Run tests: ultra-dex exec --test'
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

async function handleTestExecution(timeout) {
    const spinner = ora('Running npm test in sandbox...').start();
    const result = await executeInSandbox('npm test', { 
        timeout, 
        allowNetwork: true, 
        isCommand: true, 
        mountProject: true 
    });
    if (result.exitCode === 0) spinner.succeed(chalk.green('Tests passed!'));
    else spinner.fail(chalk.red('Tests failed'));
    return result;
}

async function handleCommandExecution(command, timeout, allowNetwork) {
    const spinner = ora(`Executing: ${command}`).start();
    const result = await executeInSandbox(command, { 
        timeout, 
        allowNetwork, 
        isCommand: true, 
        mountProject: true 
    });
    if (result.exitCode === 0) spinner.succeed();
    else spinner.fail();
    return result;
}

async function handleCodeExecution(code, lang, timeout, options) {
    const language = lang || 'javascript';
    const image = SANDBOX_CONFIG.images[language] || SANDBOX_CONFIG.defaultImage;
    const spinner = ora('Preparing sandbox...').start();
    await ensureImage(image, spinner);
    spinner.text = 'Executing code...';
    const result = await executeInSandbox(code, {
        language, timeout, allowNetwork: options.allowNetwork, safeMode: options.safe
    });
    return result;
}

async function handleFileExecution(file, lang, timeout, options) {
    const language = lang || detectLanguage(file);
    const image = SANDBOX_CONFIG.images[language] || SANDBOX_CONFIG.defaultImage;
    const spinner = ora('Preparing sandbox...').start();
    await ensureImage(image, spinner);
    spinner.text = `Executing ${file}...`;
    const code = await fs.readFile(file, 'utf8');
    const result = await executeInSandbox(code, {
        filename: path.basename(file),
        language, timeout, allowNetwork: options.allowNetwork, safeMode: options.safe
    });
    return result;
}

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
      result.stdout.trim().split('\n').forEach(line => process.stdout.write(`│ ${line.padEnd(48)} │\n`));
    }
    if (result.stderr) {
      process.stdout.write('│' + '─'.repeat(50) + '│\n');
      process.stdout.write(`│ ${chalk.red('STDERR:'.padEnd(48))} │\n`);
      result.stderr.trim().split('\n').forEach(line => process.stdout.write(`│ ${chalk.red(line.padEnd(48))} │\n`));
    }
    process.stdout.write(chalk.gray('└' + '─'.repeat(50) + '┘\n'));
    printInfo(chalk.gray(`⏱️  Duration: ${result.duration}ms | 🔒 Network: ${allowNetwork ? 'Enabled' : 'Disabled'}`));
}
