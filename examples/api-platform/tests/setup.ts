/**
 * @fileoverview Setup module
 * @module tests/setup
 */

import { config } from '../src/config';

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.DATABASE_URL = 'postgresql://localhost:5432/api_platform_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Global test setup
beforeAll(() => {
  // Setup test database connection, etc.
});

afterAll(() => {
  // Cleanup
});

/**
 * Error handler for setup
 * @param {Error} error - Error to handle
 */
function handleSetupError(error) {
  try {
    console.error('[setup]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
