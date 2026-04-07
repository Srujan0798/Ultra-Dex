var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { OpenAICompatibleProvider } from './openai-compatible-provider.js';
let MistralProvider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("mistral", {
      apiKey: config.apiKey || process.env.MISTRAL_API_KEY,
      baseUrl: config.baseUrl || "https://api.mistral.ai/v1",
      defaultModel: config.defaultModel || "mistral-large-latest",
      embeddingModel: config.embeddingModel || "mistral-embed",
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders
    });
  }
};
MistralProvider = __decorateClass([
  singleton()
], MistralProvider);
var mistral_default = MistralProvider;
export {
  MistralProvider,
  mistral_default as default
};
