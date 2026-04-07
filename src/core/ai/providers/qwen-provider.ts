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
let QwenProvider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("qwen", {
      apiKey: config.apiKey || process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY,
      baseUrl: config.baseUrl || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      defaultModel: config.defaultModel || "qwen-plus",
      embeddingModel: config.embeddingModel || "text-embedding-v3",
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders
    });
  }
};
QwenProvider = __decorateClass([
  singleton()
], QwenProvider);
var qwen_provider_default = QwenProvider;
export {
  QwenProvider,
  qwen_provider_default as default
};
