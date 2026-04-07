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
import {
  deterministicEmbedding,
  joinUrl,
  normalizeMessages,
  normalizeUsage,
  postJson,
  ProviderError,
  streamSse
} from './http-utils.js';
let OpenAICompatibleProvider = class {
  constructor(providerName, config = {}, defaults = {}) {
    this.providerName = providerName;
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || defaults.baseUrl,
      defaultModel: config.defaultModel || defaults.defaultModel,
      embeddingModel: config.embeddingModel || defaults.embeddingModel || "text-embedding-3-small",
      timeoutMs: config.timeoutMs || defaults.timeoutMs || 45e3,
      extraHeaders: config.extraHeaders || {}
    };
    if (!this.config.baseUrl) {
      throw new ProviderError(this.providerName, "baseUrl is required", { code: "INVALID_CONFIG" });
    }
  }
  get authHeaders() {
    const headers = { ...this.config.extraHeaders };
    if (this.config.apiKey) {
      headers.authorization = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }
  resolveModel(opts = {}) {
    return opts.model || this.config.defaultModel;
  }
  async chat(messages, opts = {}) {
    const model = this.resolveModel(opts);
    if (!model) {
      throw new ProviderError(this.providerName, "defaultModel is required for chat", {
        code: "INVALID_CONFIG"
      });
    }
    const payload = await postJson(this.providerName, joinUrl(this.config.baseUrl, "/chat/completions"), {
      headers: this.authHeaders,
      timeoutMs: opts.timeoutMs || this.config.timeoutMs,
      signal: opts.signal,
      body: {
        model,
        messages: normalizeMessages(messages),
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        top_p: opts.topP,
        tools: opts.tools,
        tool_choice: opts.toolChoice,
        stream: false
      }
    });
    const content = payload?.choices?.[0]?.message?.content || "";
    return {
      content,
      usage: normalizeUsage(payload?.usage),
      model: payload?.model || model
    };
  }
  async stream(messages, opts = {}) {
    const model = this.resolveModel(opts);
    if (!model) {
      throw new ProviderError(this.providerName, "defaultModel is required for stream", {
        code: "INVALID_CONFIG"
      });
    }
    return streamSse(this.providerName, joinUrl(this.config.baseUrl, "/chat/completions"), {
      headers: this.authHeaders,
      timeoutMs: opts.timeoutMs || this.config.timeoutMs,
      signal: opts.signal,
      body: {
        model,
        messages: normalizeMessages(messages),
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        top_p: opts.topP,
        tools: opts.tools,
        tool_choice: opts.toolChoice,
        stream: true
      }
    });
  }
  async embed(text, opts = {}) {
    const model = opts.model || this.config.embeddingModel;
    try {
      const payload = await postJson(this.providerName, joinUrl(this.config.baseUrl, "/embeddings"), {
        headers: this.authHeaders,
        timeoutMs: opts.timeoutMs || this.config.timeoutMs,
        signal: opts.signal,
        body: {
          model,
          input: text
        }
      });
      const embedding = payload?.data?.[0]?.embedding;
      if (!Array.isArray(embedding)) {
        throw new ProviderError(this.providerName, "Invalid embedding response", {
          code: "INVALID_RESPONSE"
        });
      }
      return {
        embedding,
        dimensions: embedding.length
      };
    } catch (error) {
      if (error instanceof ProviderError && error.status && error.status < 500) {
        const fallbackEmbedding = deterministicEmbedding(text);
        return {
          embedding: fallbackEmbedding,
          dimensions: fallbackEmbedding.length
        };
      }
      throw error;
    }
  }
  async complete(prompt, opts = {}) {
    return this.chat([{ role: "user", content: prompt }], opts);
  }
};
OpenAICompatibleProvider = __decorateClass([
  singleton()
], OpenAICompatibleProvider);
export {
  OpenAICompatibleProvider
};
