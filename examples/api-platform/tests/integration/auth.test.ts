/**
 * @fileoverview Auth Test module
 * @module integration/auth.test
 */

import request from 'supertest';
import express from 'express';
import { authenticate } from '../../src/middleware/authenticate';
import { ApiKeyService } from '../../src/services/auth';

const app = express();
app.use(express.json());

// Test route
app.get('/test', authenticate, (req, res) => {
  res.json({ apiKey: req.apiKey });
});

describe('Authentication Middleware', () => {
  let apiKey: string;

  beforeEach(async () => {
    const service = new ApiKeyService();
    const key = await service.createKey('test-user', { name: 'Test Key' });
    apiKey = key.secret;
  });

  it('should authenticate with valid API key', async () => {
    const response = await request(app).get('/test').set('X-API-Key', apiKey);

    expect(response.status).toBe(200);
    expect(response.body.apiKey).toBeDefined();
  });

  it('should reject request without API key', async () => {
    const response = await request(app).get('/test');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('unauthorized');
  });

  it('should reject request with invalid API key', async () => {
    const response = await request(app).get('/test').set('X-API-Key', 'invalid-key');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('unauthorized');
  });
});

/**
 * Error handler for auth.test
 * @param {Error} error - Error to handle
 */
function handleAuthtestError(error) {
  try {
    console.error('[auth.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
