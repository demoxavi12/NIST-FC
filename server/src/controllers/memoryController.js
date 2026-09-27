import * as memoryService from '../services/memoryService.js'
import ApiError from '../utils/ApiError.js'
import { sendSuccess } from '../utils/apiResponse.js'

/** GET /api/memories — public, published only, newest first. */
export async function listMemories(req, res) {
  const { memories, pagination } = await memoryService.listPublishedMemories(req.validated.query)
  sendSuccess(res, { data: memories, pagination, message: 'Memories retrieved successfully' })
}

/** GET /api/memories/:slug — public; includes previous (older) / next (newer). */
export async function getMemoryBySlug(req, res) {
  const data = await memoryService.getPublishedMemoryBySlug(req.params.slug)
  sendSuccess(res, { data, message: 'Memory retrieved successfully' })
}

/** GET /api/admin/memories — admin; drafts included. */
export async function listAdminMemories(req, res) {
  const { memories, pagination } = await memoryService.listAdminMemories(req.validated.query)
  sendSuccess(res, { data: memories, pagination, message: 'Memories retrieved successfully' })
}

/** GET /api/admin/memories/:id — admin; loads the edit form. */
export async function getMemoryById(req, res) {
  const memory = await memoryService.getMemoryById(req.validated.params.id)
  sendSuccess(res, { data: { memory }, message: 'Memory retrieved successfully' })
}

/** POST /api/memories — admin; multipart with a required `coverImage`. */
export async function createMemory(req, res) {
  const memory = await memoryService.createMemory(req.body, req.files)
  sendSuccess(res, { statusCode: 201, data: { memory }, message: 'Memory created successfully' })
}

/** PATCH /api/memories/:id — admin; only supplied fields change. */
export async function updateMemory(req, res) {
  const { expectedUpdatedAt, ...changes } = req.body
  const hasFiles = Boolean(req.files?.coverImage?.length || req.files?.photos?.length)
  if (Object.keys(changes).length === 0 && !hasFiles) {
    throw new ApiError(400, 'Validation failed', {
      body: 'Provide at least one field, photo or cover image to update',
    })
  }
  const memory = await memoryService.updateMemory(
    req.validated.params.id,
    { ...changes, expectedUpdatedAt },
    req.files,
  )
  sendSuccess(res, { data: { memory }, message: 'Memory updated successfully' })
}

/** DELETE /api/memories/:id — admin; permanent (unpublishing hides instead). */
export async function deleteMemory(req, res) {
  await memoryService.deleteMemory(req.validated.params.id)
  sendSuccess(res, { message: 'Memory deleted successfully' })
}
