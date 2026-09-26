import { Router } from 'express'
import { createAuthRoutes } from './authRoutes.js'
import healthRoutes from './healthRoutes.js'

/**
 * Builds the /api router. Created per app so each app instance has its own
 * config and rate-limit state. Resource routers are added as each phase lands.
 */
export function createApiRouter(config) {
  const router = Router()

  router.use('/health', healthRoutes)
  router.use('/auth', createAuthRoutes(config))

  return router
}
