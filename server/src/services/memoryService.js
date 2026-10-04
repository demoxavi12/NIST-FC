import mongoose from 'mongoose'
import Memory, { MAX_GALLERY_PHOTOS } from '../models/Memory.js'
import Player from '../models/Player.js'
import ApiError from '../utils/ApiError.js'
import { escapeRegExp } from '../utils/slugify.js'
import { isDuplicateSlugError, uniqueSlug } from '../utils/uniqueSlug.js'
import { cloudinaryService } from './cloudinaryService.js'

export const MEMORY_FOLDER_ROOT = 'nist-fc/memories'
// Latest → oldest; the id breaks ties between memories on the same day, so
// the list and previous/next navigation always agree.
const NEWEST_FIRST = { date: -1, _id: -1 }
const EXCERPT_LENGTH = 200
// The player fields shown on a memory (never the whole player document).
const PLAYER_FIELDS = 'name slug photo position status'
const NAV_FIELDS = 'title slug date coverImage'
export const PLAYER_PROFILE_MEMORY_LIMIT = 12

/** Images for a memory live in their own folder: nist-fc/memories/<memoryId>. */
export const memoryFolder = (memoryId) => `${MEMORY_FOLDER_ROOT}/${memoryId}`

const notFound = () => new ApiError(404, 'Memory not found')
const image = (value) => ({ url: value.url, publicId: value.publicId })

