# Universal AI Provider Interface Specification

> **Version:** 6.0.0  
> **Status:** REQUIRED - All providers MUST conform to this specification  
> **Last Updated:** 2026-02-12

## Overview

This document defines the foundational specification that ALL current and future AI providers in Ultra-Dex must implement. It ensures consistency, interchangeability, and reliability across the entire provider ecosystem.

## Design Principles

1. **Consistency**: All providers expose the same interface
2. **Resilience**: Graceful degradation and proper error handling
3. **Observability**: Built-in metrics and logging hooks
4. **Extensibility**: Easy to add new capabilities
5. **Interoperability**: Providers are swappable without code changes

## Required Methods

### 1. `chat(messages, opts)` → Promise&lt;ChatResponse&gt;

Execute a chat completion request.

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string; // Override default model
  temperature?: number; // 0.0 - 2.0
  maxTokens?: number; // Maximum tokens to generate
  topP?: number; // Nucleus sampling
  tools?: Tool[]; // Available tools/functions
  toolChoice?: 'auto' | 'none' | ToolChoice;
  timeoutMs?: number; // Request timeout
  signal?: AbortSignal; // Cancellation signal
}

interface ChatResponse {
  content: string; // Generated text
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string; // Actual model used
  latencyMs?: number; // Response time
  finishReason?: 'stop' | 'length' | 'tool_calls' | string;
}
```

**Implementation Requirements:**

- Must handle message normalization internally
- Must track and return accurate token usage
- Must measure and include latency
- Must propagate provider-specific errors with context

### 2. `stream(messages, opts)` → AsyncIterable&lt;StreamChunk&gt;

Execute a streaming chat completion request.

```typescript
interface StreamChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string; // Text content (for 'text' type)
  toolCall?: ToolCall; // Tool call data (for 'tool_call' type)
  usage?: TokenUsage; // Final usage stats (on 'done')
  error?: ProviderError; // Error details (for 'error' type)
}
```

**Implementation Requirements:**

- Must yield chunks as they arrive from the provider
- Must handle SSE (Server-Sent Events) parsing
- Must yield a final 'done' chunk
- Must handle stream interruptions gracefully

### 3. `embed(text)` → Promise&lt;EmbedResponse&gt;

Generate embeddings for text.

```typescript
interface EmbedResponse {
  embedding: number[]; // Vector representation
  dimensions: number; // Vector dimension count
  model?: string; // Embedding model used
}
```

**Implementation Requirements:**

- Must return normalized float array
- Dimensions must be consistent for the model
- Must handle batch embedding if supported
- May throw if provider doesn't support embeddings

### 4. `complete(prompt, opts)` → Promise&lt;ChatResponse&gt;

Legacy completion interface (optional but recommended).

**Default Implementation:**

```javascript
async complete(prompt, opts) {
  return this.chat([{ role: 'user', content: prompt }], opts);
}
```

## Optional Methods

### 5. `vision(image, prompt, opts)` → Promise&lt;ChatResponse&gt;

Vision/multimodal support.

```typescript
interface VisionOptions extends ChatOptions {
  imageFormat?: 'url' | 'base64' | 'bytes';
  detail?: 'low' | 'high' | 'auto';
}
```

### 6. `code(prompt, language, opts)` → Promise&lt;CodeResponse&gt;

Code-specific generation with structured output.

```typescript
interface CodeResponse extends ChatResponse {
  code: string;
  language: string;
  explanation?: string;
}
```

### 7. `reasoning(prompt, steps, opts)` → Promise&lt;ReasoningResponse&gt;

Chain-of-thought reasoning with intermediate steps.

```typescript
interface ReasoningResponse extends ChatResponse {
  reasoning: string; // Step-by-step reasoning
  conclusion: string; // Final answer
  confidence?: number; // 0.0 - 1.0
}
```

### 8. `functionCalling(messages, tools, opts)` → Promise&lt;ToolResponse&gt;

Structured tool/function calling.

```typescript
interface ToolResponse extends ChatResponse {
  toolCalls: ToolCall[];
  toolResults?: ToolResult[];
}
```

## Configuration Schema

All providers must accept this configuration structure:

```typescript
interface ProviderConfig {
  // Required
  apiKey: string; // Authentication key

  // Optional with defaults
  baseUrl?: string; // API endpoint (provider-specific default)
  defaultModel?: string; // Default model for chat
  embeddingModel?: string; // Default model for embeddings
  maxRetries?: number; // Maximum retry attempts (default: 3)
  timeoutMs?: number; // Default timeout in ms (default: 45000)

