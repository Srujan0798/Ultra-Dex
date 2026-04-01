// Copyright (c) 2026 Ultra-Dex
// AI Providers - Central provider management

export { OpenAIProvider } from './openai.js';
export { AnthropicProvider } from './anthropic.js';
export { NemotronProvider } from './nemotron.js';
export { OllamaProvider } from './ollama.js';

import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';

// Provider registry
export const providers = new Map();

// Register default providers
export function registerProvider(name, provider) {
    providers.set(name, provider);
    return provider;
}

export function getProvider(name) {
    return providers.get(name);
}

export function createProvider(type, options = {}) {
    switch (type.toLowerCase()) {
        case 'openai':
            return new OpenAIProvider(options);
        case 'anthropic':
            return new AnthropicProvider(options);
        default:
            throw new Error(`Unknown provider type: ${type}`);
    }
}

// Initialize default providers
registerProvider('openai', createProvider('openai'));
registerProvider('anthropic', createProvider('anthropic'));

export default providers;
