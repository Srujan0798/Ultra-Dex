---
sidebar_position: 3
---

# AI Providers

Ultra-Dex supports **16+ AI providers** through a unified interface. Every provider implements `chat()`, `stream()`, and `embed()`.

## Core Providers (10)

| Provider | Module | Default Model | Speciality |
|---|---|---|---|
| OpenAI | `openai.js` | gpt-4-turbo | General-purpose, embeddings |
| Anthropic | `anthropic.js` | claude-3-sonnet | Long context, safety |
| Google | `google.js` | gemini-pro | Multimodal, embeddings |
| Mistral | `mistral.js` | mistral-large | European, open-weight |
| Groq | `groq.js` | llama-3.1-70b | Fastest inference |
| DeepSeek | `deepseek.js` | deepseek-chat | Chain-of-thought reasoning |
| Cohere | `cohere.js` | command-r-plus | RAG, embeddings |
| Together | `together.js` | meta-llama/Llama-3 | 100+ open models |
| Fireworks | `fireworks.js` | llama-v3p1-70b | High-speed inference |
| Perplexity | `perplexity.js` | llama-3.1-sonar | Search-augmented |

## New-Gen Providers (6)

| Provider | Module | Speciality |
|---|---|---|
| Kimi (Moonshot) | `kimi.js` | 128K long-context |
| Qwen (DashScope) | `qwen-provider.js` | Alibaba multimodal |
| Yi (01.AI) | `yi.js` | Efficient reasoning |
| DeepSeek R1 | `deepseek-r1.js` | Chain-of-thought trace |
| OpenClaw | `openclaw.js` | Open-source agent |
| ZhipuAI (GLM-4) | `zhipu.js` | Chinese-English bilingual |

## Usage

```javascript
import { createProvider } from 'ultra-dex/providers';

// Dynamic lazy loading
const openai = await createProvider('openai');
const result = await openai.chat([
  { role: 'user', content: 'Explain quantum computing' }
]);

// Streaming
for await (const chunk of openai.stream(messages)) {
  process.stdout.write(chunk.content);
}

// Embeddings  
const { embedding } = await openai.embed('Hello world');
```

## Adding a Custom Provider

See the [Extension Guide](/docs/extensions) for creating your own provider adapter.
