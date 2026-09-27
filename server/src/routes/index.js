import { Router } from 'express'
import { createAuthRoutes } from './authRoutes.js'
import healthRoutes from './healthRoutes.js'
import { createAdminMemoryRoutes, createMemoryRoutes } from './memoryRoutes.js'
import { createAdminPlayerRoutes, createPlayerRoutes } from './playerRoutes.js'

/**
 * Builds the /api router. Created per app so each app instance has its own
 * config and rate-limit state. Resource routers are added as each phase lands.
 */
export function createApiRouter(config) {
  const router = Router()

  router.use('/health', healthRoutes)
  router.use('/auth', createAuthRoutes(config))
  router.use('/players', createPlayerRoutes(config))
  router.use('/admin/players', createAdminPlayerRoutes(config))
  router.use('/memories', createMemoryRoutes(config))
  router.use('/admin/memories', createAdminMemoryRoutes(config))

  return router
}
