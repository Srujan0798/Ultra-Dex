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
let GroqProvider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("groq", {
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
      baseUrl: config.baseUrl || "https://api.groq.com/openai/v1",
      defaultModel: config.defaultModel || "llama-3.3-70b-versatile",
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders
    });
  }
  async embed(text, opts = {}) {
    throw new Error("Groq: Embedding API not currently supported");
  }
};
GroqProvider = __decorateClass([
  singleton()
], GroqProvider);
var groq_default = GroqProvider;
export {
  GroqProvider,
  groq_default as default
};
