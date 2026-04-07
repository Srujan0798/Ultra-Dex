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
let DeepSeekProvider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("deepseek", {
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY,
      baseUrl: config.baseUrl || "https://api.deepseek.com/v1",
      defaultModel: config.defaultModel || "deepseek-chat",
      embeddingModel: config.embeddingModel || "text-embedding-3-small",
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders
    });
  }
};
DeepSeekProvider = __decorateClass([
  singleton()
], DeepSeekProvider);
var deepseek_default = DeepSeekProvider;
export {
  DeepSeekProvider,
  deepseek_default as default
};
