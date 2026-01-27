/**
 * AI Provider Factory
 * Creates and manages AI providers for the generate command
 */

import { ClaudeProvider } from './claude.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';

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
 * @param {string} providerId - Provider identifier (claude, openai, gemini)
 * @param {Object} options - Provider options
 * @param {string} options.apiKey - API key (optional, will use env var if not provided)
 * @param {string} options.model - Model to use (optional)
 * @returns {BaseProvider}
 */
export function createProvider(providerId, options = {}) {
  const providerConfig = PROVIDERS[providerId];
  
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${providerId}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  // Get API key from options or environment
  const apiKey = options.apiKey || process.env[providerConfig.envKey];
  
  if (!apiKey) {
    throw new Error(
      `API key not found for ${providerConfig.name}.\n` +
      `Set the ${providerConfig.envKey} environment variable or use --key option.`
    );
  }

  return new providerConfig.class(apiKey, options);
}

/**
 * Get the default provider based on available API keys
 * @returns {string|null} Provider ID or null if none available
 */
export function getDefaultProvider() {
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

export { ClaudeProvider, OpenAIProvider, GeminiProvider };
