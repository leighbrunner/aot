import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface ErrorContext {
  userId?: string;
  action?: string;
  screen?: string;
  metadata?: Record<string, any>;
}

class ErrorTrackingService {
  private initialized = false;
  private userId?: string;
  private environment: string;

  constructor() {
    this.environment = __DEV__ ? 'development' : 'production';
  }

  /**
   * Initialize error tracking service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        environment: this.environment,
        debug: __DEV__,
        release: Constants.expoConfig?.version,
        dist: Platform.OS,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        attachStacktrace: true,
        attachScreenshot: true,
        tracesSampleRate: __DEV__ ? 1.0 : 0.1,
        integrations: [
          new Sentry.ReactNativeTracing({
            routingInstrumentation: Sentry.reactNavigationIntegration(),
            tracingOrigins: ['localhost', /^\//],
          }),
        ],
        beforeSend: (event, hint) => {
          // Filter out development errors
          if (__DEV__ && event.level === 'error') {
            console.log('Development error:', event);
            return null;
          }

          // Sanitize sensitive data
          if (event.request?.cookies) {
            delete event.request.cookies;
          }
          if (event.user?.email) {
            event.user.email = this.hashEmail(event.user.email);
          }

          return event;
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Filter out sensitive breadcrumbs
          if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
          }

          // Sanitize navigation breadcrumbs
          if (breadcrumb.category === 'navigation' && breadcrumb.data?.params) {
            const params = { ...breadcrumb.data.params };
            delete params.password;
            delete params.token;
            breadcrumb.data.params = params;
          }

          return breadcrumb;
        },
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize error tracking:', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, email?: string, username?: string) {
    this.userId = userId;
    
    Sentry.setUser({
      id: userId,
      email: email ? this.hashEmail(email) : undefined,
      username,
    });
  }

  /**
   * Clear user context
   */
  clearUser() {
    this.userId = undefined;
    Sentry.setUser(null);
  }

  /**
   * Log an error with context
   */
  logError(error: Error, context?: ErrorContext) {
    if (!this.initialized) {
      console.error('Error (not tracked):', error, context);
      return;
    }

    Sentry.withScope((scope) => {
      // Set error context
      if (context) {
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }
        if (context.action) {
          scope.setTag('action', context.action);
        }
        if (context.screen) {
          scope.setTag('screen', context.screen);
        }
        if (context.metadata) {
          scope.setContext('metadata', context.metadata);
        }
      }

      // Set error level based on error type
      if (error.name === 'NetworkError') {
        scope.setLevel('warning');
      } else if (error.name === 'ValidationError') {
        scope.setLevel('info');
      }

      Sentry.captureException(error);
    });
  }

  /**
   * Log a message with level
   */
  logMessage(message: string, level: Sentry.SeverityLevel = 'info', extra?: Record<string, any>) {
    if (!this.initialized) {
      console.log(`[${level}] ${message}`, extra);
      return;
    }

    Sentry.withScope((scope) => {
      if (extra) {
        scope.setContext('extra', extra);
      }
      Sentry.captureMessage(message, level);
    });
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>) {
    this.addBreadcrumb(eventName, 'custom', properties);
    
    // Also send to analytics if needed
    if (properties) {
      Sentry.setContext('event_properties', properties);
    }
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, operation: string) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  /**
   * Capture user feedback
   */
  async captureUserFeedback(feedback: {
    message: string;
    email?: string;
    name?: string;
  }) {
    const user = Sentry.getCurrentHub().getScope()?.getUser();
    
    const userFeedback: Sentry.UserFeedback = {
      event_id: Sentry.lastEventId() || Sentry.captureMessage('User Feedback'),
      email: feedback.email || user?.email || 'unknown@example.com',
      name: feedback.name || user?.username || 'Anonymous',
      comments: feedback.message,
    };

    Sentry.captureUserFeedback(userFeedback);
  }

  /**
   * Wrap async function with error tracking
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: Omit<ErrorContext, 'metadata'>
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logError(error as Error, {
          ...context,
          metadata: { args },
        });
        throw error;
      }
    }) as T;
  }

  /**
   * Hash email for privacy
   */
  private hashEmail(email: string): string {
    // Simple hash for privacy (in production, use proper hashing)
    return email.split('@')[0].charAt(0) + '***@' + email.split('@')[1];
  }

  /**
   * Test error tracking (development only)
   */
  testError() {
    if (!__DEV__) return;

    const testError = new Error('Test error from error tracking service');
    this.logError(testError, {
      action: 'test_error',
      screen: 'test_screen',
      metadata: {
        timestamp: new Date().toISOString(),
        test: true,
      },
    });
  }
}

export const errorTracker = new ErrorTrackingService();