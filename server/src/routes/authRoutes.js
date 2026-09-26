import { Router } from 'express'
import { createAuthController } from '../controllers/authController.js'
import { createRequireAuth } from '../middleware/authMiddleware.js'
import { createLoginRateLimiter } from '../middleware/rateLimitMiddleware.js'
import { validate } from '../middleware/validateRequest.js'
import { loginSchema } from '../validators/authValidators.js'

/** Mounted at /api/auth. */
export function createAuthRoutes(config) {
  const router = Router()
  const controller = createAuthController(config)
  const requireAuth = createRequireAuth(config)

  // Session responses must never be cached by browsers or proxies.
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.post(
    '/login',
    createLoginRateLimiter(),
    validate(loginSchema),
    controller.login,
  )
  router.post('/logout', requireAuth, controller.logout)
  router.get('/me', requireAuth, controller.me)

  return router
}
