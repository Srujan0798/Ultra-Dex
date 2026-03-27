// Copyright (c) 2026 Ultra-Dex

/**
 * AI Provider Factory
 * Creates and manages AI providers for the generate command
 */

import { ClaudeSonnet5Provider } from './claude.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { OllamaProvider } from './ollama.js';
import { RouterProvider } from './router.js';
import { enforceAgentExecution } from '../governance/index.js';
import { memex } from '../memory/memex.js';
import { printWarning } from '../utils/output.js';

const PROVIDERS = {
  claude: {
    class: ClaudeSonnet5Provider,
    envKey: 'ANTHROPIC_API_KEY',
    name: 'Claude (Anthropic)',
  },
  openai: {
    class: OpenAIProvider,
    envKey: 'OPENAI_API_KEY',
    name: 'OpenAI',
  },
  gemini: {
    class: GeminiProvider,
    envKey: 'GOOGLE_AI_KEY',
    name: 'Google Gemini',
  },
  ollama: {
    class: OllamaProvider,
    envKey: 'OLLAMA_HOST', // Optional
    name: 'Ollama (Local)',
  },
  router: {
    class: RouterProvider,
    name: 'Semantic Router (Hybrid)',
  },
  mock: {
    getMockClass: async () => {
      if (process.env.NODE_ENV === 'test' || process.env.MOCK_AI_PROVIDERS === 'true') {
        const mockModule = await import('./mock.js');
        return mockModule.MockOpenAI;
      }
      return OpenAIProvider; // Fallback to OpenAI in prod
    },
    envKey: null,
    name: 'Mock Provider (Testing)',
  },
};

/**
 * Get the list of available providers
 * @returns {Array<{id: string, name: string, envKey: string}>}
 */
export function getAvailableProviders() {
  return Object.entries(PROVIDERS).map(([id, config]) => ({
    id,
    name: config.name,
    envKey: config.envKey,
  }));
}

/**
 * Create an AI provider instance
 * @param {string} providerId - Provider identifier (claude, openai, gemini, ollama, router)
 * @param {Object} options - Provider options
 * @param {string} options.apiKey - API key (optional, will use env var if not provided)
 * @param {string} options.model - Model to use (optional)
 * @returns {Promise<BaseProvider>}
 */
export async function createProvider(providerId, options = {}) {
  const agent = options.agent;
  if (agent) {
    enforceAgentExecution({ agent, providerId });
  }

  if (providerId === 'router') {
    let cloudId = options.cloudProvider || getDefaultProvider();

    // Prevent recursive routing loop if router is the default provider
    if (cloudId === 'router') {
      const configured = checkConfiguredProviders();
      const fallback = configured.find((p) => p.id !== 'router' && p.configured);
      cloudId = fallback ? fallback.id : 'ollama';
    }

    const cloudProvider = cloudId ? createProvider(cloudId, options) : null;

    let localProvider = null;
    try {
      localProvider = new OllamaProvider(null, options);
    } catch (e) {
      // Local not available
    }

    const routerProvider = new RouterProvider(null, {
      ...options,
      cloudProvider,
      localProvider,
    });
    return agent ? wrapProviderWithGovernance(routerProvider, agent) : routerProvider;
  }

  const providerConfig = PROVIDERS[providerId];

  if (!providerConfig) {
    throw new Error(
      `Unknown provider: ${providerId}. Available: ${Object.keys(PROVIDERS).join(', ')}`
    );
  }

  // Handle mock provider specially (it's async)
  if (providerId === 'mock') {
    const MockProviderClass = await providerConfig.getMockClass();
    const provider = new MockProviderClass(options);
    const wrapped = agent ? wrapProviderWithGovernance(provider, agent) : provider;
    return wrapProviderWithMemex(wrapped, { agent });
  }

  // Get API key from options or environment (Ollama doesn't strictly need one)
  const apiKey =
    options.apiKey || (providerConfig.envKey ? process.env[providerConfig.envKey] : null);

  if (!apiKey && providerId !== 'ollama') {
    throw new Error(
      `API key not found for ${providerConfig.name}.\n\n` +
        `To fix this, either:\n` +
        `  1. Set ${providerConfig.envKey} environment variable:\n` +
        `     export ${providerConfig.envKey}=your-key-here\n\n` +
        `  2. Pass the key directly:\n` +
        `     ultra-dex generate "idea" --key your-key-here\n\n` +
        `  3. Use Ollama for local AI (no key needed):\n` +
        `     ultra-dex generate "idea" --provider ollama`
    );
  }

  // Basic validation of key format (warning only)
  if (apiKey) {
    if (providerId === 'openai' && !apiKey.startsWith('sk-')) {
      printWarning(`⚠️  OpenAI API key usually starts with 'sk-'. Check your configuration.`);
    }
    if (providerId === 'claude' && !apiKey.startsWith('sk-ant-')) {
      printWarning(`⚠️  Anthropic API key usually starts with 'sk-ant-'. Check your configuration.`);
    }
  }

  const provider = new providerConfig.class(apiKey, options);
  const wrapped = agent ? wrapProviderWithGovernance(provider, agent) : provider;
  return wrapProviderWithMemex(wrapped, { agent });
}

