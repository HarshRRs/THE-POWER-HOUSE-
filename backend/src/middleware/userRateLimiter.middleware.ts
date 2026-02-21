import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { sendError } from '../utils/responses.util.js';

interface UserRateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function userRateLimiter(options: UserRateLimitOptions) {
  const { windowMs, max, message = 'Too many requests. Please slow down.' } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only apply to authenticated users
    if (!req.user?.id) {
      next();
      return;
    }

    const key = `ratelimit:user:${req.user.id}:${req.path}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        const ttl = await redis.ttl(key);
        res.setHeader('Retry-After', ttl);
        sendError(res, message, 429);
        return;
      }

      next();
    } catch {
      // If Redis is down, allow the request through
      next();
    }
  };
}

// Pre-configured limiters
export const alertsUserLimiter = userRateLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many alert operations. Please wait a moment.',
});

export const billingUserLimiter = userRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many billing requests. Please wait a moment.',
});
