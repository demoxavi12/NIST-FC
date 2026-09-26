import { getAdminFromToken } from '../services/authService.js'
import ApiError from '../utils/ApiError.js'

/**
 * Creates `requireAuth` (docs/AUTH.md §17–§19): reads the JWT from the
 * configured cookie, verifies it, loads the admin and attaches
 * `req.admin = { id, name, email, role }`.
 * Missing, invalid or expired sessions get 401 "Authentication required".
 */
export function createRequireAuth(config) {
  return async function requireAuth(req, res, next) {
    const token = req.cookies?.[config.cookie.name]
    const admin = token ? await getAdminFromToken(token, config.jwt) : null

    if (!admin) throw new ApiError(401, 'Authentication required')

    req.admin = admin
    next()
  }
}

/**
 * Restricts a route to the given roles (docs/AUTH.md §24).
 * Use after requireAuth, e.g. requireRole('superAdmin').
 */
export function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!req.admin) throw new ApiError(401, 'Authentication required')
    if (!roles.includes(req.admin.role)) {
      throw new ApiError(403, 'Insufficient permissions')
    }
    next()
  }
}
