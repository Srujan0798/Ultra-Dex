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
let DeepSeekR1Provider = class extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super("deepseek-r1", {
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY,
      baseUrl: config.baseUrl || "https://api.deepseek.com/v1",
      defaultModel: config.defaultModel || "deepseek-r1",
      embeddingModel: config.embeddingModel || "text-embedding-3-small",
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders
    });
  }
  async chainOfThought(prompt, opts = {}) {
    return this.chat(
      [
        {
          role: "system",
          content: "Think step by step and provide a concise reasoning trace followed by the final answer."
        },
        { role: "user", content: prompt }
      ],
      opts
    );
  }
};
DeepSeekR1Provider = __decorateClass([
  singleton()
], DeepSeekR1Provider);
var deepseek_r1_default = DeepSeekR1Provider;
export {
  DeepSeekR1Provider,
  deepseek_r1_default as default
};
