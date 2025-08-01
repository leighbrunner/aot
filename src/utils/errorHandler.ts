import { Alert } from 'react-native'
import * as Sentry from '@sentry/react-native'

export interface AppError {
  code: string
  message: string
  details?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class ErrorHandler {
  private static isDev = __DEV__

  static init() {
    if (!this.isDev) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request?.cookies) {
            delete event.request.cookies
          }
          return event
        },
      })
    }
  }

  static handle(error: Error | AppError, context?: string): void {
    console.error(`Error in ${context || 'Unknown context'}:`, error)

    if (!this.isDev) {
      Sentry.captureException(error, {
        tags: {
          context,
        },
      })
    }

    const appError = this.normalizeError(error)
    this.showUserFriendlyError(appError)
  }

  static async handleAsync<T>(
    promise: Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await promise
    } catch (error) {
      this.handle(error as Error, context)
      return null
    }
  }

  private static normalizeError(error: Error | AppError): AppError {
    if ('code' in error && 'severity' in error) {
      return error as AppError
    }

    // Map common errors
    if (error.message.includes('Network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Connection error. Please check your internet connection.',
        severity: 'medium',
        details: error,
      }
    }

    if (error.message.includes('401') || error.message.includes('403')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication error. Please sign in again.',
        severity: 'high',
        details: error,
      }
    }

    if (error.message.includes('404')) {
      return {
        code: 'NOT_FOUND',
        message: 'The requested content was not found.',
        severity: 'low',
        details: error,
      }
    }

    if (error.message.includes('500')) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
        severity: 'critical',
        details: error,
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
      severity: 'medium',
      details: error,
    }
  }

  private static showUserFriendlyError(error: AppError): void {
    const title = this.getErrorTitle(error.severity)
    
    Alert.alert(
      title,
      error.message,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
      { cancelable: true }
    )
  }

  private static getErrorTitle(severity: AppError['severity']): string {
    switch (severity) {
      case 'low':
        return 'Notice'
      case 'medium':
        return 'Warning'
      case 'high':
        return 'Error'
      case 'critical':
        return 'Critical Error'
    }
  }

  // Specific error handlers
  static networkError(details?: any): AppError {
    return {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect. Please check your internet connection.',
      severity: 'medium',
      details,
    }
  }

  static authError(details?: any): AppError {
    return {
      code: 'AUTH_ERROR',
      message: 'Authentication required. Please sign in.',
      severity: 'high',
      details,
    }
  }

  static validationError(field: string, details?: any): AppError {
    return {
      code: 'VALIDATION_ERROR',
      message: `Invalid ${field}. Please check and try again.`,
      severity: 'low',
      details,
    }
  }

  static quotaExceeded(resource: string, details?: any): AppError {
    return {
      code: 'QUOTA_EXCEEDED',
      message: `You've reached your ${resource} limit for today.`,
      severity: 'medium',
      details,
    }
  }

  static imageLoadError(details?: any): AppError {
    return {
      code: 'IMAGE_LOAD_ERROR',
      message: 'Unable to load image. Please try again.',
      severity: 'low',
      details,
    }
  }
}