import ApiError from '../utils/ApiError.js'

/**
 * Validates part of the request against a Joi schema. On failure responds
 * through the error middleware with 400 "Validation failed" and field-level
 * messages in `error` (docs/API.md §5). Unknown fields are removed.
 *
 * - `body` (default): req.body is replaced with the validated value.
 * - `query` / `params`: Express 5 does not allow replacing req.query, so the
 *   validated values are stored in `req.validated.query` / `req.validated.params`.
 */
export function validate(schema, source = 'body') {
  return function validateRequest(req, res, next) {
    const { value, error } = schema.validate(req[source] ?? {}, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const fields = {}
      for (const detail of error.details) {
        const field = detail.path.join('.') || source
        fields[field] ??= detail.message
      }
      throw new ApiError(400, 'Validation failed', fields)
    }

    if (source === 'body') {
      req.body = value
    } else {
      req.validated = { ...req.validated, [source]: value }
    }
    next()
  }
}
