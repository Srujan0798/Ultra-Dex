// Copyright (c) 2026 Ultra-Dex

export { OpenAIProvider } from './openai.js';
export { AnthropicProvider } from './anthropic.js';
export { GoogleProvider } from './google.js';
export { MistralProvider } from './mistral.js';
export { GroqProvider } from './groq.js';
export { DeepSeekProvider } from './deepseek.js';
export { KimiProvider } from './kimi.js';
export { QwenProvider } from './qwen-provider.js';
export { CohereProvider } from './cohere.js';
export { TogetherProvider } from './together.js';

export { DeepSeekR1Provider } from './deepseek-r1.js';
export { ZhipuProvider } from './zhipu.js';
export { YiProvider } from './yi.js';
export { LlamaProvider } from './llama.js';
export { OpenClawProvider } from './openclaw.js';

export { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export const providerConstructors = {
  openai: () => import('./openai.js').then((m) => m.OpenAIProvider),
  anthropic: () => import('./anthropic.js').then((m) => m.AnthropicProvider),
  google: () => import('./google.js').then((m) => m.GoogleProvider),
  mistral: () => import('./mistral.js').then((m) => m.MistralProvider),
  groq: () => import('./groq.js').then((m) => m.GroqProvider),
  deepseek: () => import('./deepseek.js').then((m) => m.DeepSeekProvider),
  kimi: () => import('./kimi.js').then((m) => m.KimiProvider),
  qwen: () => import('./qwen-provider.js').then((m) => m.QwenProvider),
  cohere: () => import('./cohere.js').then((m) => m.CohereProvider),
  together: () => import('./together.js').then((m) => m.TogetherProvider),
  deepseekR1: () => import('./deepseek-r1.js').then((m) => m.DeepSeekR1Provider),
  zhipu: () => import('./zhipu.js').then((m) => m.ZhipuProvider),
  yi: () => import('./yi.js').then((m) => m.YiProvider),
  llama: () => import('./llama.js').then((m) => m.LlamaProvider),
  openclaw: () => import('./openclaw.js').then((m) => m.OpenClawProvider),
};
