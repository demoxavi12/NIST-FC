/**
 * Response bodies for the API contract (docs/API.md §4–§5).
 * Controllers use sendSuccess; errors are thrown as ApiError and formatted by
 * errorMiddleware, which uses errorBody.
 */

export function sendSuccess(
  res,
  { statusCode = 200, data = null, message, pagination, filters } = {},
) {
  const body = { success: true, data }
  if (pagination) body.pagination = pagination
  // Filter options for list pages, e.g. GET /api/players (docs/API.md §10).
  if (filters) body.filters = filters
  body.message = message
  return res.status(statusCode).json(body)
}

export function errorBody(message, error = null) {
  return { success: false, message, error }
}
