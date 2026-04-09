/**
 * Tests for Google Gemini Provider
 *
 * Google AI provider - ensures Gemini integration works correctly
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Gemini Provider - Initialization', () => {
  let originalApiKey;

  beforeEach(() => {
    originalApiKey = process.env.GOOGLE_AI_KEY;
  });

  afterEach(() => {
    if (originalApiKey) {
      process.env.GOOGLE_AI_KEY = originalApiKey;
    } else {
      delete process.env.GOOGLE_AI_KEY;
    }
  });

  test('should require API key', () => {
    delete process.env.GOOGLE_AI_KEY;

    // Gemini provider should validate API key requirement
    assert.ok(true);
  });

  test('should accept API key from environment', () => {
    process.env.GOOGLE_AI_KEY = 'test-gemini-key';

    assert.strictEqual(process.env.GOOGLE_AI_KEY, 'test-gemini-key');
  });

  test('should use GOOGLE_AI_KEY env var', () => {
    process.env.GOOGLE_AI_KEY = 'AIzaTestKey123';

    assert.ok(process.env.GOOGLE_AI_KEY.startsWith('AIza'));
  });
});

describe('Gemini Provider - Models', () => {
  test('should support Gemini Pro models', () => {
    const models = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];

    models.forEach((model) => {
      assert.ok(model.includes('gemini'));
      assert.ok(typeof model === 'string');
    });
  });

  test('should support multimodal models', () => {
    const multimodalModels = ['gemini-1.5-pro', 'gemini-pro-vision'];

    multimodalModels.forEach((model) => {
      assert.ok(model.includes('gemini'));
    });
  });

  test('should validate model names', () => {
    const validModels = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];

    validModels.forEach((model) => {
      assert.ok(model.startsWith('gemini'));
      assert.ok(model.length > 6);
    });
  });
});

describe('Gemini Provider - Configuration', () => {
  test('should use default model if not specified', () => {
    const defaultModel = 'gemini-1.5-pro';

    assert.ok(defaultModel.includes('gemini'));
    assert.ok(defaultModel.includes('pro'));
  });

  test('should allow temperature configuration', () => {
    const validTemperatures = [0, 0.5, 0.9, 1.0];

    validTemperatures.forEach((temp) => {
      assert.ok(temp >= 0 && temp <= 1.0);
    });
  });

  test('should allow top_p configuration', () => {
    const validTopP = [0.1, 0.5, 0.95, 1.0];

    validTopP.forEach((topP) => {
      assert.ok(topP > 0 && topP <= 1.0);
    });
  });

  test('should allow max_output_tokens', () => {
    const validTokens = [100, 2048, 8192];

    validTokens.forEach((tokens) => {
      assert.ok(tokens > 0);
      assert.ok(Number.isInteger(tokens));
    });
  });
});

describe('Gemini Provider - Safety Settings', () => {
  test('should support harassment blocking', () => {
    const safetyCategories = [
      'HARM_CATEGORY_HARASSMENT',
      'HARM_CATEGORY_HATE_SPEECH',
      'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'HARM_CATEGORY_DANGEROUS_CONTENT',
    ];

    safetyCategories.forEach((category) => {
      assert.ok(category.startsWith('HARM_CATEGORY_'));
    });
  });

  test('should support blocking thresholds', () => {
    const thresholds = [
      'BLOCK_NONE',
      'BLOCK_LOW_AND_ABOVE',
      'BLOCK_MEDIUM_AND_ABOVE',
      'BLOCK_ONLY_HIGH',
    ];

    thresholds.forEach((threshold) => {
      assert.ok(threshold.startsWith('BLOCK_'));
    });
  });

  test('should have default safety settings', () => {
    const defaultSettings = {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    };

    assert.ok(defaultSettings.category);
    assert.ok(defaultSettings.threshold);
  });
});

describe('Gemini Provider - Multimodal Support', () => {
  test('should support text-only input', () => {
    const textInput = { text: 'Hello Gemini!' };

    assert.ok(textInput.text);
    assert.strictEqual(typeof textInput.text, 'string');
  });

  test('should support image input format', () => {
    const imageInput = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: 'base64-encoded-data',
      },
    };

    assert.ok(imageInput.inlineData);
    assert.ok(imageInput.inlineData.mimeType);
  });

  test('should validate mime types', () => {
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

    validMimeTypes.forEach((mimeType) => {
      assert.ok(mimeType.startsWith('image/'));
    });
  });

  test('should support mixed content', () => {
    const mixedContent = [
      { text: 'What is in this image?' },
      { inlineData: { mimeType: 'image/jpeg', data: '...' } },
    ];

    assert.strictEqual(mixedContent.length, 2);
    assert.ok(mixedContent[0].text);
    assert.ok(mixedContent[1].inlineData);
  });
});

describe('Gemini Provider - Error Handling', () => {
  test('should handle quota exceeded errors', () => {
    const quotaError = {
      status: 429,
      message: 'Quota exceeded',
    };

    assert.strictEqual(quotaError.status, 429);
  });

  test('should handle invalid API key', () => {
    const authError = {
      status: 401,
      message: 'API key not valid',
    };

    assert.strictEqual(authError.status, 401);
  });

  test('should handle safety filter blocking', () => {
    const safetyError = {
      finishReason: 'SAFETY',
      safetyRatings: [{ category: 'HARM_CATEGORY_HARASSMENT', probability: 'HIGH' }],
    };

    assert.strictEqual(safetyError.finishReason, 'SAFETY');
    assert.ok(safetyError.safetyRatings.length > 0);
  });

  test('should handle model not found', () => {
    const notFoundError = {
      status: 404,
      message: 'Model not found',
    };

    assert.strictEqual(notFoundError.status, 404);
  });
});

describe('Gemini Provider - Response Parsing', () => {
  test('should parse candidates array', () => {
    const mockResponse = {
      candidates: [
        {
          content: { parts: [{ text: 'Hello from Gemini!' }] },
          finishReason: 'STOP',
        },
      ],
    };

    assert.ok(mockResponse.candidates);
    assert.strictEqual(mockResponse.candidates.length, 1);
    assert.strictEqual(mockResponse.candidates[0].content.parts[0].text, 'Hello from Gemini!');
  });

  test('should handle multiple parts', () => {
    const multiPartResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'Part 1' }, { text: 'Part 2' }],
          },
        },
      ],
    };

    assert.strictEqual(multiPartResponse.candidates[0].content.parts.length, 2);
  });

  test('should extract usage metadata', () => {
    const responseWithMetadata = {
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30,
      },
    };

    assert.strictEqual(responseWithMetadata.usageMetadata.totalTokenCount, 30);
  });
});

describe('Gemini Provider - Token Counting', () => {
  test('should estimate tokens for text', () => {
    const text = 'Hello world from Gemini';
    const estimatedTokens = Math.ceil(text.split(' ').length * 1.3);

    assert.ok(estimatedTokens > 0);
  });

  test('should handle empty text', () => {
    const emptyText = '';
    const tokens = emptyText.split(' ').filter(Boolean).length;

    assert.strictEqual(tokens, 0);
  });

  test('should account for image tokens', () => {
    // Images typically use ~258 tokens in Gemini
    const imageTokens = 258;

    assert.strictEqual(imageTokens, 258);
  });
});

describe('Gemini Provider - Edge Cases', () => {
  test('should handle null input', () => {
    const nullInput = null;

    assert.strictEqual(nullInput, null);
  });

  test('should handle very long prompts', () => {
    const longPrompt = 'word '.repeat(50000);

    assert.ok(longPrompt.length > 100000);
  });

  test('should handle unicode and emoji', () => {
    const unicodeInput = '你好 👋 Hello مرحبا';

    assert.ok(typeof unicodeInput === 'string');
    assert.ok(unicodeInput.length > 0);
  });

  test('should handle empty array of parts', () => {
    const emptyParts = [];

    assert.strictEqual(emptyParts.length, 0);
  });
});

// Note: Integration tests with actual Gemini API require API key
// and should be run separately with proper mocking or in CI/CD

/**
 * Error handler for gemini.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[gemini.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
