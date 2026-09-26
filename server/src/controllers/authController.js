import { authenticateAdmin, signAccessToken } from '../services/authService.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie.js'

/** Authentication endpoints (docs/API.md §9). */
export function createAuthController(config) {
  return {
    /** POST /api/auth/login — body already validated by loginSchema. */
    async login(req, res) {
      const admin = await authenticateAdmin(req.body.email, req.body.password)
      setAuthCookie(res, signAccessToken(admin, config.jwt), config)
      sendSuccess(res, { data: { admin }, message: 'Login successful' })
    },

    /** POST /api/auth/logout — requires authentication. */
    logout(req, res) {
      clearAuthCookie(res, config)
      sendSuccess(res, { message: 'Logout successful' })
    },

    /** GET /api/auth/me — requires authentication. */
    me(req, res) {
      sendSuccess(res, {
        data: { admin: req.admin },
        message: 'Authenticated admin retrieved successfully',
      })
    },
  }
}
