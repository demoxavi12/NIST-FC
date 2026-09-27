import mongoose from 'mongoose'
import Memory from '../models/Memory.js'
import Player from '../models/Player.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegExp } from '../utils/slugify.js'
import { isDuplicateSlugError, uniqueSlug } from '../utils/uniqueSlug.js'
import { cloudinaryService } from './cloudinaryService.js'

export const PLAYER_PHOTO_FOLDER = 'nist-fc/players'

// A secondary key keeps page boundaries stable when primary values tie.
const SORTS = {
  name: { name: 1, _id: 1 },
  '-name': { name: -1, _id: 1 },
  batch: { batch: 1, name: 1, _id: 1 },
  '-batch': { batch: -1, name: 1, _id: 1 },
}

const notFound = () => new ApiError(404, 'Player not found')

/** The player fields returned by the API. */
export function toPlayerResponse(player) {
  return {
    id: String(player._id),
    name: player.name,
    slug: player.slug,
    photo: { url: player.photo.url, publicId: player.photo.publicId },
    position: player.position,
    batch: player.batch,
    branch: player.branch,
    bio: player.bio ?? '',
    status: player.status,
    createdAt: player.createdAt,
    updatedAt: player.updatedAt,
  }
}

/**
 * Builds the MongoDB filter from validated query values. `search` is escaped
 * and matched case-insensitively anywhere in the name. The $regex operator is
 * built by the server, so it is marked trusted for Mongoose's sanitizeFilter;
 * user input can never add operators.
 */
export function buildPlayerFilter({ search, status, position, batch, branch }) {
  const filter = {}
  if (status) filter.status = status
  if (position) filter.position = position
  if (batch) filter.batch = batch
  if (branch) filter.branch = branch
  if (search) {
    filter.name = mongoose.trusted({ $regex: escapeRegExp(search), $options: 'i' })
  }
  return filter
}

/**
 * GET /api/players: a page of players plus the batch and branch values that
 * exist, for the filter dropdowns.
 */
export async function listPlayers(query) {
  const { page, limit, sort } = query
  const filter = buildPlayerFilter(query)

  const [players, total, batches, branches] = await Promise.all([
    Player.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Player.countDocuments(filter),
    Player.distinct('batch'),
    Player.distinct('branch'),
  ])

  return {
    players: players.map(toPlayerResponse),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    filters: {
      batches: [...batches].sort().reverse(),
      branches: [...branches].sort((a, b) => a.localeCompare(b)),
    },
  }
}

export async function getPlayerBySlug(slug) {
  const player = await Player.findOne({ slug: String(slug).toLowerCase() }).lean()
  if (!player) throw notFound()
  return toPlayerResponse(player)
}

export async function getPlayerById(id) {
  const player = await Player.findById(id).lean()
  if (!player) throw notFound()
  return toPlayerResponse(player)
}

/** A slug not used by any other player (see utils/uniqueSlug.js). */
export function generateUniqueSlug(name) {
  return uniqueSlug(Player, name, 'player')
}

/**
 * Creates a player: upload the photo, then save. If saving fails the uploaded
 * photo is deleted. A concurrent request taking the same slug is retried once.
 */
export async function createPlayer(fields, file) {
  const photo = await cloudinaryService.uploadImage(file.buffer, {
    folder: PLAYER_PHOTO_FOLDER,
  })

  try {
    for (let attempt = 1; ; attempt += 1) {
      const slug = await generateUniqueSlug(fields.name)
      try {
        const player = await Player.create({ ...fields, slug, photo })
        return toPlayerResponse(player)
      } catch (error) {
        if (!isDuplicateSlugError(error) || attempt === 2) throw error
      }
    }
  } catch (error) {
    await cloudinaryService.deleteImageQuietly(photo.publicId)
    throw error
  }
}

/**
 * Updates only the supplied fields. The slug stays the same when the name
 * changes, so shared profile links keep working. A new photo replaces the old
 * one: the old image is deleted only after the player is saved; if saving
 * fails the new image is deleted instead.
 */
export async function updatePlayer(id, fields, file) {
  const player = await Player.findById(id)
  if (!player) throw notFound()

  const previousPhoto = player.photo
  const newPhoto = file
    ? await cloudinaryService.uploadImage(file.buffer, { folder: PLAYER_PHOTO_FOLDER })
    : null

  player.set(fields)
  if (newPhoto) player.photo = newPhoto

  try {
    await player.save()
  } catch (error) {
    if (newPhoto) await cloudinaryService.deleteImageQuietly(newPhoto.publicId)
    throw error
  }

  if (newPhoto) await cloudinaryService.deleteImageQuietly(previousPhoto.publicId)
  return toPlayerResponse(player)
}

/** Removes the player from every memory that references them (docs/AUTH.md §30). */
async function removePlayerFromMemories(playerId) {
  await Memory.updateMany({ players: playerId }, { $pull: { players: playerId } })
}

/**
 * Permanently deletes a player — an exceptional admin action; players who
 * leave are marked "former" instead. Memory references are removed and the
 * player is deleted before the photo, so a Cloudinary failure can only leave
 * an orphaned image, never a player without a photo.
 */
export async function deletePlayer(id) {
  const player = await Player.findById(id).lean()
  if (!player) throw notFound()

  await removePlayerFromMemories(player._id)
  await Player.deleteOne({ _id: player._id })
  await cloudinaryService.deleteImageQuietly(player.photo.publicId)
}
