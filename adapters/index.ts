/**
 * Ultra-Dex Adapters
 *
 * Execution adapters for various LLM providers and environments.
 */

// Core Types
export type {
  ExecutionAdapter,
  ExecutionContext,
  ExecutionResult,
} from './executionAdapter.js';

// Adapters
export { MockAdapter } from './mockAdapter.js';
export { OpenAIAdapter } from './openaiAdapter.js';
export { AnthropicAdapter } from './anthropicAdapter.js';
export { ResultValidator } from './resultValidator.js';

// Config Types
export type { OpenAIAdapterConfig } from './openaiAdapter.js';
export type { AnthropicAdapterConfig } from './anthropicAdapter.js';
