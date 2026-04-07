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
let YiProvider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("yi", {
      apiKey: config.apiKey || process.env.YI_API_KEY,
      baseUrl: config.baseUrl || "https://api.lingyiwanwu.com/v1",
      defaultModel: config.defaultModel || "yi-large",
      embeddingModel: config.embeddingModel || "text-embedding-3-small",
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders
    });
  }
};
YiProvider = __decorateClass([
  singleton()
], YiProvider);
var yi_default = YiProvider;
export {
  YiProvider,
  yi_default as default
};
