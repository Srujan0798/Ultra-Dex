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
let TogetherProvider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("together", {
      apiKey: config.apiKey || process.env.TOGETHER_API_KEY,
      baseUrl: config.baseUrl || "https://api.together.xyz/v1",
      defaultModel: config.defaultModel || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      embeddingModel: config.embeddingModel || "togethercomputer/m2-bert-80M-8k-retrieval",
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders
    });
  }
};
TogetherProvider = __decorateClass([
  singleton()
], TogetherProvider);
var together_default = TogetherProvider;
export {
  TogetherProvider,
  together_default as default
};