function excerpt(description) {
  const text = (description ?? '').replace(/\s+/g, ' ').trim()
  return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH - 1)}…` : text
}

function toPlayerChip(player) {
  return {
    id: String(player._id),
    name: player.name,
    slug: player.slug,
    photo: image(player.photo),
    position: player.position,
    status: player.status,
  }
}

/** A memory in lists (cards, admin table): no gallery or players. */
export function toMemorySummary(memory, { admin = false } = {}) {
  const summary = {
    id: String(memory._id),
    title: memory.title,
    slug: memory.slug,
    date: memory.date,
    location: memory.location ?? '',
    excerpt: excerpt(memory.description),
    coverImage: image(memory.coverImage),
    photoCount: memory.photos?.length ?? 0,
  }
  if (admin) {
    summary.published = memory.published
    summary.updatedAt = memory.updatedAt
  }
  return summary
}

/** The complete memory. `players` must be populated. */
export function toMemoryResponse(memory) {
  return {
    id: String(memory._id),
    title: memory.title,
    slug: memory.slug,
    description: memory.description ?? '',
    date: memory.date,
    location: memory.location ?? '',
    coverImage: image(memory.coverImage),
    photos: memory.photos.map(image),
    // Players deleted in the meantime are dropped by populate.
    players: memory.players
      .filter(Boolean)
      .map(toPlayerChip)
      .sort((a, b) => a.name.localeCompare(b.name)),
    tags: [...memory.tags],
    published: memory.published,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  }
}

const toNavItem = (memory) =>
  memory
    ? { title: memory.title, slug: memory.slug, date: memory.date, coverImage: image(memory.coverImage) }
    : null

async function paginate(filter, { page, limit }, mapItem) {
  const [memories, total] = await Promise.all([
    Memory.find(filter)
      .sort(NEWEST_FIRST)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-players')
      .lean(),
    Memory.countDocuments(filter),
  ])
  return {
    memories: memories.map(mapItem),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

/** GET /api/memories: published memories only, newest first. */
export function listPublishedMemories({ page, limit, tag, player }) {
  const filter = { published: true }
  if (tag) filter.tags = tag
  if (player) filter.players = player
  return paginate(filter, { page, limit }, (memory) => toMemorySummary(memory))
}

/** GET /api/admin/memories: drafts included; optional title search. */
export function listAdminMemories({ page, limit, search, published }) {
  const filter = {}
  if (published !== undefined) filter.published = published
  if (search) {
    // Built by the server from escaped input, so trusted for sanitizeFilter.
    filter.title = mongoose.trusted({ $regex: escapeRegExp(search), $options: 'i' })
  }
  return paginate(filter, { page, limit }, (memory) => toMemorySummary(memory, { admin: true }))
}

/**
 * The published memories a player appears in, newest first (for the player
 * profile, docs/API.md §10).
 */
export async function listPlayerMemories(playerId) {
  const memories = await Memory.find({ published: true, players: playerId })
    .sort(NEWEST_FIRST)
    .limit(PLAYER_PROFILE_MEMORY_LIMIT)
    .select('-players')
    .lean()
  return memories.map((memory) => toMemorySummary(memory))
}

/**
 * The published neighbours of a memory in date order: `previous` is the next
 * older memory, `next` the next newer one. The comparison operators are
 * built by the server, so they are trusted for sanitizeFilter.
 */
async function findNeighbours(memory) {
  const { date, _id } = memory
  const [older, newer] = await Promise.all([
    Memory.findOne({
      published: true,
      $or: [{ date: mongoose.trusted({ $lt: date }) }, { date, _id: mongoose.trusted({ $lt: _id }) }],
    })
      .sort(NEWEST_FIRST)
      .select(NAV_FIELDS)
      .lean(),
    Memory.findOne({
      published: true,
      $or: [{ date: mongoose.trusted({ $gt: date }) }, { date, _id: mongoose.trusted({ $gt: _id }) }],
    })
      .sort({ date: 1, _id: 1 })
      .select(NAV_FIELDS)
      .lean(),
  ])
  return { previous: toNavItem(older), next: toNavItem(newer) }
}

/** GET /api/memories/:slug: published only; drafts are "not found". */
export async function getPublishedMemoryBySlug(slug) {
  const memory = await Memory.findOne({ slug: String(slug).toLowerCase(), published: true })
    .populate('players', PLAYER_FIELDS)
    .lean()
  if (!memory) throw notFound()

  const { previous, next } = await findNeighbours(memory)
  return { memory: toMemoryResponse(memory), previous, next }
}

/** GET /api/admin/memories/:id: any memory, including drafts. */
export async function getMemoryById(id) {
  const memory = await Memory.findById(id).populate('players', PLAYER_FIELDS).lean()
  if (!memory) throw notFound()
  return toMemoryResponse(memory)
}

/** Every linked player must exist (docs/DATABASE.md §16). */
async function assertPlayersExist(playerIds) {
  if (!playerIds?.length) return
  const found = await Player.countDocuments({ _id: mongoose.trusted({ $in: playerIds }) })
  if (found !== playerIds.length) {
    throw new ApiError(400, 'Validation failed', {
      players: 'One or more selected players do not exist',
    })
  }
}

function assertGallerySize(count) {
  if (count > MAX_GALLERY_PHOTOS) {
    throw new ApiError(400, 'Validation failed', {
      photos: `A memory can have at most ${MAX_GALLERY_PHOTOS} photos`,
    })
  }
}

const buffersOf = (files) => (files ?? []).map((file) => file.buffer)

async function deleteImagesQuietly(images) {
  await Promise.all(images.map((img) => cloudinaryService.deleteImageQuietly(img.publicId)))
}

/** Undoes a failed create: deletes its uploaded images, then its folder. */
async function rollbackCreate(images, folder) {
  await deleteImagesQuietly(images)
  await cloudinaryService.deleteFolderQuietly(folder)
}

/**
 * Creates a memory: upload the cover and gallery (all-or-nothing), then save.
 * If saving fails, every uploaded image and the memory's folder are deleted.
 * The id is chosen first so the images go straight into the memory's own
 * folder.
 */
export async function createMemory(fields, files) {
  await assertPlayersExist(fields.players)
  assertGallerySize(files.photos?.length ?? 0)

  const _id = new mongoose.Types.ObjectId()
  const folder = memoryFolder(_id)

  const coverImage = await cloudinaryService.uploadImage(files.coverImage[0].buffer, { folder })
  let photos
  try {
    photos = await cloudinaryService.uploadImages(buffersOf(files.photos), { folder })
  } catch (error) {
    await rollbackCreate([coverImage], folder)
    throw error
  }

  try {
    for (let attempt = 1; ; attempt += 1) {
      const slug = await uniqueSlug(Memory, fields.title, 'memory')
      try {
        await Memory.create({ ...fields, _id, slug, coverImage, photos })
        break
      } catch (error) {
        if (!isDuplicateSlugError(error) || attempt === 2) throw error
      }
    }
  } catch (error) {
    await rollbackCreate([coverImage, ...photos], folder)
    throw error
  }

  return getMemoryById(_id)
}

const staleEdit = () =>
  new ApiError(409, 'This memory was changed by someone else. Reload and try again.')

/**
 * Updates only the supplied fields (docs/API.md §13):
 * - `photos` files are appended to the gallery (upload order);
 * - `removePhotos` lists gallery photos to remove;
 * - a `coverImage` file replaces the cover.
 * New images are uploaded first (all-or-nothing) and deleted again if the
 * save fails; replaced and removed images are deleted only after the save.
 * The slug never changes. A stale `expectedUpdatedAt`, or a concurrent save,
 * returns 409.
 */
export async function updateMemory(id, fields, files = {}) {
  const memory = await Memory.findById(id)
  if (!memory) throw notFound()

  const { removePhotos = [], expectedUpdatedAt, ...changes } = fields
  if (expectedUpdatedAt && memory.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
    throw staleEdit()
  }
  if (changes.players) await assertPlayersExist(changes.players)

  const galleryIds = new Set(memory.photos.map((photo) => photo.publicId))
  if (removePhotos.some((publicId) => !galleryIds.has(publicId))) {
    throw new ApiError(400, 'Validation failed', {
      removePhotos: 'Some photos to remove do not belong to this memory',
    })
  }
  const newPhotoFiles = files.photos ?? []
  assertGallerySize(memory.photos.length - removePhotos.length + newPhotoFiles.length)

  // Upload new images (all-or-nothing).
  const folder = memoryFolder(memory._id)
  const uploaded = []
  let newCover = null
  let newPhotos
  try {
    if (files.coverImage?.length) {
      newCover = await cloudinaryService.uploadImage(files.coverImage[0].buffer, { folder })
      uploaded.push(newCover)
    }
    newPhotos = await cloudinaryService.uploadImages(buffersOf(newPhotoFiles), { folder })
    uploaded.push(...newPhotos)
  } catch (error) {
    await deleteImagesQuietly(uploaded)
    throw error
  }

  const previousCover = image(memory.coverImage)
  const removing = new Set(removePhotos)
  const removedPhotos = memory.photos.filter((photo) => removing.has(photo.publicId)).map(image)

  memory.set(changes)
  if (newCover) memory.coverImage = newCover
  if (removing.size > 0 || newPhotos.length > 0) {
    memory.photos = [
      ...memory.photos.filter((photo) => !removing.has(photo.publicId)).map(image),
      ...newPhotos,
    ]
  }

  try {
    await memory.save()
  } catch (error) {
    await deleteImagesQuietly(uploaded)
    if (error instanceof mongoose.Error.VersionError) throw staleEdit()
    // Deleted by another admin while this edit was in progress.
    if (error instanceof mongoose.Error.DocumentNotFoundError) throw notFound()
    throw error
  }

  await deleteImagesQuietly([...(newCover ? [previousCover] : []), ...removedPhotos])
  return getMemoryById(memory._id)
}

/**
 * Removes the memory from timeline events that reference it (docs/AUTH.md
 * §31). Timeline events are implemented in Phase 6; until then nothing can
 * reference a memory.
 */
async function removeMemoryFromTimeline() {}

/**
 * Permanently deletes a memory (admins can unpublish instead). The memory is
 * deleted before its images, so a Cloudinary failure can only leave logged
 * orphan images, never a memory with missing images. Players are untouched.
 */
export async function deleteMemory(id) {
  const memory = await Memory.findById(id).lean()
  if (!memory) throw notFound()

  await removeMemoryFromTimeline(memory._id)
  await Memory.deleteOne({ _id: memory._id })
  await deleteImagesQuietly([memory.coverImage, ...memory.photos])
  await cloudinaryService.deleteFolderQuietly(memoryFolder(memory._id))
}
