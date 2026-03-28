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

// Next-Gen (2026)
export { GPT5Provider } from './gpt5.js';
export { Claude4Provider } from './claude4.js';
export { Gemini25Provider } from './gemini25.js';
export { Llama4Provider } from './llama4.js';
export { Grok3Provider } from './grok3.js';

// NVIDIA
export { nemotronProvider, createNemotronClient, chatWithNemotron, streamWithNemotron, NEMOTRON_MODELS } from './nemotron.js';

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
  // Next-Gen
  gpt5: () => import('./gpt5.js').then((m) => m.GPT5Provider),
  claude4: () => import('./claude4.js').then((m) => m.Claude4Provider),
  'gemini-2.5': () => import('./gemini25.js').then((m) => m.Gemini25Provider),
  llama4: () => import('./llama4.js').then((m) => m.Llama4Provider),
  grok3: () => import('./grok3.js').then((m) => m.Grok3Provider),
  // NVIDIA
  nvidia: () => import('./nemotron.js').then((m) => m.nemotronProvider),
  nemotron: () => import('./nemotron.js').then((m) => m.nemotronProvider),
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
