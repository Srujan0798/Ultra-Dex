// Copyright (c) 2026 Ultra-Dex — AI Provider Registry

export { BaseProvider } from './base-provider.js';
export { OpenAIProvider } from './openai.js';
export { AnthropicProvider } from './anthropic.js';
export { GoogleProvider } from './google.js';
export { MistralProvider } from './mistral.js';
export { GroqProvider } from './groq.js';
export { DeepSeekProvider } from './deepseek.js';
export { CohereProvider } from './cohere.js';
export { TogetherProvider } from './together.js';
export { FireworksProvider } from './fireworks.js';
export { PerplexityProvider } from './perplexity.js';

const providerMap = {
  openai: () => import('./openai.js').then((m) => m.OpenAIProvider),
  anthropic: () => import('./anthropic.js').then((m) => m.AnthropicProvider),
  google: () => import('./google.js').then((m) => m.GoogleProvider),
  mistral: () => import('./mistral.js').then((m) => m.MistralProvider),
  groq: () => import('./groq.js').then((m) => m.GroqProvider),
  deepseek: () => import('./deepseek.js').then((m) => m.DeepSeekProvider),
  cohere: () => import('./cohere.js').then((m) => m.CohereProvider),
  together: () => import('./together.js').then((m) => m.TogetherProvider),
  fireworks: () => import('./fireworks.js').then((m) => m.FireworksProvider),
  perplexity: () => import('./perplexity.js').then((m) => m.PerplexityProvider),
};

export function listProviders() {
  return Object.keys(providerMap);
}

export async function createProvider(name, config = {}) {
  const loader = providerMap[name];
  if (!loader) {
    throw new Error(`Unknown provider: ${name}. Available: ${listProviders().join(', ')}`);
  }
  const ProviderClass = await loader();
  return new ProviderClass(config);
}
