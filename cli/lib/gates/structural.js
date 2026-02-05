import { glob } from 'glob';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'path';

const exec = promisify(execCb);

const DEFAULT_IGNORE = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/.ultra-dex/**', '**/.ultra/**'];

async function checkSyntax(projectDir) {
  const files = await glob('**/*.js', { cwd: projectDir, ignore: DEFAULT_IGNORE, nodir: true });
  const errors = [];

  for (const file of files.slice(0, 50)) {
    try {
      await exec(`node --check "${path.join(projectDir, file)}"`);
    } catch (error) {
      errors.push({ file, error: error.message });
    }
  }

  return {
    id: 'syntax',
    value: errors.length,
    details: { checked: files.length, errors }
  };
}

async function checkLint(projectDir, config) {
  if (!config?.command) {
    return { id: 'linting', value: 0, details: { warning: 'No lint command configured' } };
  }
  try {
    await exec(config.command, { cwd: projectDir });
    return { id: 'linting', value: 0, details: { command: config.command } };
  } catch (error) {
    return { id: 'linting', value: 1, details: { error: error.message } };
  }
}

async function checkTypeScript(projectDir, config) {
  if (!config?.command) {
    return { id: 'typecheck', value: 0, details: { warning: 'No typecheck command configured' } };
  }
  try {
    await exec(config.command, { cwd: projectDir });
    return { id: 'typecheck', value: 0, details: { command: config.command } };
  } catch (error) {
    return { id: 'typecheck', value: 1, details: { error: error.message } };
  }
}

export async function runStructuralGates(projectDir, config = {}) {
  const results = [];
  if (config.syntax?.enabled) {
    results.push(await checkSyntax(projectDir));
  }
  if (config.linting?.enabled || config.linting?.command) {
    results.push(await checkLint(projectDir, config.linting));
  }
  if (config.typecheck?.enabled || config.typecheck?.command) {
    results.push(await checkTypeScript(projectDir, config.typecheck));
  }
  return results;
}
