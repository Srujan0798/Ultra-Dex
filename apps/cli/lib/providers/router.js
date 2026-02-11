// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Router module
 * @module providers/router
 */

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
    this.threshold = options.threshold || 'medium';
  }

  getDefaultModel() {
    return 'router-v1';
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
    const localName = this.localProvider?.getName?.() || null;
    const cloudName = this.cloudProvider?.getName?.() || null;
    if (localName || cloudName) {
      const parts = [];
      if (localName) parts.push(`Local: ${localName}`);
      if (cloudName) parts.push(`Cloud: ${cloudName}`);
      return `Semantic Router (${parts.join(' | ')})`;
    }
    return 'Semantic Router';
  }

  async validateApiKey() {
    if (!this.cloudProvider) return false;
    if (this.cloudProvider?.validateApiKey) return this.cloudProvider.validateApiKey();
    return true;
  }

  assessComplexity(systemPrompt = '', userPrompt = '') {
    const combined = `${systemPrompt}\n${userPrompt}`.toLowerCase();
    if (combined.length > 2000) return true;

    const keywords = [
      'refactor',
      'architect',
      'architecture',
      'security',
      'audit',
      'design pattern',
      'design patterns',
      'migration',
      'performance',
      'optimiz',
      'complex',
      'production',
      'bug',
    ];

    return keywords.some((keyword) => combined.includes(keyword));
  }

  selectProvider(systemPrompt, userPrompt) {
    const isComplex = this.assessComplexity(systemPrompt, userPrompt);
    if (isComplex) {
      return this.cloudProvider || this.localProvider;
    }
    return this.localProvider || this.cloudProvider;
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
