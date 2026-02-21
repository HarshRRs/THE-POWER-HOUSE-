import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay - captures user interactions for debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter errors
  beforeSend(event) {
    // Don't report auth errors (expected behavior)
    if (event.exception?.values?.[0]?.value?.includes('Unauthorized')) {
      return null;
    }
    if (event.exception?.values?.[0]?.value?.includes('Token expired')) {
      return null;
    }
    return event;
  },

  // Ignore common non-errors
  ignoreErrors: [
    // Network errors
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    // Auth expected errors
    'Unauthorized',
    'Token expired',
    // User-caused
    'ResizeObserver loop',
    'Non-Error promise rejection',
  ],

  // Only report errors in production
  enabled: process.env.NODE_ENV === 'production',
});
