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
let KimiProvider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("kimi", {
      apiKey: config.apiKey || process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY,
      baseUrl: config.baseUrl || "https://api.moonshot.ai/v1",
      defaultModel: config.defaultModel || "moonshot-v1-128k",
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders
    });
  }
  async embed(text, opts = {}) {
    throw new Error("Kimi: Embedding API not currently supported");
  }
};
KimiProvider = __decorateClass([
  singleton()
], KimiProvider);
var kimi_default = KimiProvider;
export {
  KimiProvider,
  kimi_default as default
};
