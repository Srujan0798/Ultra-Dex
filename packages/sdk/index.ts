// Backward-compatible TypeScript entrypoint.
export { UltraDex } from './src/client.js';
export { Agent } from './src/agent.js';
export { BaseProvider } from './src/provider.js';
export { PluginLoader } from './src/plugin.js';
export { SmartRouter, ProviderStats, CircuitBreaker } from './src/router.js';
export {
  MiddlewarePipeline,
  loggingMiddleware,
  retryMiddleware,
  cacheMiddleware,
  rateLimitMiddleware,
} from './src/middleware.js';
