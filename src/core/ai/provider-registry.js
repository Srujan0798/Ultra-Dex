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
    this.discoveryLoaded = false;
  }

  registerProvider(name, instance) {
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

    this.registry.set(key, instance);
    return instance;
  }

  getProvider(name) {
    const key = normalizeProviderKey(name);
    return this.registry.get(key) || null;
  }

  listProviders() {
    return Array.from(this.registry.keys()).sort();
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
        this.registerProvider(registryKey, instance);
      } catch {
        // Some providers require strict config. Use permissive placeholder config so the registry can still load.
        const placeholderConfig = {
          ...providerConfig,
          apiKey: providerConfig.apiKey || 'placeholder-key',
        };
        try {
          const instance = new ProviderClass(placeholderConfig);
          this.registerProvider(registryKey, instance);
        } catch {
          // Keep discovery resilient; skip providers that cannot initialize safely.
        }
      }
    }

    this.discoveryLoaded = true;
    return this.listProviders();
  }
}

export const providerRegistry = new ProviderRegistry();

export const registerProvider = (...args) => providerRegistry.registerProvider(...args);
export const getProvider = (...args) => providerRegistry.getProvider(...args);
export const listProviders = (...args) => providerRegistry.listProviders(...args);
export const resolveModel = (...args) => providerRegistry.resolveModel(...args);
export const autoDiscoverProviders = (...args) => providerRegistry.autoDiscoverProviders(...args);

export default providerRegistry;
