import fs from 'fs/promises';
import path from 'path';
import { spawn, exec as execCallback } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { scanContent } from '../quality/scanner.js';
import { printWarning } from '../utils/output.js';
import { AppError, SecurityError } from '../utils/errors.js';

const execAsync = promisify(execCallback);

export const SANDBOX_CONFIG = {
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

export async function checkDocker() {
  try {
    await execAsync('docker --version');
    return true;
  } catch {
    return false;
  }
}

export async function ensureImage(image, spinner) {
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

export function detectLanguage(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  const langMap = {
    '.js': 'javascript', '.mjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python', '.rs': 'rust',
    '.go': 'go', '.rb': 'ruby',
  };
  return langMap[ext] || 'javascript';
}

export function getExecCommand(language, filename) {
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

export async function spawnProcess(cmd, args, timeout) {
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
