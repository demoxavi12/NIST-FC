import { Router } from 'express'
import * as timelineController from '../controllers/timelineController.js'
import { createRequireAuth } from '../middleware/authMiddleware.js'
import { createPhotoUpload } from '../middleware/uploadMiddleware.js'
import { validate } from '../middleware/validateRequest.js'
import {
  adminListTimelineQuerySchema,
  createTimelineEventSchema,
  reorderTimelineSchema,
  timelineIdParamSchema,
  updateTimelineEventSchema,
} from '../validators/timelineValidators.js'

/**
 * Mounted at /api/timeline (docs/API.md §15–§17). The read is public and
 * returns published events only; writes require an authenticated admin.
 * Authentication runs before uploads are parsed.
 */
export function createTimelineRoutes(config) {
  const router = Router()
  const requireAuth = createRequireAuth(config)
  const imageUpload = createPhotoUpload(config.uploads, { fieldName: 'image' })

  router.get('/', timelineController.listTimeline)

  router.post(
    '/',
    requireAuth,
    imageUpload,
    validate(createTimelineEventSchema),
    timelineController.createTimelineEvent,
  )
  // Registered before /:id so "reorder" is never treated as an event id.
  router.patch(
    '/reorder',
    requireAuth,
    validate(reorderTimelineSchema),
    timelineController.reorderTimeline,
  )
  router.patch(
    '/:id',
    requireAuth,
    validate(timelineIdParamSchema, 'params'),
    imageUpload,
    validate(updateTimelineEventSchema),
    timelineController.updateTimelineEvent,
  )
  router.delete(
    '/:id',
    requireAuth,
    validate(timelineIdParamSchema, 'params'),
    timelineController.deleteTimelineEvent,
  )

  return router
}

/** Mounted at /api/admin/timeline — admin-only reads, drafts included. */
export function createAdminTimelineRoutes(config) {
  const router = Router()
  router.use(createRequireAuth(config))

  router.get(
    '/',
    validate(adminListTimelineQuerySchema, 'query'),
    timelineController.listAdminTimeline,
  )
  router.get(
    '/:id',
    validate(timelineIdParamSchema, 'params'),
    timelineController.getTimelineEventById,
  )

  return router
}
