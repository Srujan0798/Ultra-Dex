// Copyright (c) 2026 Ultra-Dex

/**
 * Model Router Config Loader
 * Supports strategies (cost/performance) and per-project overrides.
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

const DEFAULT_ROUTER_CONFIG = {
  strategies: {
    cost: { defaultModel: 'gpt-4o-mini', performancePriority: 'cost' },
    performance: { defaultModel: 'claude-3-5-sonnet', performancePriority: 'accuracy' },
    balanced: { defaultModel: 'gpt-4o', performancePriority: 'balanced' },
  },
  routes: {
    'code-generation': {
      preferred: ['claude-3-5-sonnet'],
      fallbacks: ['gpt-4o', 'gemini-1.5-pro'],
    },
    refactoring: {
      preferred: ['gpt-4o'],
      fallbacks: ['claude-3-5-sonnet', 'gemini-1.5-pro'],
    },
    documentation: {
      preferred: ['gemini-1.5-pro'],
      fallbacks: ['gpt-4o', 'claude-3-5-sonnet'],
    },
  },
  overrides: [],
};

const CONFIG_LOCATIONS = [
  path.join(process.cwd(), '.ultra-dex', 'router.json'),
  path.join(process.cwd(), '.ultra', 'router.json'),
  path.join(process.cwd(), 'config', 'router.json'),
];

async function readConfigFile(filePath) {
  try {
    const raw = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadRouterConfig() {
  for (const configPath of CONFIG_LOCATIONS) {
    const data = await readConfigFile(configPath);
    if (data) return mergeConfig(data);
  }
  return mergeConfig({});
}

export function loadRouterConfigSync() {
  for (const configPath of CONFIG_LOCATIONS) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const data = JSON.parse(raw);
      return mergeConfig(data);
    } catch {
      // continue
    }
  }
  return mergeConfig({});
}

export function mergeConfig(config = {}) {
  return {
    strategies: { ...DEFAULT_ROUTER_CONFIG.strategies, ...(config.strategies || {}) },
    routes: { ...DEFAULT_ROUTER_CONFIG.routes, ...(config.routes || {}) },
    overrides: Array.isArray(config.overrides) ? config.overrides : DEFAULT_ROUTER_CONFIG.overrides,
  };
}

export function resolveOverrides(taskDescription, overrides = []) {
  if (!taskDescription) return null;
  const lower = taskDescription.toLowerCase();
  return overrides.find(
    (rule) => rule.keyword && lower.includes(String(rule.keyword).toLowerCase())
  );
}

export default {
  DEFAULT_ROUTER_CONFIG,
  loadRouterConfig,
  mergeConfig,
  resolveOverrides,
};
