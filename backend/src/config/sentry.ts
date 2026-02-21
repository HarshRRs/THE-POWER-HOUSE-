import * as Sentry from '@sentry/node';
import type { Express, Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.util.js';

/**
 * Initialize Sentry error tracking and performance monitoring
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    logger.warn('Sentry: SENTRY_DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || `rdvpriority-backend@${process.env.npm_package_version || '1.0.0'}`,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-csrf-token'];
      }
      
      // Remove sensitive data from request body
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey'];
        for (const field of sensitiveFields) {
          if (typeof event.request.data === 'object' && event.request.data !== null) {
            delete (event.request.data as Record<string, unknown>)[field];
          }
        }
      }
      
      return event;
    },

    // Ignore common non-errors
    ignoreErrors: [
      // Network errors
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      // Auth errors (expected)
      'Token expired',
      'Invalid token',
      'Unauthorized',
      // Rate limiting (expected)
      'Too many requests',
    ],
  });

  logger.info(`Sentry: Initialized for ${process.env.NODE_ENV || 'development'} environment`);
}

/**
 * Sentry request handler middleware - captures request info
 */
export function sentryRequestHandler() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Set request context for Sentry
    Sentry.setContext('request', {
      method: req.method,
      url: req.url,
      query: req.query,
      requestId: req.requestId,
    });
    next();
  };
}

/**
 * Sentry error handler middleware - captures errors
 */
export function sentryErrorHandler() {
  return (err: Error & { status?: number }, req: Request, _res: Response, next: NextFunction): void => {
    // Only report 500+ errors or unhandled errors
    const shouldReport = !err.status || err.status >= 500;
    
    if (shouldReport && process.env.SENTRY_DSN) {
      Sentry.captureException(err, {
        extra: {
          requestId: req.requestId,
          method: req.method,
          url: req.url,
          userId: req.user?.id,
        },
      });
    }
    
    next(err);
  };
}

/**
 * Setup all Sentry middleware on Express app
 */
export function setupSentryMiddleware(app: Express): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  // Request handler captures request context
  app.use(sentryRequestHandler());
}

/**
 * Setup Sentry error handler - call after all routes
 */
export function setupSentryErrorHandler(app: Express): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  app.use(sentryErrorHandler());
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): string | undefined {
  if (!process.env.SENTRY_DSN) {
    logger.error('Uncaptured exception (Sentry disabled):', error);
    return undefined;
  }

  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): string | undefined {
  if (!process.env.SENTRY_DSN) {
    logger.info('Uncaptured message (Sentry disabled):', message);
    return undefined;
  }

  return Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; plan?: string }): void {
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    plan: user.plan,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUser(): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
): void {
  if (!process.env.SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Flush Sentry events (call before shutdown)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  if (!process.env.SENTRY_DSN) return true;
  return Sentry.flush(timeout);
}

// Re-export Sentry for advanced usage
export { Sentry };
