import mongoose from 'mongoose'
import ApiError from '../utils/ApiError.js'
import { errorBody } from '../utils/apiResponse.js'

/** Unmatched routes (docs/API.md §42). */
export function notFound(req, res, next) {
  next(new ApiError(404, 'API route not found'))
}

/**
 * Maps known error types to a client-safe ApiError.
 * Returns null for unexpected errors, which become a generic 500.
 */
function toApiError(err) {
  if (err instanceof ApiError) return err

  // express.json() / body-parser
  if (err.type === 'entity.parse.failed') {
    return new ApiError(400, 'Invalid JSON in request body')
  }
  if (err.type === 'entity.too.large') {
    return new ApiError(413, 'Request body too large')
  }
  if (err.type && err.status >= 400 && err.status < 500) {
    return new ApiError(400, 'Invalid request body')
  }

  // Mongoose
  if (err instanceof mongoose.Error.CastError) {
    return new ApiError(400, `Invalid ${err.path}`)
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(
      Object.entries(err.errors).map(([field, fieldError]) => [
        field,
        fieldError.message,
      ]),
    )
    return new ApiError(400, 'Validation failed', fields)
  }

  // MongoDB duplicate key (e.g. a unique slug)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue ?? {})
    return new ApiError(
      409,
      'Resource already exists',
      fields.length > 0
        ? Object.fromEntries(fields.map((field) => [field, 'Already exists']))
        : null,
    )
  }

  return null
}

/**
 * Central error handler: every error response follows
 * `{ success: false, message, error }` (docs/API.md §5).
 *
 * Unexpected errors return a generic 500 and are logged server-side. Stack
 * traces are logged in development only and never sent to the client.
 */
export function createErrorHandler({ isProduction }) {
  // Express identifies error handlers by their four parameters.
  return function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err)

    const apiError = toApiError(err)
    if (apiError) {
      return res
        .status(apiError.statusCode)
        .json(errorBody(apiError.message, apiError.error))
    }

    console.error(
      `Unhandled error on ${req.method} ${req.path}:`,
      isProduction ? `${err.name}: ${err.message}` : err,
    )
    return res.status(500).json(errorBody('Internal server error'))
  }
}
