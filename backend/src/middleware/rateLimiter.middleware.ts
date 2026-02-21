import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants.js';

export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.auth.windowMs,
  max: RATE_LIMITS.auth.max,
  message: {
    success: false,
    error: 'Too many attempts. Please try again in 1 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const refreshLimiter = rateLimit({
  windowMs: RATE_LIMITS.refresh.windowMs,
  max: RATE_LIMITS.refresh.max,
  message: {
    success: false,
    error: 'Too many refresh attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.max,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
