/**
 * @fileoverview Rate Limit module
 * @module middleware/rate-limit
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterService } from '../services/rate-limiter';
import { RateLimitError } from './error-handler';
import { config } from '../config';

const rateLimiter = new RateLimiterService();

export const rateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!config.rateLimit.enabled) {
    return next();
  }

  try {
    const apiKey = req.apiKey;

    if (!apiKey) {
      return next();
    }

    const keyId = apiKey.id;
    const tier = apiKey.tier || 'free';
    const limit = config.rateLimit.tiers[tier] || config.rateLimit.tiers.free;

    const result = await rateLimiter.checkLimit(keyId, limit, config.rateLimit.windowMs);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
    res.setHeader('X-RateLimit-Reset', result.resetTime);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);
      throw new RateLimitError(
        `Rate limit exceeded. Limit: ${limit} requests per hour.`,
        retryAfter
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
