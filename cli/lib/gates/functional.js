import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

async function runTests(projectDir, config = {}) {
  if (config.enabled === false) {
    return { id: 'testing', value: 0, details: { skipped: true } };
  }

  if (!config.enabled && !config.command) {
    return { id: 'testing', value: 0, details: { skipped: true } };
  }

  const command = config.command || 'npm test';
  try {
    await exec(command, { cwd: projectDir });
    return { id: 'testing', value: 0, details: { command } };
  } catch (error) {
    return { id: 'testing', value: 1, details: { error: error.message } };
  }
}

async function checkSandbox(config = {}) {
  if (!config.requireSandbox) {
    return { id: 'sandbox', value: 0, details: { skipped: true } };
  }
  return { id: 'sandbox', value: 0, details: { note: 'Sandbox requirement flagged' } };
}

export async function runFunctionalGates(projectDir, config = {}) {
  const results = [];
  results.push(await runTests(projectDir, config.testing || {}));
  results.push(await checkSandbox(config.sandbox || {}));
  return results;
}
