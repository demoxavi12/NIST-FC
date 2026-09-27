import { Router } from 'express'
import * as playerController from '../controllers/playerController.js'
import { createRequireAuth } from '../middleware/authMiddleware.js'
import { createPhotoUpload, requirePhoto } from '../middleware/uploadMiddleware.js'
import { validate } from '../middleware/validateRequest.js'
import {
  createPlayerSchema,
  listPlayersQuerySchema,
  playerIdParamSchema,
  updatePlayerSchema,
} from '../validators/playerValidators.js'

/**
 * Mounted at /api/players (docs/API.md §10–§11). Reads are public; writes
 * require an authenticated admin. Authentication runs before the upload is
 * parsed, so unauthenticated uploads are rejected unread.
 */
export function createPlayerRoutes(config) {
  const router = Router()
  const requireAuth = createRequireAuth(config)
  const photoUpload = createPhotoUpload(config.uploads)

  router.get('/', validate(listPlayersQuerySchema, 'query'), playerController.listPlayers)
  router.get('/:slug', playerController.getPlayerBySlug)

  router.post(
    '/',
    requireAuth,
    photoUpload,
    validate(createPlayerSchema),
    requirePhoto,
    playerController.createPlayer,
  )
  router.patch(
    '/:id',
    requireAuth,
    validate(playerIdParamSchema, 'params'),
    photoUpload,
    validate(updatePlayerSchema),
    playerController.updatePlayer,
  )
  router.delete(
    '/:id',
    requireAuth,
    validate(playerIdParamSchema, 'params'),
    playerController.deletePlayer,
  )

  return router
}

/** Mounted at /api/admin/players — admin-only reads. */
export function createAdminPlayerRoutes(config) {
  const router = Router()

  router.get(
    '/:id',
    createRequireAuth(config),
    validate(playerIdParamSchema, 'params'),
    playerController.getPlayerById,
  )

  return router
}
