// Copyright (c) 2026 Ultra-Dex

/**
 * AI Provider Factory
 * Creates and manages AI providers for the generate command
 */

import { ClaudeSonnet5Provider } from './claude.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { OllamaProvider } from './ollama.js';
import { NVIDIAProvider } from './nvidia.js';
import { RouterProvider } from './router.js';
import { LiteLLMProvider } from './litellm.js';
import { enforceAgentExecution } from '../governance/index.js';
import { memex } from '../memory/memex.js';
import { orchestrator } from '../resilience/self-healing.js';
import { logger } from '../utils/logger.js';

const noopHealthMonitor = {
  recordLatency() {},
  recordError() {},
};
let healthMonitorPromise = null;

async function getProviderHealthMonitor() {
  if (!healthMonitorPromise) {
    healthMonitorPromise = import('../../../../src/core/routing/health-monitor.ts')
      .then((module) => module.providerHealthMonitor || noopHealthMonitor)
      .catch(() => noopHealthMonitor);
  }
  return healthMonitorPromise;
}

const NO_KEY_PROVIDERS = new Set(['ollama', 'litellm']);
const LOCAL_ONLY_PROVIDERS = new Set(['ollama']);

export const PROVIDERS = {
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
  nvidia: {
    class: NVIDIAProvider,
    envKey: 'NVIDIA_API_KEY',
    name: 'NVIDIA (Nemotron)',
  },
  ollama: {
    class: OllamaProvider,
    envKey: 'OLLAMA_HOST', // Optional
    name: 'Ollama (Local)',
  },
  litellm: {
    class: LiteLLMProvider,
    envKey: 'LITELLM_API_KEY',
    name: 'LiteLLM Proxy',
  },
  router: {
    class: RouterProvider,
    name: 'Semantic Router (Hybrid)',
  },
  mock: {
    getMockClass: async () => {
      const mockModule = await import('./mock.js');
      return mockModule.MockOpenAI;
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
  return Object.entries(PROVIDERS)
    .filter(([id]) => !LOCAL_ONLY_PROVIDERS.has(id) || isLocalProviderEnabled())
    .map(([id, config]) => ({
      id,
      name: config.name,
      envKey: config.envKey,
    }));
}

export function canUseProviderWithoutApiKey(providerId) {
  const normalized = String(providerId || '').toLowerCase();
  if (NO_KEY_PROVIDERS.has(normalized)) return true;
  if (LOCAL_ONLY_PROVIDERS.has(normalized)) return isLocalProviderEnabled();
  return false;
}

function isLocalProviderEnabled() {
  return process.env.ULTRA_DEX_ENABLE_LOCAL_PROVIDERS === '1';
}

/**
 * Create an AI provider instance
 * @param {string} providerId - Provider identifier (claude, openai, gemini, ollama, router, litellm)
 * @param {Object} options - Provider options
 * @param {string} options.apiKey - API key (optional, will use env var if not provided)
 * @param {string} options.model - Model to use (optional)
 * @returns {Promise<BaseProvider>}
 */
export async function createProvider(providerId, options = {}) {
  logger.info('Creating AI provider', { providerId, hasApiKey: !!options.apiKey });

  // Support provider/model format (e.g., litellm/gpt-4o)
  if (providerId && providerId.includes('/') && !PROVIDERS[providerId]) {
    const [pId, modelId] = providerId.split('/');
    if (PROVIDERS[pId]) {
      providerId = pId;
      options.model = modelId;
    }
  }

  // Global Mock Override
  if (process.env.MOCK_AI === 'true') {
    logger.info('Mock AI override active - using mock provider');
    providerId = 'mock';
  }

  // Ensure resilience system is initialized
  await orchestrator.initialize();

  const agent = options.agent;
  if (agent) {
    enforceAgentExecution({ agent, providerId });
  }

  if (providerId === 'router') {
    const cloudId = options.cloudProvider || getDefaultProvider();
    const cloudProvider = cloudId ? await createProvider(cloudId, options) : null;

    let localProvider = null;
    if (isLocalProviderEnabled()) {
      try {
        localProvider = new OllamaProvider(null, options);
      } catch (err) {
        logger.warn('Local Ollama provider requested but failed to initialize', {
          error: err.message,
        });
      }
    }

    const routerProvider = new RouterProvider(null, {
      ...options,
      cloudProvider,
      localProvider,
    });
    // Router logic might recurse, but we wrap the router itself too
    const resilient = wrapProviderWithCircuitBreaker(routerProvider, providerId);
    const governed = agent ? wrapProviderWithGovernance(resilient, agent) : resilient;
    return wrapProviderWithMemex(governed, { agent });
  }

  const resolvedOptions = { ...options };

  const providerConfig = PROVIDERS[providerId];

  if (!providerConfig) {
    logger.error('Unknown AI provider requested', { providerId });
    throw new Error(
      `Unknown provider: ${providerId}. Available: ${Object.keys(PROVIDERS).join(', ')}`
    );
  }

  if (LOCAL_ONLY_PROVIDERS.has(providerId) && !isLocalProviderEnabled()) {
    throw new Error(
      `Provider "${providerId}" is disabled in cloud-only mode.\n\n` +
        `To enable local providers intentionally, set:\n` +
        `  export ULTRA_DEX_ENABLE_LOCAL_PROVIDERS=1`
    );
  }

  // Handle mock provider specially (it's async)
  if (providerId === 'mock') {
    const MockProviderClass = await providerConfig.getMockClass();
    const provider = new MockProviderClass(options);

    const resilient = wrapProviderWithCircuitBreaker(provider, providerId);
    const governed = agent ? wrapProviderWithGovernance(resilient, agent) : resilient;
    return wrapProviderWithMemex(governed, { agent });
  }

  // Get API key from options or environment (Ollama/LiteLLM doesn't strictly need one if local)
  const apiKey =
    resolvedOptions.apiKey || (providerConfig.envKey ? process.env[providerConfig.envKey] : null);

  if (!apiKey && !canUseProviderWithoutApiKey(providerId)) {
    logger.error('AI provider API key missing', { providerId, envKey: providerConfig.envKey });
    throw new Error(
      `API key not found for ${providerConfig.name}.\n\n` +
        `To fix this, either:\n` +
        `  1. Set ${providerConfig.envKey} environment variable:\n` +
        `     export ${providerConfig.envKey}=your-key-here\n\n` +
        `  2. Pass the key directly:\n` +
        `     ultra-dex generate "idea" --key your-key-here`
    );
  }

  const provider = new providerConfig.class(apiKey, resolvedOptions);

  const resilient = wrapProviderWithCircuitBreaker(provider, providerId);
  const governed = agent ? wrapProviderWithGovernance(resilient, agent) : resilient;
  return wrapProviderWithMemex(governed, { agent });
}

function wrapProviderWithCircuitBreaker(provider, providerId) {
  if (!provider) return provider;

  // Use distinct circuit breaker for each provider
  const cbName = `provider:${providerId}`;

  const baseGenerate = provider.generate?.bind(provider);
  const baseStream = provider.generateStream?.bind(provider);

  if (baseGenerate) {
    provider.generate = async (systemPrompt, userPrompt, opts = {}) => {
      const startedAt = Date.now();
      const healthMonitor = await getProviderHealthMonitor();
      return orchestrator.execute({
        circuitBreakerName: cbName,
        operation: async () => {
          try {
            const result = await baseGenerate(systemPrompt, userPrompt, opts);
            healthMonitor.recordLatency(providerId, Date.now() - startedAt);
            return result;
          } catch (_err) {
            healthMonitor.recordError(providerId, _err);
            throw _err;
          }
        },
      });
    };
  }

  if (baseStream) {
    provider.generateStream = async (systemPrompt, userPrompt, onChunk, opts = {}) => {
      const startedAt = Date.now();
      const healthMonitor = await getProviderHealthMonitor();
      return orchestrator.execute({
        circuitBreakerName: cbName,
        operation: async () => {
          try {
            const result = await baseStream(systemPrompt, userPrompt, onChunk, opts);
            healthMonitor.recordLatency(providerId, Date.now() - startedAt);
            return result;
          } catch (_err) {
            healthMonitor.recordError(providerId, _err);
            throw _err;
          }
        },
      });
    };
  }

  return provider;
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
  if (process.env.NVIDIA_API_KEY) return 'nvidia';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GOOGLE_AI_KEY) return 'gemini';

  return null;
}

/**
 * Check which providers have API keys configured
 * @returns {Array<{id: string, name: string, configured: boolean}>}
 */
export function checkConfiguredProviders() {
  return Object.entries(PROVIDERS)
    .filter(([id]) => !LOCAL_ONLY_PROVIDERS.has(id) || isLocalProviderEnabled())
    .map(([id, config]) => ({
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
  } catch (_e) {
    return null;
  }
}

// Core providers
export {
  ClaudeSonnet5Provider,
  OpenAIProvider,
  GeminiProvider,
  OllamaProvider,
  NVIDIAProvider,
  RouterProvider,
  LiteLLMProvider,
};

// Ecosystem adapters
export { LangChainAdapter } from './langchain.js';

// Test providers
export { MockOpenAI, MockAnthropic, MockGoogle } from './mock.js';
export { OpenAIAssistantsProvider } from './openai-assistants.js';

export function createOpenAIRunnable(model) {
  return {
    invoke: async ({ messages }) => {
      const provider = await createProvider('openai', { model });
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
      const provider = await createProvider('claude', { model });
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
      const provider = await createProvider('gemini', { model });
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const userMessage = messages.find((m) => m.role === 'user')?.content || '';
      const result = await provider.generate(systemMessage, userMessage);
      return { content: result.content };
    },
  };
}
