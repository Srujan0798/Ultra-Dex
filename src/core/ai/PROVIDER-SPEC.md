# Ultra-Dex Universal Provider Interface Spec (v6.0.0)

This document defines the required contract for **all current and future AI providers** used by Ultra-Dex.

## 1. Required Interface

Every provider implementation MUST expose the following async methods:

```js
class Provider {
  constructor(config) {}

  async chat(messages, opts = {}) {}
  async stream(messages, opts = {}) {}
  async embed(text) {}
  async complete(prompt, opts = {}) {}
}
```

### 1.1 `chat(messages, opts)`

- Input:
  - `messages`: `Array<{ role: 'system'|'user'|'assistant'|'tool', content: string | object }>`
  - `opts`: provider-specific overrides
- Output:

```js
{
  content: string,
  usage: {
    inputTokens: number,
    outputTokens: number,
    totalCost?: number
  },
  model: string,
  latencyMs?: number
}
```

### 1.2 `stream(messages, opts)`

- Input format same as `chat`
- Output: `AsyncIterable<StreamChunk>`

### 1.3 `embed(text)`

- Input: `text: string`
- Output:

```js
{
  embedding: number[],
  dimensions: number
}
```

### 1.4 `complete(prompt, opts)`

- Convenience wrapper over `chat`
- Input:
  - `prompt: string`
  - `opts: object`
- Output: same contract as `chat`

## 2. Optional Interface

Providers MAY implement the following specialized methods:

```js
async vision(image, prompt)
async code(prompt, language)
async reasoning(prompt, steps)
async functionCalling(messages, tools)
```

### Optional method expectations

- `vision(image, prompt)`: multimodal image+text analysis
- `code(prompt, language)`: code generation tuned for target language
- `reasoning(prompt, steps)`: explicit multi-step reasoning execution
- `functionCalling(messages, tools)`: tool invocation or structured function outputs

## 3. Provider Config Schema

Every provider constructor MUST accept a plain object compatible with:

```js
{
  apiKey: string,
  baseUrl: string,
  defaultModel: string,
  maxRetries: number,
  timeout: number,
  rateLimit: {
    rpm: number,
    tpm: number,
    burst?: number
  }
}
```

### Config rules

- `apiKey` MAY be omitted for local providers.
- `baseUrl` SHOULD default to provider-native endpoint.
- `defaultModel` MUST be defined (constructor or env fallback).
- `maxRetries` default: `3`
- `timeout` default: `45000` ms

## 4. Response Contract

All non-streaming generation methods MUST normalize to:

```js
{
  content: string,
  usage: {
    inputTokens: number,
    outputTokens: number,
    totalCost: number
  },
  model: string,
  latencyMs: number
}
```

### Cost normalization

- `totalCost` is computed from provider/model token rates.
- If exact provider cost is unavailable, set `totalCost: 0` and attach telemetry warning.

## 5. Error Contract

Provider errors MUST normalize to:

```js
{
  code: string,
  message: string,
  provider: string,
  retryable: boolean,
  retryAfterMs?: number
}
```

### Error code guidance

- `INVALID_CONFIG`
- `AUTH_ERROR`
- `RATE_LIMITED`
- `HTTP_ERROR`
- `NETWORK_ERROR`
- `INVALID_RESPONSE`
- `TIMEOUT`

## 6. Streaming Protocol

All `stream(...)` methods MUST return an `AsyncIterable` of:

```js
{
  type: 'text' | 'tool_call' | 'done',
  content: string | object,
  raw?: any
}
```

### Stream semantics

- `text`: partial model tokens or text deltas
- `tool_call`: tool/function invocation chunks
- `done`: terminal chunk emitted exactly once

## 7. Rate Limiting

Providers SHOULD implement token bucket control with configurable RPM/TPM:

- RPM: requests per minute
- TPM: tokens per minute
- Optional burst allowance

Recommended bucket behavior:

- Reject or queue when both budget pools are exhausted
- Include retry metadata in error payload

## 8. Retry Strategy

Required retry policy:

- Exponential backoff with jitter
- Max retries: `3`
- Skip retries for client 4xx errors (except `429`)
- Retry on:
  - `429`
  - `5xx`
  - network failures/timeouts

Recommended schedule:

- base delay: `250ms`
- multiplier: `2x`
- jitter: `0-100ms`

## 9. Compliance Checklist

A provider is **spec-compliant** when it satisfies all:

- [ ] Implements required methods: `chat`, `stream`, `embed`, `complete`
- [ ] Accepts config schema
- [ ] Returns normalized response contract
- [ ] Emits normalized error contract
- [ ] Streams `text`/`tool_call`/`done` events
- [ ] Honors retry and rate-limit policies

## 10. Migration Note

Legacy providers with custom result shapes MUST be wrapped by an adapter layer that normalizes:

- message format
- usage fields
- error fields
- streaming frames

No provider should bypass this contract in production codepaths.
