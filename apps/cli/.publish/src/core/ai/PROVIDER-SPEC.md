# Universal AI Provider Interface Specification

This document defines the universal interface that all AI providers in Ultra-Dex must implement to ensure consistent behavior across different AI services.

## Required Methods

### `chat(messages, opts)`

Asynchronously sends a chat message to the AI provider and returns a response.

**Parameters:**

- `messages` (Array): Array of message objects with `role` and `content` properties
- `opts` (Object): Options object with the following possible properties:
  - `model` (string): Model identifier to use
  - `temperature` (number): Temperature for response randomness (0.0-2.0)
  - `maxTokens` (number): Maximum tokens in response
  - `topP` (number): Top-P sampling parameter
  - `signal` (AbortSignal): Abort signal for cancellation
  - `timeoutMs` (number): Request timeout in milliseconds

**Returns:**

```javascript
{
  content: string,           // The AI response content
  usage: {
    inputTokens: number,     // Number of input tokens processed
    outputTokens: number,    // Number of output tokens generated
    totalTokens: number      // Total tokens (input + output)
  },
  model: string,             // Model that generated the response
  provider: string           // Provider identifier
}
```

### `stream(messages, opts)`

Asynchronously streams a chat response from the AI provider, returning an async iterable.

**Parameters:**

- `messages` (Array): Array of message objects with `role` and `content` properties
- `opts` (Object): Options object with the same properties as `chat()`

**Returns:**
An async iterable that yields token chunks as they become available.

### `embed(text, opts)`

Asynchronously generates embeddings for the provided text.

**Parameters:**

- `text` (string): Text to embed
- `opts` (Object): Options object with the following possible properties:
  - `model` (string): Embedding model identifier
  - `dimensions` (number): Desired embedding dimensions (if supported)
  - `timeoutMs` (number): Request timeout in milliseconds
  - `signal` (AbortSignal): Abort signal for cancellation

**Returns:**

```javascript
{
  embedding: number[],       // Array of embedding values
  dimensions: number,        // Number of dimensions in the embedding
  model: string,             // Model used for embedding
  usage?: {
    inputTokens: number,     // Number of input tokens processed
    totalTokens: number      // Total tokens processed
  }
}
```

## Optional Methods

### `complete(prompt, opts)`

Asynchronously completes a text prompt (non-chat format).

**Parameters:**

- `prompt` (string): Text prompt to complete
- `opts` (Object): Options object with the same properties as `chat()`

**Returns:**
Same format as `chat()` method.

### `vision(image, prompt, opts)`

Asynchronously processes an image with a text prompt (if supported).

**Parameters:**

- `image` (string|Buffer): Image data or URL
- `prompt` (string): Text prompt describing the image task
- `opts` (Object): Options object with the same properties as `chat()`

**Returns:**
Same format as `chat()` method.

### `code(prompt, opts)`

Asynchronously generates code based on the prompt (if supported).

**Parameters:**

- `prompt` (string): Code generation prompt
- `opts` (Object): Options object with the same properties as `chat()`

**Returns:**
Same format as `chat()` method.

### `reasoning(prompt, opts)`

Asynchronously performs complex reasoning tasks (if supported).

**Parameters:**

- `prompt` (string): Reasoning task prompt
- `opts` (Object): Options object with the same properties as `chat()`

**Returns:**
Same format as `chat()` method.

### `functionCalling(functions, opts)`

Asynchronously calls functions based on the input (if supported).

**Parameters:**

- `functions` (Array): Array of function definitions
- `opts` (Object): Options object with the same properties as `chat()`

**Returns:**

```javascript
{
  content: string,           // Natural language response
  functionCalls: Array,      // Array of function call requests
  usage: { ... },            // Token usage information
  model: string,             // Model that processed the request
  provider: string           // Provider identifier
}
```

## Configuration Schema

Each provider accepts a configuration object with the following properties:

```javascript
{
  // Authentication
  apiKey: string,                    // API key for the provider
  baseUrl?: string,                  // Base URL for API requests

  // Model selection
  defaultModel: string,              // Default model to use
  embeddingModel?: string,           // Default embedding model

  // Connection settings
  timeoutMs?: number,                // Request timeout in milliseconds
  extraHeaders?: Object,             // Additional headers to send with requests

  // Provider-specific options
  [providerSpecificOption: string]: any
}
```

## Response Contract

All provider methods must return responses in the standardized format defined above. The response should include:

- Proper token usage accounting
- Correct model identification
- Consistent error handling
- Proper metadata inclusion

## Error Contract

Providers must throw standardized errors with the following structure:

```javascript
{
  name: 'ProviderError',
  message: string,                   // Human-readable error message
  provider: string,                  // Provider identifier
  status?: number,                   // HTTP status code if applicable
  code: string,                      // Error code (e.g., 'RATE_LIMIT_EXCEEDED')
  details?: Object                   // Additional error details
}
```

Common error codes:

- `AUTH_ERROR`: Authentication failure
- `RATE_LIMIT_EXCEEDED`: Rate limit reached
- `INVALID_REQUEST`: Malformed request
- `MODEL_NOT_FOUND`: Requested model doesn't exist
- `PROVIDER_UNAVAILABLE`: Service temporarily unavailable
- `CONTENT_FILTERED`: Content was filtered by provider

## Streaming Protocol

Streaming implementations must:

- Yield token chunks as they become available
- Handle connection interruptions gracefully
- Support cancellation via AbortSignal
- Provide progress indicators when possible

## Rate Limiting

Providers must implement rate limiting respecting the provider's documented limits:

- Track request counts and timing
- Implement exponential backoff for retries
- Respect burst limits and sustained limits
- Provide queueing mechanism when appropriate

## Retry Strategy

Providers should implement intelligent retry logic:

- Exponential backoff with jitter
- Respect retry-after headers
- Differentiate between retryable and non-retryable errors
- Maximum retry attempts configurable
- Circuit breaker pattern for service degradation

## Provider Capabilities Detection

Providers should expose their capabilities through a `capabilities` property or method:

```javascript
{
  chat: boolean,                     // Supports chat interface
  stream: boolean,                   // Supports streaming
  embed: boolean,                    // Supports embeddings
  vision: boolean,                   // Supports vision/image processing
  code: boolean,                     // Supports code generation
  reasoning: boolean,                // Supports complex reasoning
  functionCalling: boolean,          // Supports function calling
  maxInputTokens: number,            // Maximum input tokens supported
  maxOutputTokens: number,           // Maximum output tokens supported
  supportedModels: string[]          // List of supported model IDs
}
```

## Implementation Notes

1. All methods must be asynchronous
2. Error handling should be consistent across providers
3. Configuration should be validated at initialization
4. Providers should be stateless where possible
5. Memory usage should be monitored and controlled
6. Connection pooling should be implemented where beneficial
