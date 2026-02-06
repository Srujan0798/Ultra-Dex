// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { BaseProvider } from './base.js';

const ROUTER_CONFIG = path.join(process.cwd(), 'router.json');

export async function loadRouterConfig() {
  try {
    const data = await fs.readFile(ROUTER_CONFIG, 'utf8');
    return JSON.parse(data);
  } catch {
    return {
      routes: {
        planning: 'claude-sonnet',
        coding: 'gpt-4',
        review: 'claude-opus',
        simple: 'ollama',
      },
    };
  }
}

export async function routeTask(taskType) {
  const config = await loadRouterConfig();
  return config.routes?.[taskType] || config.routes?.default || 'claude-sonnet';
}

export class RouterProvider extends BaseProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.cloudProvider = options.cloudProvider;
    this.localProvider = options.localProvider;
  }

  getDefaultModel() {
    return 'router';
  }

  getAvailableModels() {
    return [{ id: 'router', name: 'Router', maxTokens: this.maxTokens }];
  }

  estimateCost(inputTokens, outputTokens) {
    if (this.cloudProvider?.estimateCost) {
      return this.cloudProvider.estimateCost(inputTokens, outputTokens);
    }
    return { input: 0, output: 0, total: 0 };
  }

  getName() {
    return 'Semantic Router (Hybrid)';
  }

  async validateApiKey() {
    if (this.cloudProvider?.validateApiKey) return this.cloudProvider.validateApiKey();
    return true;
  }

  selectProvider(systemPrompt, userPrompt) {
    // Simple heuristic: short prompts go to local if available
    const length = (systemPrompt?.length || 0) + (userPrompt?.length || 0);
    if (this.localProvider && length < 800) return this.localProvider;
    return this.cloudProvider || this.localProvider;
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    const provider = this.selectProvider(systemPrompt, userPrompt);
    if (!provider?.generate) throw new Error('No provider available for routing');
    return provider.generate(systemPrompt, userPrompt, options);
  }

  async generateStream(systemPrompt, userPrompt, onChunk, options = {}) {
    const provider = this.selectProvider(systemPrompt, userPrompt);
    if (!provider?.generateStream) {
      return this.generate(systemPrompt, userPrompt, options);
    }
    return provider.generateStream(systemPrompt, userPrompt, onChunk, options);
  }
}

export default { loadRouterConfig, routeTask, RouterProvider };
