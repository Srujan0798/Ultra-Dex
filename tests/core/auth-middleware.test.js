import { describe, it, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { clerk } from '../../src/core/auth/clerk-client.js';

describe('Auth Middleware', () => {
  let middleware;
  
  before(async () => {
    // Dynamically import to test module loading
    const module = await import('../../src/core/auth/middleware.js');
    middleware = module;
  });

  beforeEach(() => {
    // @ts-ignore - override for testing
    clerk.sessions = {
      getSession: mock.fn()
    };
    // @ts-ignore - override for testing
    clerk.users = {
      getUser: mock.fn()
    };
  });

  describe('requireAuth', () => {
    it('should export requireAuth function', () => {
      assert.strictEqual(typeof middleware.requireAuth, 'function');
    });

    it('should return a middleware function', () => {
      const mw = middleware.requireAuth();
      assert.strictEqual(typeof mw, 'function');
      assert.strictEqual(mw.length, 3); // Express middleware signature (req, res, next)
    });

    it('should accept optional roles parameter', () => {
      const mw1 = middleware.requireAuth();
      const mw2 = middleware.requireAuth(['admin']);
      const mw3 = middleware.requireAuth(['admin', 'user']);
      
      assert.strictEqual(typeof mw1, 'function');
      assert.strictEqual(typeof mw2, 'function');
      assert.strictEqual(typeof mw3, 'function');
    });
  });

  describe('requireAdmin', () => {
    it('should export requireAdmin middleware', () => {
      assert.ok(middleware.requireAdmin);
      assert.strictEqual(typeof middleware.requireAdmin, 'function');
    });
  });

  describe('requirePaidPlan', () => {
    it('should export requirePaidPlan function', () => {
      assert.strictEqual(typeof middleware.requirePaidPlan, 'function');
    });

    it('should return a middleware function', () => {
      const mw = middleware.requirePaidPlan();
      assert.strictEqual(typeof mw, 'function');
      assert.strictEqual(mw.length, 3);
    });
  });

  describe('Integration', () => {
    it('should handle missing authorization header', async () => {
      const mw = middleware.requireAuth();
      
      const req = { headers: {} };
      let statusCode;
      let jsonData;
      
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          jsonData = data;
        }
      };
      
      const next = () => {
        throw new Error('next() should not be called');
      };
      
      await mw(req, res, next);
      
      assert.strictEqual(statusCode, 401);
      assert.ok(jsonData.error);
      assert.match(jsonData.error, /Unauthorized/i);
    });

    it('should handle malformed authorization header', async () => {
      const mw = middleware.requireAuth();
      
      const req = { headers: { authorization: 'InvalidFormat token123' } };
      let statusCode;
      let jsonData;
      
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          jsonData = data;
        }
      };
      
      const next = () => {
        throw new Error('next() should not be called');
      };
      
      await mw(req, res, next);
      
      assert.strictEqual(statusCode, 401);
      assert.ok(jsonData.error);
    });

    it('should accept dev-token in dev mode', async () => {
      // Save and remove CLERK_SECRET_KEY to trigger dev mode
      const originalKey = process.env.CLERK_SECRET_KEY;
      delete process.env.CLERK_SECRET_KEY;
      
      const mw = middleware.requireAuth();
      const req = { headers: { authorization: 'Bearer dev-token' } };
      let nextCalled = false;
      
      const res = {
        status: () => {
          throw new Error('status() should not be called in dev mode');
        },
        json: () => {
          throw new Error('json() should not be called in dev mode');
        }
      };
      
      const next = () => {
        nextCalled = true;
      };
      
      await mw(req, res, next);
      
      assert.strictEqual(nextCalled, true);
      assert.ok(req.auth);
      assert.strictEqual(req.auth.userId, 'dev-user-id');
      assert.strictEqual(req.auth.email, 'dev@ultra-dex.com');
      assert.strictEqual(req.auth.plan, 'free');
      
      // Restore original key
      if (originalKey) process.env.CLERK_SECRET_KEY = originalKey;
    });

    it('should allow valid token and attach auth info', async () => {
      const originalKey = process.env.CLERK_SECRET_KEY;
      process.env.CLERK_SECRET_KEY = 'test_secret_key';

      // Mock Clerk session + user
      clerk.sessions.getSession.mock.mockImplementationOnce(async () => ({
        status: 'active',
        userId: 'user_valid_123'
      }));

      clerk.users.getUser.mock.mockImplementationOnce(async () => ({
        id: 'user_valid_123',
        emailAddresses: [{ emailAddress: 'valid@example.com' }],
        publicMetadata: { role: 'user', tier: 'pro' }
      }));

      const mw = middleware.requireAuth();
      const req = { headers: { authorization: 'Bearer valid-token' } };
      let nextCalled = false;

      const res = {
        status: () => {
          throw new Error('status() should not be called for valid token');
        },
        json: () => {
          throw new Error('json() should not be called for valid token');
        }
      };

      const next = () => {
        nextCalled = true;
      };

      await mw(req, res, next);

      assert.strictEqual(nextCalled, true);
      assert.ok(req.auth);
      assert.strictEqual(req.auth.userId, 'user_valid_123');
      assert.strictEqual(req.auth.email, 'valid@example.com');
      assert.strictEqual(req.auth.role, 'user');
      assert.strictEqual(req.auth.plan, 'pro');

      if (originalKey) process.env.CLERK_SECRET_KEY = originalKey;
      else delete process.env.CLERK_SECRET_KEY;
    });

    it('should return 403 when user lacks required role', async () => {
      const originalKey = process.env.CLERK_SECRET_KEY;
      process.env.CLERK_SECRET_KEY = 'test_secret_key';

      clerk.sessions.getSession.mock.mockImplementationOnce(async () => ({
        status: 'active',
        userId: 'user_role_123'
      }));

      clerk.users.getUser.mock.mockImplementationOnce(async () => ({
        id: 'user_role_123',
        emailAddresses: [{ emailAddress: 'role@example.com' }],
        publicMetadata: { role: 'user', tier: 'free' }
      }));

      const mw = middleware.requireAuth(['admin']);
      const req = { headers: { authorization: 'Bearer valid-token' } };
      let statusCode;

      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: () => {}
      };

      const next = () => {
        throw new Error('next() should not be called');
      };

      await mw(req, res, next);

      assert.strictEqual(statusCode, 403);

      if (originalKey) process.env.CLERK_SECRET_KEY = originalKey;
      else delete process.env.CLERK_SECRET_KEY;
    });
  });

  describe('requirePaidPlan Integration', () => {
    it('should reject when no auth attached', async () => {
      const mw = middleware.requirePaidPlan();
      const req = {};
      let statusCode;
      let jsonData;
      
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          jsonData = data;
        }
      };
      
      const next = () => {
        throw new Error('next() should not be called');
      };
      
      await mw(req, res, next);
      
      assert.strictEqual(statusCode, 401);
      assert.ok(jsonData.error);
    });

    it('should reject free plan users', async () => {
      const mw = middleware.requirePaidPlan();
      const req = {
        auth: {
          userId: 'user123',
          email: 'test@example.com',
          role: 'user',
          plan: 'free'
        }
      };
      
      let statusCode;
      let jsonData;
      
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          jsonData = data;
        }
      };
      
      const next = () => {
        throw new Error('next() should not be called for free users');
      };
      
      await mw(req, res, next);
      
      assert.strictEqual(statusCode, 403);
      assert.match(jsonData.error, /Paid plan required/i);
    });

    it('should allow pro plan users', async () => {
      const mw = middleware.requirePaidPlan();
      const req = {
        auth: {
          userId: 'user123',
          email: 'test@example.com',
          role: 'user',
          plan: 'pro'
        }
      };
      
      let nextCalled = false;
      
      const res = {
        status: () => {
          throw new Error('status() should not be called for pro users');
        },
        json: () => {
          throw new Error('json() should not be called for pro users');
        }
      };
      
      const next = () => {
        nextCalled = true;
      };
      
      await mw(req, res, next);
      
      assert.strictEqual(nextCalled, true);
    });

    it('should allow enterprise plan users', async () => {
      const mw = middleware.requirePaidPlan();
      const req = {
        auth: {
          userId: 'user123',
          email: 'test@example.com',
          role: 'user',
          plan: 'enterprise'
        }
      };
      
      let nextCalled = false;
      
      const res = {
        status: () => {
          throw new Error('status() should not be called for enterprise users');
        },
        json: () => {
          throw new Error('json() should not be called for enterprise users');
        }
      };
      
      const next = () => {
        nextCalled = true;
      };
      
      await mw(req, res, next);
      
      assert.strictEqual(nextCalled, true);
    });
  });
});