function wrapProviderWithGovernance(provider, agent) {
  const baseGenerate = provider.generate?.bind(provider);
  const baseStream = provider.generateStream?.bind(provider);

  if (baseGenerate) {
    provider.generate = async (systemPrompt, userPrompt, opts = {}) => {
      enforceAgentExecution({
        agent,
        providerId: provider.getName?.() || 'provider',
        task: 'generate',
      });
      return baseGenerate(systemPrompt, userPrompt, opts);
    };
  }

  if (baseStream) {
    provider.generateStream = async (systemPrompt, userPrompt, onChunk, opts = {}) => {
      enforceAgentExecution({
        agent,
        providerId: provider.getName?.() || 'provider',
        task: 'generateStream',
      });
      return baseStream(systemPrompt, userPrompt, onChunk, opts);
    };
  }

  return provider;
}

function wrapProviderWithMemex(provider, context = {}) {
  if (!provider || provider.__memexWrapped) return provider;
  provider.__memexWrapped = true;

  const baseGenerate = provider.generate?.bind(provider);
  if (baseGenerate) {
    provider.generate = async (systemPrompt, userPrompt, opts = {}) => {
      const result = await baseGenerate(systemPrompt, userPrompt, opts);
      await safeMemexIndex({
        provider,
        agent: context.agent,
        systemPrompt,
        userPrompt,
        output: result?.content || result?.text || JSON.stringify(result),
        metadata: { model: provider.model, task: opts.task },
      });
      return result;
    };
  }

  const baseStream = provider.generateStream?.bind(provider);
  if (baseStream) {
    provider.generateStream = async (systemPrompt, userPrompt, onChunk, opts = {}) => {
      let buffer = '';
      const wrappedOnChunk = (text) => {
        if (text) buffer += text;
        if (onChunk) onChunk(text);
      };
      const result = await baseStream(systemPrompt, userPrompt, wrappedOnChunk, opts);
      const output = result?.content || result?.text || buffer;
      await safeMemexIndex({
        provider,
        agent: context.agent,
        systemPrompt,
        userPrompt,
        output,
        metadata: { model: provider.model, task: opts.task },
      });
      return result;
    };
  }

  const baseAnalyze = provider.analyzeImage?.bind(provider);
  if (baseAnalyze) {
    provider.analyzeImage = async (imageBuffer, prompt, opts = {}) => {
      const result = await baseAnalyze(imageBuffer, prompt, opts);
      await safeMemexIndex({
        provider,
        agent: context.agent,
        systemPrompt: '',
        userPrompt: prompt || '',
        output: result?.content || result?.text || result,
        metadata: { model: provider.model, task: opts.task, vision: true },
      });
      return result;
    };
  }

  return provider;
}

async function safeMemexIndex({
  provider,
  agent,
  systemPrompt,
  userPrompt,
  output,
  metadata,
} = {}) {
  try {
    await memex.indexInteraction({
      agent: agent?.id || agent?.roleId || agent?.name || 'unknown',
      provider: provider?.getName?.() || provider?.constructor?.name || 'unknown',
      task: metadata?.task || null,
      input: userPrompt || '',
      output: output || '',
      metadata: {
        ...metadata,
        systemPrompt: systemPrompt ? systemPrompt.slice(0, 2000) : '',
      },
    });
  } catch {
    // Memex indexing must never break execution
  }
}

/**
 * Get the default provider based on available API keys
 * @returns {string|null} Provider ID or null if none available
 */
export function getDefaultProvider() {
  if (process.env.ULTRA_DEX_DEFAULT_PROVIDER) return process.env.ULTRA_DEX_DEFAULT_PROVIDER;

  // Check environment variables in order of preference
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GOOGLE_AI_KEY) return 'gemini';

  // Final fallback to Ollama (local-first resilience)
  if (process.env.OLLAMA_HOST) return 'ollama';

  return null;
}

/**
 * Check which providers have API keys configured
 * @returns {Array<{id: string, name: string, configured: boolean}>}
 */
export function checkConfiguredProviders() {
  return Object.entries(PROVIDERS).map(([id, config]) => ({
    id,
    name: config.name,
    envKey: config.envKey,
    configured: !!process.env[config.envKey],
  }));
}

/**
 * Get a default configured provider instance
 * @returns {BaseProvider|null}
 */
export function getProvider() {
  const id = getDefaultProvider();
  if (!id) return null;
  try {
    return createProvider(id);
  } catch (e) {
    return null;
  }
}

// Core providers
export { ClaudeSonnet5Provider, OpenAIProvider, GeminiProvider, OllamaProvider, RouterProvider };

// Ecosystem adapters
export { LangChainAdapter } from './langchain.js';

// Test providers
export { MockOpenAI, MockAnthropic, MockGoogle } from './mock.js';
export { OpenAIAssistantsProvider } from './openai-assistants.js';

export function createOpenAIRunnable(model) {
  return {
    invoke: async ({ messages }) => {
      const provider = createProvider('openai', { model });
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const userMessage = messages.find((m) => m.role === 'user')?.content || '';
      const result = await provider.generate(systemMessage, userMessage);
      return { content: result.content };
    },
  };
}

export function createAnthropicRunnable(model) {
  return {
    invoke: async ({ messages }) => {
      const provider = createProvider('claude', { model });
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const userMessage = messages.find((m) => m.role === 'user')?.content || '';
      const result = await provider.generate(systemMessage, userMessage);
      return { content: result.content };
    },
  };
}

export function createGoogleRunnable(model) {
  return {
    invoke: async ({ messages }) => {
      const provider = createProvider('gemini', { model });
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const userMessage = messages.find((m) => m.role === 'user')?.content || '';
      const result = await provider.generate(systemMessage, userMessage);
      return { content: result.content };
    },
  };
}
