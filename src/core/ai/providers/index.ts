import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { NemotronProvider } from './nemotron.js';
import { OllamaProvider } from './ollama.js';
import { OpenAIProvider as OpenAIProvider2 } from './openai.js';
import { AnthropicProvider as AnthropicProvider2 } from './anthropic.js';
const providers = /* @__PURE__ */ new Map();
function registerProvider(name, provider) {
  providers.set(name, provider);
  return provider;
}
function getProvider(name) {
  return providers.get(name);
}
function createProvider(type, options = {}) {
  switch (type.toLowerCase()) {
    case "openai":
      return new OpenAIProvider2(options);
    case "anthropic":
      return new AnthropicProvider2(options);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
registerProvider("openai", createProvider("openai"));
registerProvider("anthropic", createProvider("anthropic"));
var providers_default = providers;
export {
  AnthropicProvider,
  NemotronProvider,
  OllamaProvider,
  OpenAIProvider,
  createProvider,
  providers_default as default,
  getProvider,
  providers,
  registerProvider
};
