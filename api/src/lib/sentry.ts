import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for error tracking
 * Call this at the very start of your application
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set sampling rate for profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      
      // Filter out development errors in production
      if (process.env.NODE_ENV === 'production') {
        // Don't send 404 errors to Sentry
        if (event.exception?.values?.[0]?.type === 'NotFoundError') {
          return null;
        }
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      // HTTP integration for tracing
      Sentry.httpIntegration(),
      // Express integration
      Sentry.expressIntegration(),
    ],
  });

  console.log('✅ Sentry initialized for error tracking');
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Express error handler middleware
 * Use: app.use(getSentryErrorHandler())
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSentryErrorHandler(): any {
  return Sentry.expressErrorHandler();
}

/**
 * Express request handler middleware (add to beginning of middleware chain)
 */
export const sentryRequestHandler = Sentry.expressIntegration();

export { Sentry };
