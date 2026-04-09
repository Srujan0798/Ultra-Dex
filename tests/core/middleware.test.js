import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Auth Middleware', () => {
  let middleware;
  let mockReq, mockRes, nextCalled;

  before(async () => {
    const module = await import('../../src/core/auth/middleware.js');
    middleware = module;
  });

  beforeEach(() => {
    mockReq = {
      headers: {},
      path: '/api/test',
      body: {},
    };
    mockRes = {
      statusCode: 200,
      body: {},
      status: function (s) {
        this.statusCode = s;
        return this;
      },
      json: function (j) {
        this.body = j;
        return this;
      },
      on: function (event, handler) {
        this.finishHandler = handler;
      },
      getHeader: function (name) {
        return null;
      },
    };
    nextCalled = false;
  });

  describe('requireAuth', () => {
    it('should pass with dev-token when CLERK_SECRET_KEY is missing', async () => {
      const originalSecret = process.env.CLERK_SECRET_KEY;
      delete process.env.CLERK_SECRET_KEY;

      mockReq.headers.authorization = 'Bearer dev-token';
      const auth = middleware.requireAuth();

      await auth(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, 'next() should be called with dev-token');
      assert.ok(mockReq.auth, 'req.auth should be attached');
      assert.strictEqual(mockReq.auth.userId, 'dev-user-id');

      process.env.CLERK_SECRET_KEY = originalSecret;
    });

    it('should reject when authorization header is missing', async () => {
      const auth = middleware.requireAuth();
      await auth(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, 'next() should NOT be called when header is missing');
      assert.strictEqual(mockRes.statusCode, 401);
      assert.strictEqual(
        mockRes.body.error,
        'Unauthorized: Missing or invalid authorization header'
      );
    });

    it('should reject invalid token in production-like mode', async () => {
      const originalSecret = process.env.CLERK_SECRET_KEY;
      process.env.CLERK_SECRET_KEY = 'test-secret';
      mockReq.headers.authorization = 'Bearer invalid-token';

      const auth = middleware.requireAuth();
      await auth(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, 'next() should NOT be called with invalid token');
      assert.strictEqual(mockRes.statusCode, 401);

      process.env.CLERK_SECRET_KEY = originalSecret;
    });
  });

  describe('requireAdmin', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof middleware.requireAdmin, 'function');
    });
  });

  describe('enforceUsageLimit', () => {
    it('should block when user is not authenticated', () => {
      const limit = middleware.enforceUsageLimit();
      limit(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(mockRes.statusCode, 401);
    });

    it('should allow within limits and block over limits', async () => {
      const { usageMeter } = await import('../../src/core/billing/usage-meter.js');

      mockReq.auth = {
        userId: 'test-user-limits-2',
        plan: 'free',
      };

      // Reset user to ensure they are within limits
      usageMeter.resetUser('test-user-limits-2');

      const limit = middleware.enforceUsageLimit();
      limit(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, 'Should allow request within limits');

      // Simulate going over limit
      usageMeter.increment('test-user-limits-2', { requests: 1000 });

      nextCalled = false;
      limit(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, 'Should block request over limits');
      assert.strictEqual(mockRes.statusCode, 429);
    });
  });
});
