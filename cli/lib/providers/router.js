/**
 * Semantic Router AI Provider
 * Routes tasks between local and cloud intelligence
 */

import { BaseProvider } from './base.js';

export class RouterProvider extends BaseProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.localProvider = options.localProvider;
    this.cloudProvider = options.cloudProvider;
    this.threshold = options.threshold || 'medium'; // complexity threshold
  }

  getName() {
    return `Semantic Router (${this.localProvider?.getName() || 'Local'} + ${this.cloudProvider?.getName() || 'Cloud'})`;
  }

  getDefaultModel() {
    return 'router-v1';
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    const isComplex = this.assessComplexity(systemPrompt, userPrompt);
    const provider = (isComplex || !this.localProvider) ? this.cloudProvider : this.localProvider;
    
    console.error(`[Router] Routing to ${provider.getName()} (Complexity: ${isComplex ? 'High' : 'Low'})`);
    
    return provider.generate(systemPrompt, userPrompt, options);
  }

  async generateStream(systemPrompt, userPrompt, onChunk, options = {}) {
    const isComplex = this.assessComplexity(systemPrompt, userPrompt);
    const provider = (isComplex || !this.localProvider) ? this.cloudProvider : this.localProvider;
    
    console.error(`[Router] Routing to ${provider.getName()} (Complexity: ${isComplex ? 'High' : 'Low'})`);
    
    return provider.generateStream(systemPrompt, userPrompt, onChunk, options);
  }

  assessComplexity(systemPrompt, userPrompt) {
    const combined = (systemPrompt + userPrompt).toLowerCase();
    
    // Heuristics for "High Complexity"
    const complexKeywords = [
      'refactor', 'architect', 'security audit', 'design pattern', 
      'migration', 'performance optimization', 'complex', 'fix the bug'
    ];

    const isComplexKeyword = complexKeywords.some(k => combined.includes(k));
    const isLongPrompt = combined.length > 2000;
    
    return isComplexKeyword || isLongPrompt;
  }

  async validateApiKey() {
    const cloudValid = await this.cloudProvider?.validateApiKey();
    return !!cloudValid;
  }
}

export default RouterProvider;
