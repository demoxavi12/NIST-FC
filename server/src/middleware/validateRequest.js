import ApiError from '../utils/ApiError.js'

/**
 * Validates req.body against a Joi schema. On failure responds through the
 * error middleware with 400 "Validation failed" and field-level messages in
 * `error` (docs/API.md §5). On success replaces req.body with the validated,
 * normalised value (unknown fields removed).
 */
export function validate(schema) {
  return function validateRequest(req, res, next) {
    const { value, error } = schema.validate(req.body ?? {}, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const fields = {}
      for (const detail of error.details) {
        const field = detail.path.join('.') || 'body'
        fields[field] ??= detail.message
      }
      throw new ApiError(400, 'Validation failed', fields)
    }

    req.body = value
    next()
  }
}