  // Advanced
  rateLimit?: {
    rpm?: number; // Requests per minute
    tpm?: number; // Tokens per minute
  };
  extraHeaders?: Record<string, string>; // Custom headers
}
```

## Response Contract

All successful responses must include:

```typescript
interface BaseResponse {
  content: string; // Primary response content
  usage: {
    inputTokens: number; // Prompt tokens consumed
    outputTokens: number; // Completion tokens generated
    totalCost?: number; // Estimated cost in USD (optional)
  };
  model: string; // Model identifier used
  latencyMs: number; // Round-trip time
  provider: string; // Provider name
  timestamp: string; // ISO 8601 timestamp
}
```

## Error Contract

All errors must be thrown as `ProviderError`:

```typescript
class ProviderError extends Error {
  constructor(
    provider: string,
    message: string,
    options: {
      code: string; // Error code
      status?: number; // HTTP status if applicable
      retryable?: boolean; // Can be retried
      retryAfterMs?: number; // Suggested retry delay
      cause?: Error; // Original error
    }
  );
}
```

### Standard Error Codes

| Code               | Description                       | Retryable |
| ------------------ | --------------------------------- | --------- |
| `INVALID_CONFIG`   | Missing or invalid configuration  | No        |
| `AUTH_FAILED`      | Authentication failed             | No        |
| `RATE_LIMITED`     | Rate limit exceeded               | Yes       |
| `QUOTA_EXCEEDED`   | Account quota exhausted           | No        |
| `TIMEOUT`          | Request timed out                 | Yes       |
| `SERVER_ERROR`     | Provider server error (5xx)       | Yes       |
| `INVALID_REQUEST`  | Malformed request (4xx)           | No        |
| `CONTENT_FILTERED` | Content blocked by safety filters | No        |
| `UNKNOWN`          | Unclassified error                | Maybe     |

## Streaming Protocol

SSE (Server-Sent Events) format:

```
data: {"type":"text","content":"Hello"}

data: {"type":"text","content":" world"}

data: {"type":"done","usage":{"inputTokens":10,"outputTokens":2}}
```

**Requirements:**

- Each chunk is a JSON object
- Must handle `data: [DONE]` or similar termination markers
- Must gracefully handle partial/invalid JSON
- Must support cancellation via AbortSignal

## Rate Limiting

Providers should implement token bucket rate limiting:

```typescript
interface RateLimiter {
  checkLimit(cost: number): boolean;
  waitIfNeeded(cost: number): Promise<void>;
  getStatus(): {
    remaining: number;
    resetAt: Date;
    limit: number;
  };
}
```

**Default Limits (configurable):**

- RPM: 60 (requests per minute)
- TPM: 100,000 (tokens per minute)

## Retry Strategy

Default retry configuration:

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  jitter: true, // Add randomness to prevent thundering herd

  // Don't retry these status codes
  nonRetryableStatusCodes: [400, 401, 403, 404, 422],

  // Don't retry these error codes
  nonRetryableErrors: ['INVALID_CONFIG', 'AUTH_FAILED', 'CONTENT_FILTERED'],
};
```

**Backoff Formula:**

```
delay = min(initialDelay * (multiplier ^ attempt), maxDelay)
if (jitter) delay += random(0, delay * 0.1)
```

## Provider Implementation Template

```javascript
export class MyProvider {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.MY_API_KEY,
      baseUrl: config.baseUrl || 'https://api.example.com/v1',
      defaultModel: config.defaultModel || 'default-model',
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 45000,
    };

    if (!this.config.apiKey) {
      throw new ProviderError('myprovider', 'API key is required', {
        code: 'INVALID_CONFIG',
      });
    }

    this.name = 'myprovider';
    this.metrics = { requests: 0, errors: 0 };
  }

  async chat(messages, opts = {}) {
    const startTime = Date.now();
    // Implementation
  }

  async *stream(messages, opts = {}) {
    // Implementation
  }

  async embed(text) {
    // Implementation or throw
  }
}
```

## Validation Checklist

Before submitting a new provider:

- [ ] Implements all required methods
- [ ] Accepts standard config schema
- [ ] Returns proper response contract
- [ ] Throws ProviderError with correct codes
- [ ] Implements retry logic (or uses shared utility)
- [ ] Supports cancellation via AbortSignal
- [ ] Includes latency tracking
- [ ] Handles rate limits appropriately
- [ ] Has comprehensive error messages
- [ ] Includes provider name in errors
- [ ] Supports streaming if provider allows
- [ ] Handles embedding (or throws clear error)

## Version History

| Version | Date       | Changes                                |
| ------- | ---------- | -------------------------------------- |
| 6.0.0   | 2026-02-12 | Initial specification for Ultra-Dex v6 |

## References

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic API Reference](https://docs.anthropic.com/claude/reference)
- [Google Gemini API](https://ai.google.dev/api)
- [Mistral API Reference](https://docs.mistral.ai/api)

---

**Note:** This specification is the FOUNDATION of the Ultra-Dex provider ecosystem. Any deviation must be documented and approved through the RFC process.
