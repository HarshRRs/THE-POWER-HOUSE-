import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { sendError } from '../utils/responses.util.js';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const isProduction = process.env.NODE_ENV === 'production';

// Cookie options for CSRF token (NOT httpOnly - JS needs to read it)
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // Frontend JS needs to read this
  secure: isProduction,
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 1000, // 1 hour
  path: '/',
};

// Paths to exclude from CSRF protection
// NOTE: These paths are relative to /api since middleware is mounted at app.use('/api', csrfProtection)
const EXCLUDED_PATHS = [
  '/billing/webhook', // Stripe webhook has its own signature verification
  '/telegram/webhook', // Telegram webhook
  '/auth/login', // Pre-auth: no session to protect
  '/auth/register', // Pre-auth: no session to protect
  '/auth/forgot-password', // Pre-auth: no session to protect
  '/auth/reset-password', // Pre-auth: token-based verification
  '/auth/refresh', // Uses httpOnly cookie for auth
];

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * CSRF Protection Middleware using Double Submit Cookie pattern
 * 
 * How it works:
 * 1. Server sets a CSRF token in a non-httpOnly cookie
 * 2. Frontend reads the cookie and sends it back in X-CSRF-Token header
 * 3. Server validates that header matches cookie
 * 
 * This prevents CSRF because:
 * - Attackers can trigger requests with cookies (automatic)
 * - But attackers cannot read the cookie value (same-origin policy)
 * - So attackers cannot set the correct X-CSRF-Token header
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF for excluded paths (webhooks with their own auth)
  if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
  if (!PROTECTED_METHODS.includes(req.method)) {
    // Ensure CSRF cookie is set for any request
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), CSRF_COOKIE_OPTIONS);
    }
    return next();
  }

  // Get token from cookie and header
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  // Validate tokens exist
  if (!cookieToken) {
    sendError(res, 'CSRF token missing from cookie', 403);
    return;
  }

  if (!headerToken) {
    sendError(res, 'CSRF token missing from header', 403);
    return;
  }

  // Validate tokens match (timing-safe comparison)
  if (!timingSafeEqual(cookieToken, headerToken)) {
    sendError(res, 'CSRF token mismatch', 403);
    return;
  }

  // Rotate token after successful validation
  res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), CSRF_COOKIE_OPTIONS);

  next();
}

/**
 * Endpoint to get a new CSRF token
 * Frontend should call this on app initialization
 */
export function getCsrfToken(_req: Request, res: Response): void {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, CSRF_COOKIE_OPTIONS);
  res.json({ success: true, data: { csrfToken: token } });
}
