/**
 * Mock Index - exports all mocks
 */

export {
  MockAIProvider,
  MockOpenAIProvider,
  MockAnthropicProvider,
  MockGeminiProvider,
} from './providers.js';
export { default as MockFileSystem } from './filesystem.js';

// Test utilities
export const createTestContext = (overrides = {}) => ({
  cwd: '/test/project',
  config: {
    provider: 'mock',
    model: 'mock-model',
    ...overrides.config,
  },
  env: {
    OPENAI_API_KEY: 'test-key',
    ANTHROPIC_API_KEY: 'test-key',
    ...overrides.env,
  },
  ...overrides,
});

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const captureOutput = () => {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => errors.push(args.join(' '));

  return {
    logs,
    errors,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    },
  };
};

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
