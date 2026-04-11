import { vi, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
const testTempDir = join(tmpdir(), 'ultra-dex-tests-' + Date.now());
beforeAll(async () => {
  if (!existsSync(testTempDir)) {
    mkdirSync(testTempDir, { recursive: true });
  }
  process.env.NODE_ENV = 'test';
  process.env.TEST_ENV = 'true';
  process.env.MOCK_AI_PROVIDERS = 'true';
  process.env.DISABLE_EXTERNAL_APIS = 'true';
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
  console.log('\u{1F9EA} Test environment initialized');
  console.log(`\u{1F4C1} Temporary directory: ${testTempDir}`);
});
afterAll(() => {
  if (existsSync(testTempDir)) {
    rmSync(testTempDir, { recursive: true, force: true });
  }
  console.log('\u{1F9F9} Test environment cleaned up');
});
beforeEach(() => {
  vi.clearAllMocks();
  console.log(`
\u{1F4DD} Starting test: ${expect.getState().currentTestName}`);
});
afterEach(() => {
  console.log(`\u2705 Completed test: ${expect.getState().currentTestName}`);
});
export { testTempDir };
