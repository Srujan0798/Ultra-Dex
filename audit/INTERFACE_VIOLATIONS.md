# AI Provider Interface Violation Report

This report documents inconsistencies and violations of the `BaseProvider` interface across the AI provider adapters in `src/services/ai-providers/`.

## 1. Unified Interface Compliance

The `BaseProvider` defines the following required methods:
- `chat(messages, options)`
- `stream(messages, options)`
- `embed(input, options)`

### Violations
| Provider | Violation | Severity | Details |
|----------|-----------|----------|---------|
| `Router` | Method Naming | High | Implements `streamChat()` instead of `stream()`. |
| `Router` | Module Format | Medium | Uses CommonJS (`module.exports`) while all other providers use ESM (`export class`). |

### Embeddings Support Gaps
The following providers strictly follow the interface by implementing `embed()` but throwing an error, indicating a lack of capability rather than an interface violation. However, it affects uniformity.
- `Anthropic`
- `DeepSeek`
- `Groq`
- `Perplexity`

**Note:** `Claude4` implements `embed()` by delegating to a different provider (Voyage AI), which is a behavior quirk.

## 2. Streaming Response Normalization

Expected streaming yield format:
1. `{ type: 'content', content: string }`
2. `{ type: 'done', finishReason: string }` (at the end)

### Violations (Missing 'done' event)
The following providers stream content but fail to yield a final `done` event with the finish reason:
- `Claude4`
- `Gemini25`
- `GPT5`
- `Grok3`
- `Llama4`

This makes it difficult for consumers to know when the stream has ended reliably or why it stopped.

## 3. Provider-Specific Quirks & Leaks

| Provider | Quirk | Description |
|----------|-------|-------------|
| `Gemini25`, `Google` | Auth Mechanism | Uses query parameters (`?key=API_KEY`) instead of `Authorization` headers. |
| `Perplexity` | Response Field | Returns `citations` in `chat` response. |
| `DeepSeek`, `GPT5`, `Grok3` | Response Field | Returns `reasoning` field for chain-of-thought models. |
| `Claude4`, `Gemini25` | Response Field | Returns `thinking` field. |
| `Gemini25` | Token Usage | Returns `thinkingTokens` in usage object. |
| `GPT5` | Token Usage | Returns `reasoningTokens` in usage object. |

## 4. Recommendations

1. **Standardize Router**: Refactor `Router` to ESM and rename `streamChat` to `stream`.
2. **Fix Streaming**: Update `Claude4`, `Gemini25`, `GPT5`, `Grok3`, and `Llama4` to yield `{ type: 'done' }` events.
3. **Normalize Usage**: Ensure all providers return a consistent `usage` object structure, potentially mapping `thinkingTokens`/`reasoningTokens` to a generic `reasoningTokens` field if needed, or keeping them as extensions.
