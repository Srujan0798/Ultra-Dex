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
let LlamaProvider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("llama", {
      apiKey: config.apiKey || process.env.OLLAMA_API_KEY || "ollama",
      baseUrl: config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
      defaultModel: config.defaultModel || "llama3.2",
      embeddingModel: config.embeddingModel || "nomic-embed-text",
      timeoutMs: config.timeoutMs || 9e4,
      extraHeaders: config.extraHeaders
    });
  }
};
LlamaProvider = __decorateClass([
  singleton()
], LlamaProvider);
var llama_default = LlamaProvider;
export {
  LlamaProvider,
  llama_default as default
};
