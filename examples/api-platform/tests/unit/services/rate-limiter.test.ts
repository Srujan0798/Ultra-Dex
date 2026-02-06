import { RateLimiterService } from '../../src/services/rate-limiter';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(() => {
    service = new RateLimiterService();
  });

  describe('checkLimit', () => {
    it('should allow requests under the limit', async () => {
      const result = await service.checkLimit('key-1', 5, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should block requests over the limit', async () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await service.checkLimit('key-2', 5, 60000);
      }

      // 6th request should be blocked
      const result = await service.checkLimit('key-2', 5, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset limit after window expires', async () => {
      // Use very short window for testing
      await service.checkLimit('key-3', 1, 10);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      const result = await service.checkLimit('key-3', 1, 10);
      expect(result.allowed).toBe(true);
    });
  });
});
