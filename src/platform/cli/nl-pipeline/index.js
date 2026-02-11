// Copyright (c) 2026 Ultra-Dex

/**
 * Natural Language to Code Pipeline
 * Parses requests, generates plan, executes agents, runs tests, and prepares deploy.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { getProvider } from '../providers/index.js';
import { swarmCommand } from '../commands/swarm.js';

const execAsync = promisify(exec);

export function parseRequest(input = '') {
  const normalized = input.toLowerCase();
  const intent = normalized.includes('todo') ? 'todo-app' : 'general-app';
  const auth = normalized.includes('auth') || normalized.includes('login');
  return { intent, auth, raw: input };
}

export async function generatePlan(input, outputPath = 'IMPLEMENTATION-PLAN.md') {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No AI provider configured for plan generation');
  }

  const systemPrompt = 'You are a senior planner. Output a clear implementation plan.';
  const userPrompt = `Generate an implementation plan for: ${input}`;
  const response = await provider.generate(systemPrompt, userPrompt);

  await fs.writeFile(path.resolve(outputPath), response.content || '', 'utf8');
  return response.content || '';
}

export async function executePlanWithAgents(objective) {
  return swarmCommand(objective, { parallel: true });
}

export async function runTests() {
  try {
    const { stdout, stderr } = await execAsync('npm test', { env: process.env });
    return { ok: true, output: stdout + stderr };
  } catch (error) {
    return { ok: false, output: error.stdout + error.stderr };
  }
}

export async function deploy(projectRoot = process.cwd()) {
  const vercelConfig = path.join(projectRoot, 'vercel.json');
  const netlifyConfig = path.join(projectRoot, 'netlify.toml');

  try {
    await fs.access(vercelConfig);
    return { ok: true, provider: 'vercel', message: 'Ready to deploy with Vercel CLI' };
  } catch {
    // ignore
  }

  try {
    await fs.access(netlifyConfig);
    return { ok: true, provider: 'netlify', message: 'Ready to deploy with Netlify CLI' };
  } catch {
    // ignore
  }

  return { ok: false, provider: null, message: 'No deployment configuration detected' };
}

export async function runPipeline(input) {
  const parsed = parseRequest(input);
  const plan = await generatePlan(input);
  await executePlanWithAgents(input);
  const tests = await runTests();
  const deployment = await deploy();

  return {
    parsed,
    plan,
    tests,
    deployment,
  };
}

export default {
  parseRequest,
  generatePlan,
  executePlanWithAgents,
  runTests,
  deploy,
  runPipeline,
};
