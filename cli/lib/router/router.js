// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { SmartModelRouter } from './model-router.js';
import { classifyTask } from './classifier.js';
import { evaluateOutput } from './evaluator.js';

const DEFAULT_ROUTING_TABLE = {
  Architect: { preferred: 'claude-3-5-sonnet', fallback: 'gpt-4o' },
  CodeGen: { preferred: 'claude-3-5-sonnet', fallback: 'deepseek' },
  Refactor: { preferred: 'gpt-4o', fallback: 'claude-haiku' },
  SimpleFix: { preferred: 'gpt-4o-mini', fallback: 'llama3' },
  Docs: { preferred: 'gemini-1.5-pro', fallback: 'gpt-3.5' },
  Analysis: { preferred: 'claude-3-5-sonnet', fallback: 'gpt-4o' },
};

async function loadRouterConfig(projectDir = process.cwd()) {
  const configPath = path.join(projectDir, 'router.json');
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { strategies: {}, overrides: [] };
  }
}

export async function routeTaskWithEvaluation(task, options = {}) {
  const classification = classifyTask(task);
  const config = await loadRouterConfig(options.projectDir || process.cwd());
  const router = new SmartModelRouter({ fallbackChain: options.fallbackChain });

  const override = (config.overrides || []).find((rule) =>
    task.toLowerCase().includes(rule.keyword)
  );
  const strategy = config.strategies?.[options.strategy];

  const routing = DEFAULT_ROUTING_TABLE[classification.type] || DEFAULT_ROUTING_TABLE.CodeGen;
  const preferredModel = override?.model || strategy?.default || routing.preferred;

  const routeInfo = await router.routeTask(task, { preferredProvider: options.provider });

  const candidates = [preferredModel, routing.fallback].filter(Boolean);

  const attempts = [];
  let finalModel = candidates[0];

  for (let i = 0; i < Math.min(candidates.length, options.maxAttempts || 3); i += 1) {
    const model = candidates[i];
    const evaluation = await evaluateOutput({
      output: options.sampleOutput || 'placeholder',
      projectDir: options.projectDir,
      requireQuality: options.requireQuality || false,
    });

    attempts.push({ model, evaluation });

    if (evaluation.passed) {
      finalModel = model;
      break;
    }
  }

  return {
    classification,
    preferredModel: finalModel,
    attempts,
    routeInfo,
  };
}

export default routeTaskWithEvaluation;
