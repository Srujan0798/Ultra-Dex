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
  normalizeUsage,
  postJson,
  ProviderError,
  streamSse
} from './http-utils.js';
function toGeminiContents(messages = []) {
  return messages.filter((message) => message.role !== "system").map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: typeof message.content === "string" ? message.content : JSON.stringify(message.content)
      }
    ]
  }));
}
function buildUsage(payload = {}) {
  return normalizeUsage({
    promptTokenCount: payload?.usageMetadata?.promptTokenCount,
    candidatesTokenCount: payload?.usageMetadata?.candidatesTokenCount,
    total_tokens: payload?.usageMetadata?.totalTokenCount
  });
}
function buildBaseUrl(config) {
  return (config.baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
}
let GoogleProvider = class {
  constructor(config = {}) {
    this.providerName = "google";
    this.config = {
      apiKey: config.apiKey || process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_KEY,
      baseUrl: buildBaseUrl(config),
      defaultModel: config.defaultModel || "gemini-2.5-pro",
      embeddingModel: config.embeddingModel || "text-embedding-004",
      timeoutMs: config.timeoutMs || 45e3
    };
    if (!this.config.apiKey) {
      throw new ProviderError(this.providerName, "apiKey is required", { code: "INVALID_CONFIG" });
    }
  }
  modelPath(model) {
    return model.startsWith("models/") ? model : `models/${model}`;
  }
  urlFor(path) {
    const keyQuery = `key=${encodeURIComponent(this.config.apiKey)}`;
    return `${this.config.baseUrl}${path.includes("?") ? `${path}&${keyQuery}` : `${path}?${keyQuery}`}`;
  }
  async chat(messages, opts = {}) {
    const model = opts.model || this.config.defaultModel;
    const url = this.urlFor(`/${this.modelPath(model)}:generateContent`);
    const payload = await postJson(this.providerName, url, {
      timeoutMs: opts.timeoutMs || this.config.timeoutMs,
      signal: opts.signal,
      body: {
        contents: toGeminiContents(messages),
        systemInstruction: opts.system ? { parts: [{ text: opts.system }] } : void 0,
        generationConfig: {
          temperature: opts.temperature,
          maxOutputTokens: opts.maxTokens,
          topP: opts.topP
        }
      }
    });
    const content = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("") || "";
    return {
      content,
      usage: buildUsage(payload),
      model
    };
  }
  async stream(messages, opts = {}) {
    const model = opts.model || this.config.defaultModel;
    const url = this.urlFor(`/${this.modelPath(model)}:streamGenerateContent?alt=sse`);
    return streamSse(this.providerName, url, {
      timeoutMs: opts.timeoutMs || this.config.timeoutMs,
      signal: opts.signal,
      body: {
        contents: toGeminiContents(messages),
        systemInstruction: opts.system ? { parts: [{ text: opts.system }] } : void 0,
        generationConfig: {
          temperature: opts.temperature,
          maxOutputTokens: opts.maxTokens,
          topP: opts.topP
        }
      }
    });
  }
  async embed(text, opts = {}) {
    const model = opts.model || this.config.embeddingModel;
    const url = this.urlFor(`/${this.modelPath(model)}:embedContent`);
    try {
      const payload = await postJson(this.providerName, url, {
        timeoutMs: opts.timeoutMs || this.config.timeoutMs,
        signal: opts.signal,
        body: {
          model: this.modelPath(model),
          content: {
            parts: [{ text }]
          }
        }
      });
      const embedding = payload?.embedding?.values;
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
GoogleProvider = __decorateClass([
  singleton()
], GoogleProvider);
var google_default = GoogleProvider;
export {
  GoogleProvider,
  google_default as default
};
