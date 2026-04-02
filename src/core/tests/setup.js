// tests/setup.js
// Global test setup for Ultra-Dex

import { vi, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Create a temporary directory for test files
const testTempDir = join(tmpdir(), 'ultra-dex-tests-' + Date.now());

beforeAll(async () => {
  // Create temporary directory for tests
  if (!existsSync(testTempDir)) {
    mkdirSync(testTempDir, { recursive: true });
  }

  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.TEST_ENV = 'true';
  process.env.MOCK_AI_PROVIDERS = 'true';
  process.env.DISABLE_EXTERNAL_APIS = 'true';

  // Mock AI providers to avoid actual API calls
  vi.mock('../packages/core/core/ai/ai-meta-layer.js', async () => {
    const actual = await vi.importActual('../packages/core/core/ai/ai-meta-layer.js');
    return {
      ...actual,
      aiMetaLayer: {
        ...actual.aiMetaLayer,
        call: vi.fn().mockResolvedValue({
          content: 'Mocked AI response for testing',
          usage: { totalTokens: 15 },
          finishReason: 'stop',
        }),
        stream: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            yield 'Mocked stream response';
          },
        }),
        generateObject: vi.fn().mockResolvedValue({
          object: { mocked: true },
          usage: { totalTokens: 20 },
        }),
      },
    };
  });

  console.log('🧪 Test environment initialized');
  console.log(`📁 Temporary directory: ${testTempDir}`);
});

afterAll(() => {
  // Clean up temporary directory
  if (existsSync(testTempDir)) {
    rmSync(testTempDir, { recursive: true, force: true });
  }

  console.log('🧹 Test environment cleaned up');
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();

  // Set up any per-test configuration
  console.log(`\n📝 Starting test: ${expect.getState().currentTestName}`);
});

afterEach(() => {
  // Clean up after each test
  console.log(`✅ Completed test: ${expect.getState().currentTestName}`);
});

// Export anything that needs to be available globally in tests
export { testTempDir };
