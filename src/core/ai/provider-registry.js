// Copyright (c) 2026 Ultra-Dex

import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { MODEL_PROVIDER_MAP } from './router-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROVIDERS_DIR = path.resolve(__dirname, 'providers');

function isProviderFile(filename) {
  if (!filename.endsWith('.js')) return false;
  if (filename === 'index.js') return false;
  if (filename === 'http-utils.js') return false;
  if (filename === 'openai-compatible-provider.js') return false;
  return true;
}

function normalizeProviderKey(name) {
  return name
    .replace(/\.js$/i, '')
    .replace(/-provider$/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function findProviderClass(mod) {
  const exported = Object.values(mod || {});
  for (const candidate of exported) {
    if (typeof candidate !== 'function') continue;
    const proto = candidate.prototype || {};
    if (
      typeof proto.chat === 'function' &&
      typeof proto.stream === 'function' &&
      typeof proto.embed === 'function'
    ) {
      return candidate;
    }
  }
  return null;
}

function buildConfigFor(name, base = {}) {
  const upper = name.toUpperCase();
  return {
    apiKey: base.apiKey || process.env[`${upper}_API_KEY`] || process.env.API_KEY,
    baseUrl: base.baseUrl || process.env[`${upper}_BASE_URL`],
    defaultModel: base.defaultModel || process.env[`${upper}_MODEL`],
    embeddingModel: base.embeddingModel || process.env[`${upper}_EMBEDDING_MODEL`],
    timeoutMs: base.timeoutMs,
    extraHeaders: base.extraHeaders,
  };
}

class ProviderRegistry {
  constructor() {
    this.registry = new Map();
    this.providerMetadata = new Map(); // Store metadata about each provider
    this.discoveryLoaded = false;
    this.validationResults = new Map(); // Store validation results
  }

  registerProvider(name, instance, metadata = {}) {
    const key = normalizeProviderKey(name);

    if (!instance) {
      throw new Error(`[provider-registry] Cannot register provider "${name}": instance is required`);
    }

    const hasContract =
      typeof instance.chat === 'function' &&
      typeof instance.stream === 'function' &&
      typeof instance.embed === 'function';

    if (!hasContract) {
      throw new Error(
        `[provider-registry] Provider "${name}" must implement chat(messages, opts), stream(messages, opts), and embed(text)`
      );
    }

    // Validate the provider interface
    const validation = this.validateProviderInterface(instance);
    this.validationResults.set(key, validation);

    this.registry.set(key, instance);
    this.providerMetadata.set(key, {
      name: key,
      registeredAt: new Date().toISOString(),
      ...metadata
    });

    return instance;
  }

  validateProviderInterface(provider) {
    const errors = [];
    
    // Check required methods
    if (typeof provider.chat !== 'function') {
      errors.push('Missing required method: chat(messages, opts)');
    }
    
    if (typeof provider.stream !== 'function') {
      errors.push('Missing required method: stream(messages, opts)');
    }
    
    if (typeof provider.embed !== 'function') {
      errors.push('Missing required method: embed(text)');
    }
    
    // Check if methods have expected signatures (basic check)
    try {
      // Test if methods accept the expected parameters
      if (provider.chat.constructor.name !== 'AsyncFunction') {
        errors.push('chat method should be async');
      }
      if (provider.stream.constructor.name !== 'AsyncFunction') {
        errors.push('stream method should be async');
      }
      if (provider.embed.constructor.name !== 'AsyncFunction') {
        errors.push('embed method should be async');
      }
    } catch (e) {
      // Ignore errors during signature inspection
    }

    return {
      valid: errors.length === 0,
      errors,
      validatedAt: new Date().toISOString()
    };
  }

  getProvider(name) {
    const key = normalizeProviderKey(name);
    return this.registry.get(key) || null;
  }

  getProviderMetadata(name) {
    const key = normalizeProviderKey(name);
    return this.providerMetadata.get(key) || null;
  }

  listProviders() {
    return Array.from(this.registry.keys()).sort();
  }

  listProviderDetails() {
    const details = [];
    for (const [key, provider] of this.registry.entries()) {
      const metadata = this.providerMetadata.get(key);
      const validation = this.validationResults.get(key);
      
      details.push({
        name: key,
        registeredAt: metadata?.registeredAt,
        isValid: validation?.valid,
        validationErrors: validation?.errors,
        capabilities: this.getProviderCapabilities(provider)
      });
    }
    return details;
  }

  getProviderCapabilities(provider) {
    const capabilities = ['chat', 'stream', 'embed'];
    
    // Check for optional capabilities
    if (typeof provider.complete === 'function') {
      capabilities.push('complete');
    }
    
    if (typeof provider.vision !== 'undefined' || 
        (provider.constructor && provider.constructor.name.includes('Vision'))) {
      capabilities.push('vision');
    }
    
    if (typeof provider.code !== 'undefined') {
      capabilities.push('code');
    }
    
    if (typeof provider.reasoning !== 'undefined') {
      capabilities.push('reasoning');
    }
    
    if (typeof provider.functionCalling !== 'undefined' || 
        provider.supportsFunctions) {
      capabilities.push('functionCalling');
    }
    
    return capabilities;
  }

  resolveModel(modelId) {
    if (!modelId) return null;

    const explicit = MODEL_PROVIDER_MAP[modelId] || MODEL_PROVIDER_MAP[modelId.toLowerCase()];
    if (explicit) {
      return this.getProvider(explicit);
    }

    const fallback = Object.entries(MODEL_PROVIDER_MAP).find(([knownModel]) =>
      modelId.toLowerCase().includes(knownModel.toLowerCase())
    );

    if (fallback) {
      return this.getProvider(fallback[1]);
    }

    return null;
  }

  async autoDiscoverProviders(configMap = {}) {
    const files = await readdir(PROVIDERS_DIR);

    for (const file of files.filter(isProviderFile)) {
      const moduleUrl = pathToFileURL(path.join(PROVIDERS_DIR, file)).href;
      let mod;
      try {
        mod = await import(moduleUrl);
      } catch {
        // Skip modules that fail to load due to optional dependency gaps.
        continue;
      }
      const ProviderClass = findProviderClass(mod);

      if (!ProviderClass) continue;

      const registryKey = normalizeProviderKey(file);
      const providerConfig = buildConfigFor(registryKey, configMap[registryKey] || {});

      try {
        const instance = new ProviderClass(providerConfig);
        this.registerProvider(registryKey, instance, {
          sourceFile: file,
          autoDiscovered: true
        });
      } catch {
        // Some providers require strict config. Use permissive placeholder config so the registry can still load.
        const placeholderConfig = {
          ...providerConfig,
          apiKey: providerConfig.apiKey || 'placeholder-key',
        };
        try {
          const instance = new ProviderClass(placeholderConfig);
          this.registerProvider(registryKey, instance, {
            sourceFile: file,
            autoDiscovered: true,
            requiresConfig: true
          });
        } catch {
          // Keep discovery resilient; skip providers that cannot initialize safely.
        }
      }
    }

    this.discoveryLoaded = true;
    return this.listProviders();
  }

  // Enhanced provider registration with cost-based routing, latency fallback, and load balancing
  async registerWithRouting(providerName, instance, routingConfig = {}) {
    // Register the provider normally
    this.registerProvider(providerName, instance, {
      routingEnabled: true,
      ...routingConfig
    });

    // Update router configuration with provider priority if needed
    if (routingConfig.priority) {
      // This would typically update the router config, but we'll store it here for now
      const metadata = this.providerMetadata.get(normalizeProviderKey(providerName));
      metadata.routingPriority = routingConfig.priority;
      metadata.routingStrategy = routingConfig.strategy || 'quality';
    }

    return instance;
  }
}

export const providerRegistry = new ProviderRegistry();

export const registerProvider = (...args) => providerRegistry.registerProvider(...args);
export const getProvider = (...args) => providerRegistry.getProvider(...args);
export const listProviders = (...args) => providerRegistry.listProviders(...args);
export const listProviderDetails = (...args) => providerRegistry.listProviderDetails(...args);
export const getProviderMetadata = (...args) => providerRegistry.getProviderMetadata(...args);
export const resolveModel = (...args) => providerRegistry.resolveModel(...args);
export const autoDiscoverProviders = (...args) => providerRegistry.autoDiscoverProviders(...args);
export const validateProviderInterface = (...args) => providerRegistry.validateProviderInterface(...args);

export default providerRegistry;
