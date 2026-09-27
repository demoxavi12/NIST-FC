import { Router } from 'express'
import * as memoryController from '../controllers/memoryController.js'
import { createRequireAuth } from '../middleware/authMiddleware.js'
import { createMemoryUpload, requireCoverImage } from '../middleware/uploadMiddleware.js'
import { validate } from '../middleware/validateRequest.js'
import {
  adminListMemoriesQuerySchema,
  createMemorySchema,
  listMemoriesQuerySchema,
  memoryIdParamSchema,
  updateMemorySchema,
} from '../validators/memoryValidators.js'

/**
 * Mounted at /api/memories (docs/API.md §12–§14). Reads are public and
 * return published memories only; writes require an authenticated admin.
 * Authentication runs before uploads are parsed.
 */
export function createMemoryRoutes(config) {
  const router = Router()
  const requireAuth = createRequireAuth(config)
  const memoryUpload = createMemoryUpload(config.uploads)

  router.get('/', validate(listMemoriesQuerySchema, 'query'), memoryController.listMemories)
  router.get('/:slug', memoryController.getMemoryBySlug)

  router.post(
    '/',
    requireAuth,
    memoryUpload,
    validate(createMemorySchema),
    requireCoverImage,
    memoryController.createMemory,
  )
  router.patch(
    '/:id',
    requireAuth,
    validate(memoryIdParamSchema, 'params'),
    memoryUpload,
    validate(updateMemorySchema),
    memoryController.updateMemory,
  )
  router.delete(
    '/:id',
    requireAuth,
    validate(memoryIdParamSchema, 'params'),
    memoryController.deleteMemory,
  )

  return router
}

/** Mounted at /api/admin/memories — admin-only reads, drafts included. */
export function createAdminMemoryRoutes(config) {
  const router = Router()
  router.use(createRequireAuth(config))

  router.get('/', validate(adminListMemoriesQuerySchema, 'query'), memoryController.listAdminMemories)
  router.get('/:id', validate(memoryIdParamSchema, 'params'), memoryController.getMemoryById)

  return router
}
