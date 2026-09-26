/**
 * An expected error with an HTTP status and a client-safe message.
 * Throw it from controllers/services; errorMiddleware turns it into
 * `{ success: false, message, error }` (docs/API.md §5).
 *
 * `error` is null unless there is safe structured detail, such as
 * field-level validation messages.
 */
class ApiError extends Error {
  constructor(statusCode, message, error = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.error = error
  }
}

export default ApiError
