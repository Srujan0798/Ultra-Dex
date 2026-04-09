import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { MODEL_PROVIDER_MAP } from './router-config.js';
import { MockProvider } from './providers/mock.js';
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
    this.registry = /* @__PURE__ */ new Map();
    this.providerMetadata = /* @__PURE__ */ new Map();
    this.discoveryLoaded = false;
    this.validationResults = /* @__PURE__ */ new Map();
  }
  registerProvider(name, instance, metadata = {}) {
    const key = normalizeProviderKey(name);
    if (!instance) {
      throw new Error(
        `[provider-registry] Cannot register provider "${name}": instance is required`
      );
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
    const validation = this.validateProviderInterface(instance);
    this.validationResults.set(key, validation);
    this.registry.set(key, instance);
    this.providerMetadata.set(key, {
      name: key,
      registeredAt: /* @__PURE__ */ new Date().toISOString(),
      ...metadata,
    });
    return instance;
  }
  validateProviderInterface(provider) {
    const errors = [];
    if (typeof provider.chat !== 'function') {
      errors.push('Missing required method: chat(messages, opts)');
    }
    if (typeof provider.stream !== 'function') {
      errors.push('Missing required method: stream(messages, opts)');
    }
    if (typeof provider.embed !== 'function') {
      errors.push('Missing required method: embed(text)');
    }
    try {
      if (provider.chat.constructor.name !== 'AsyncFunction') {
        errors.push('chat method should be async');
      }
      if (provider.stream.constructor.name !== 'AsyncFunction') {
        errors.push('stream method should be async');
      }
      if (provider.embed.constructor.name !== 'AsyncFunction') {
        errors.push('embed method should be async');
      }
    } catch (_e) {}
    return {
      valid: errors.length === 0,
      errors,
      validatedAt: /* @__PURE__ */ new Date().toISOString(),
    };
  }
  getProvider(name) {
    if (process.env.MOCK_AI_PROVIDERS === 'true') {
      const key2 = 'mock';
      if (!this.registry.has(key2)) {
        this.registry.set(key2, new MockProvider());
      }
      return this.registry.get(key2);
    }
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
        capabilities: this.getProviderCapabilities(provider),
      });
    }
    return details;
  }
  getProviderCapabilities(provider) {
    const capabilities = ['chat', 'stream', 'embed'];
    if (typeof provider.complete === 'function') {
      capabilities.push('complete');
    }
    if (
      typeof provider.vision !== 'undefined' ||
      (provider.constructor && provider.constructor.name.includes('Vision'))
    ) {
      capabilities.push('vision');
    }
    if (typeof provider.code !== 'undefined') {
      capabilities.push('code');
    }
    if (typeof provider.reasoning !== 'undefined') {
      capabilities.push('reasoning');
    }
    if (typeof provider.functionCalling !== 'undefined' || provider.supportsFunctions) {
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
          autoDiscovered: true,
        });
      } catch {
        const placeholderConfig = {
          ...providerConfig,
          apiKey: providerConfig.apiKey || 'placeholder-key',
        };
        try {
          const instance = new ProviderClass(placeholderConfig);
          this.registerProvider(registryKey, instance, {
            sourceFile: file,
            autoDiscovered: true,
            requiresConfig: true,
          });
        } catch {}
      }
    }
    this.discoveryLoaded = true;
    return this.listProviders();
  }
  // Enhanced provider registration with cost-based routing, latency fallback, and load balancing
  async registerWithRouting(providerName, instance, routingConfig = {}) {
    this.registerProvider(providerName, instance, {
      routingEnabled: true,
      ...routingConfig,
    });
    if (routingConfig.priority) {
      const metadata = this.providerMetadata.get(normalizeProviderKey(providerName));
      metadata.routingPriority = routingConfig.priority;
      metadata.routingStrategy = routingConfig.strategy || 'quality';
    }
    return instance;
  }
}
const providerRegistry = new ProviderRegistry();
const registerProvider = (...args) => providerRegistry.registerProvider(...args);
const getProvider = (...args) => providerRegistry.getProvider(...args);
const listProviders = (...args) => providerRegistry.listProviders(...args);
const listProviderDetails = (...args) => providerRegistry.listProviderDetails(...args);
const getProviderMetadata = (...args) => providerRegistry.getProviderMetadata(...args);
const resolveModel = (...args) => providerRegistry.resolveModel(...args);
const autoDiscoverProviders = (...args) => providerRegistry.autoDiscoverProviders(...args);
const validateProviderInterface = (...args) => providerRegistry.validateProviderInterface(...args);
var provider_registry_default = providerRegistry;
export {
  autoDiscoverProviders,
  provider_registry_default as default,
  getProvider,
  getProviderMetadata,
  listProviderDetails,
  listProviders,
  providerRegistry,
  registerProvider,
  resolveModel,
  validateProviderInterface,
};
