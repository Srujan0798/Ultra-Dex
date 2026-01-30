/**
 * AI Provider Factory
 * Creates and manages AI providers for the generate command
 */

import { ClaudeProvider } from './claude.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { OllamaProvider } from './ollama.js';
import { RouterProvider } from './router.js';

const PROVIDERS = {
  claude: {
    class: ClaudeProvider,
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
  }
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
 * @returns {BaseProvider}
 */
export function createProvider(providerId, options = {}) {
  if (providerId === 'router') {
    const cloudId = options.cloudProvider || getDefaultProvider() || 'claude';
    const cloudProvider = createProvider(cloudId, options);
    
    let localProvider = null;
    try {
      localProvider = new OllamaProvider(null, options);
    } catch (e) {
      // Local not available
    }

    return new RouterProvider(null, {
      ...options,
      cloudProvider,
      localProvider
    });
  }

  const providerConfig = PROVIDERS[providerId];
  
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${providerId}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  // Get API key from options or environment (Ollama doesn't strictly need one)
  const apiKey = options.apiKey || (providerConfig.envKey ? process.env[providerConfig.envKey] : null);
  
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

  return new providerConfig.class(apiKey, options);
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
export { ClaudeProvider, OpenAIProvider, GeminiProvider, OllamaProvider, RouterProvider };

// Ecosystem adapters (v3.4.2)
export { LangChainAdapter } from './langchain.js';
export { OpenAIAssistantsProvider } from './openai-assistants.js';
