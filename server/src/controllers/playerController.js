import * as playerService from '../services/playerService.js'
import ApiError from '../utils/ApiError.js'
import { sendSuccess } from '../utils/apiResponse.js'

/** GET /api/players — public, paginated, searchable and filterable. */
export async function listPlayers(req, res) {
  const { players, pagination, filters } = await playerService.listPlayers(
    req.validated.query,
  )
  sendSuccess(res, {
    data: players,
    pagination,
    filters,
    message: 'Players retrieved successfully',
  })
}

/**
 * GET /api/players/:slug — public. `memories` is always empty until memories
 * exist (Phase 5); the response shape is already final (docs/API.md §10).
 */
export async function getPlayerBySlug(req, res) {
  const player = await playerService.getPlayerBySlug(req.params.slug)
  sendSuccess(res, {
    data: { player, memories: [] },
    message: 'Player retrieved successfully',
  })
}

/** GET /api/admin/players/:id — admin; loads the edit form. */
export async function getPlayerById(req, res) {
  const player = await playerService.getPlayerById(req.validated.params.id)
  sendSuccess(res, { data: { player }, message: 'Player retrieved successfully' })
}

/** POST /api/players — admin; multipart with a required `photo`. */
export async function createPlayer(req, res) {
  const player = await playerService.createPlayer(req.body, req.file)
  sendSuccess(res, {
    statusCode: 201,
    data: { player },
    message: 'Player created successfully',
  })
}

/** PATCH /api/players/:id — admin; only supplied fields change. */
export async function updatePlayer(req, res) {
  if (Object.keys(req.body).length === 0 && !req.file) {
    throw new ApiError(400, 'Validation failed', {
      body: 'Provide at least one field or a new photo to update',
    })
  }
  const player = await playerService.updatePlayer(
    req.validated.params.id,
    req.body,
    req.file,
  )
  sendSuccess(res, { data: { player }, message: 'Player updated successfully' })
}

/** DELETE /api/players/:id — admin; permanent (archiving uses status). */
export async function deletePlayer(req, res) {
  await playerService.deletePlayer(req.validated.params.id)
  sendSuccess(res, { message: 'Player deleted successfully' })
}
