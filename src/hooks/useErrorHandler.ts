import { useCallback } from 'react'
import { ErrorHandler, AppError } from '@/utils/errorHandler'

export const useErrorHandler = (context?: string) => {
  const handleError = useCallback(
    (error: Error | AppError) => {
      ErrorHandler.handle(error, context)
    },
    [context]
  )

  const handleAsyncError = useCallback(
    async <T,>(promise: Promise<T>): Promise<T | null> => {
      return ErrorHandler.handleAsync(promise, context)
    },
    [context]
  )

  const throwNetworkError = useCallback(() => {
    throw ErrorHandler.networkError()
  }, [])

  const throwAuthError = useCallback(() => {
    throw ErrorHandler.authError()
  }, [])

  const throwValidationError = useCallback((field: string) => {
    throw ErrorHandler.validationError(field)
  }, [])

  return {
    handleError,
    handleAsyncError,
    throwNetworkError,
    throwAuthError,
    throwValidationError,
  }
}