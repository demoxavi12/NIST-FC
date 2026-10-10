import * as timelineService from '../services/timelineService.js'
import ApiError from '../utils/ApiError.js'
import { sendSuccess } from '../utils/apiResponse.js'

/** GET /api/timeline — public, published events only, in display order. */
export async function listTimeline(req, res) {
  const events = await timelineService.listPublishedTimeline()
  sendSuccess(res, { data: events, message: 'Timeline retrieved successfully' })
}

/** GET /api/admin/timeline — admin; drafts included. */
export async function listAdminTimeline(req, res) {
  const events = await timelineService.listAdminTimeline(req.validated.query)
  sendSuccess(res, { data: events, message: 'Timeline retrieved successfully' })
}

/** GET /api/admin/timeline/:id — admin; loads the edit form. */
export async function getTimelineEventById(req, res) {
  const event = await timelineService.getTimelineEventById(req.validated.params.id)
  sendSuccess(res, { data: { event }, message: 'Timeline event retrieved successfully' })
}

/** POST /api/timeline — admin; multipart with an optional `image`. */
export async function createTimelineEvent(req, res) {
  const event = await timelineService.createTimelineEvent(req.body, req.file)
  sendSuccess(res, { statusCode: 201, data: { event }, message: 'Timeline event created successfully' })
}

/** PATCH /api/timeline/:id — admin; only supplied fields change. */
export async function updateTimelineEvent(req, res) {
  const { expectedUpdatedAt, ...changes } = req.body
  if (Object.keys(changes).length === 0 && !req.file) {
    throw new ApiError(400, 'Validation failed', {
      body: 'Provide at least one field or an image to update',
    })
  }
  const event = await timelineService.updateTimelineEvent(
    req.validated.params.id,
    { ...changes, expectedUpdatedAt },
    req.file,
  )
  sendSuccess(res, { data: { event }, message: 'Timeline event updated successfully' })
}

/** PATCH /api/timeline/reorder — admin; saves the complete display order. */
export async function reorderTimeline(req, res) {
  await timelineService.reorderTimeline(req.body.items)
  sendSuccess(res, { message: 'Timeline reordered successfully' })
}

/** DELETE /api/timeline/:id — admin; permanent (unpublishing hides instead). */
export async function deleteTimelineEvent(req, res) {
  await timelineService.deleteTimelineEvent(req.validated.params.id)
  sendSuccess(res, { message: 'Timeline event deleted successfully' })
}
