/**
 * Response bodies for the API contract (docs/API.md §4–§5).
 * Controllers use sendSuccess; errors are thrown as ApiError and formatted by
 * errorMiddleware, which uses errorBody.
 */

export function sendSuccess(
  res,
  { statusCode = 200, data = null, message, pagination } = {},
) {
  const body = { success: true, data }
  if (pagination) body.pagination = pagination
  body.message = message
  return res.status(statusCode).json(body)
}

export function errorBody(message, error = null) {
  return { success: false, message, error }
}
