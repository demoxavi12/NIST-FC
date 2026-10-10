import mongoose from 'mongoose'
import Memory from '../models/Memory.js'
import TimelineEvent from '../models/TimelineEvent.js'
import ApiError from '../utils/ApiError.js'
import { cloudinaryService } from './cloudinaryService.js'

export const TIMELINE_IMAGE_FOLDER = 'nist-fc/timeline'
// Display order everywhere; the id makes ties deterministic.
const DISPLAY_ORDER = { order: 1, _id: 1 }
const MEMORY_FIELDS = 'title slug coverImage published'
// Order changes are not content edits: they must not make an admin's open
// edit form stale, so they leave `updatedAt` untouched.
const ORDER_ONLY = { timestamps: false }

const notFound = () => new ApiError(404, 'Timeline event not found')
const staleEdit = () =>
  new ApiError(409, 'This timeline event was changed by someone else. Reload and try again.')
const staleOrder = () =>
  new ApiError(409, 'The timeline was changed by someone else. Reload and try again.')
const image = (value) => (value ? { url: value.url, publicId: value.publicId } : null)

/**
 * The linked memory as shown publicly: only while it exists and is published.
 * A deleted memory (populate returns null) or a draft gives no link.
 */
function publicMemory(memory) {
  if (!memory?.published) return null
  return { title: memory.title, slug: memory.slug, coverImage: image(memory.coverImage) }
}

/** The linked memory for admins, drafts included (flagged by `published`). */
function adminMemory(memory) {
  if (!memory?._id) return null
  return { id: String(memory._id), title: memory.title, slug: memory.slug, published: memory.published }
}

/** A timeline event as returned by the API. `memory` must be populated. */
export function toTimelineEventResponse(event, { admin = false } = {}) {
  const response = {
    id: String(event._id),
    title: event.title,
    year: event.year,
    date: event.date ?? null,
    description: event.description ?? '',
    image: image(event.image),
    category: event.category,
    memory: admin ? adminMemory(event.memory) : publicMemory(event.memory),
  }
  if (admin) {
    response.order = event.order
    response.published = event.published
    response.createdAt = event.createdAt
    response.updatedAt = event.updatedAt
  }
  return response
}

/** GET /api/timeline: every published event in display order (no pagination). */
export async function listPublishedTimeline() {
  const events = await TimelineEvent.find({ published: true })
    .sort(DISPLAY_ORDER)
    .populate('memory', MEMORY_FIELDS)
    .lean()
  return events.map((event) => toTimelineEventResponse(event))
}

/** GET /api/admin/timeline: all events (drafts included) in display order. */
export async function listAdminTimeline({ published } = {}) {
  const filter = published === undefined ? {} : { published }
  const events = await TimelineEvent.find(filter)
    .sort(DISPLAY_ORDER)
    .populate('memory', MEMORY_FIELDS)
    .lean()
  return events.map((event) => toTimelineEventResponse(event, { admin: true }))
}

/** GET /api/admin/timeline/:id */
export async function getTimelineEventById(id) {
  const event = await TimelineEvent.findById(id).populate('memory', MEMORY_FIELDS).lean()
  if (!event) throw notFound()
  return toTimelineEventResponse(event, { admin: true })
}

function assertDateInYear(date, year) {
  if (date && date.getUTCFullYear() !== year) {
    throw new ApiError(400, 'Validation failed', { date: 'Date must be in the selected year' })
  }
}

async function assertMemoryExists(memoryId) {
  if (!memoryId) return
  const exists = await Memory.exists({ _id: memoryId })
  if (!exists) {
    throw new ApiError(400, 'Validation failed', { memory: 'The selected memory does not exist' })
  }
}

/** An empty `date` or `memory` from a form means "none". */
function normalise(fields) {
  const normalised = { ...fields }
  if (normalised.date === '') normalised.date = null
  if (normalised.memory === '') normalised.memory = null
  return normalised
}

/**
 * Makes room for a new event in its chronological position and returns that
 * position: directly after the last event (in the current display order)
 * that comes earlier in time. Within a year, events without a date come
 * before dated ones. Later events move down one place.
 */
async function claimChronologicalOrder(year, date) {
  const earlier = [{ year: mongoose.trusted({ $lt: year }) }, { year, date: null }]
  if (date) earlier.push({ year, date: mongoose.trusted({ $lte: date }) })

  const previous = await TimelineEvent.findOne({ $or: earlier })
    .sort({ order: -1, _id: -1 })
    .select('order')
    .lean()
  const order = (previous?.order ?? 0) + 1

  await TimelineEvent.updateMany(
    { order: mongoose.trusted({ $gte: order }) },
    { $inc: { order: 1 } },
    ORDER_ONLY,
  )
  return order
}

const uploadImage = (file) =>
  cloudinaryService.uploadImage(file.buffer, { folder: TIMELINE_IMAGE_FOLDER })

/**
 * Creates an event in its chronological position (docs/DATABASE.md §6.4).
 * The image (optional) is uploaded first; if anything after that fails, it is
 * deleted again. A failure after positions were shifted can leave a gap in
 * `order`, which is harmless: order is only compared, never counted.
 */
export async function createTimelineEvent(fields, file) {
  const values = normalise(fields)
  assertDateInYear(values.date, values.year)
  await assertMemoryExists(values.memory)

  const newImage = file ? await uploadImage(file) : null
  let id
  try {
    const order = await claimChronologicalOrder(values.year, values.date)
    const event = await TimelineEvent.create({ ...values, image: newImage, order })
    id = event._id
  } catch (error) {
    if (newImage) await cloudinaryService.deleteImageQuietly(newImage.publicId)
    throw error
  }
  return getTimelineEventById(id)
}

/**
 * Updates only the supplied fields. The order never changes here (reorder
 * does that), even when the year changes. Staleness is checked before any
 * upload; a new image replaces the old one, `removeImage` removes it; old
 * images are deleted only after the save succeeds, and a new upload is
 * deleted if the save fails.
 */
export async function updateTimelineEvent(id, fields, file) {
  const event = await TimelineEvent.findById(id)
  if (!event) throw notFound()

  const { expectedUpdatedAt, removeImage = false, ...rest } = normalise(fields)
  if (expectedUpdatedAt && event.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
    throw staleEdit()
  }
  if (removeImage && file) {
    throw new ApiError(400, 'Validation failed', {
      image: 'Choose a new image or remove the current one, not both',
    })
  }
  assertDateInYear('date' in rest ? rest.date : event.date, rest.year ?? event.year)
  if ('memory' in rest) await assertMemoryExists(rest.memory)

  const previousImage = image(event.image)
  const newImage = file ? await uploadImage(file) : null

  event.set(rest)
  if (newImage) event.image = newImage
  else if (removeImage) event.image = null

  try {
    await event.save()
  } catch (error) {
    if (newImage) await cloudinaryService.deleteImageQuietly(newImage.publicId)
    if (error instanceof mongoose.Error.VersionError) throw staleEdit()
    // Deleted by another admin while this edit was in progress.
    if (error instanceof mongoose.Error.DocumentNotFoundError) throw notFound()
    throw error
  }

  if (previousImage && (newImage || removeImage)) {
    await cloudinaryService.deleteImageQuietly(previousImage.publicId)
  }
  return getTimelineEventById(event._id)
}

/**
 * Saves a new display order (docs/API.md §17). `items` must list every event
 * exactly once with orders 1..N; if events were added or deleted since the
 * admin loaded the list, nothing is changed and 409 is returned.
 */
export async function reorderTimeline(items) {
  const orders = items.map((item) => item.order).sort((a, b) => a - b)
  if (orders.some((order, index) => order !== index + 1)) {
    throw new ApiError(400, 'Validation failed', {
      items: `Orders must run from 1 to ${items.length} without gaps`,
    })
  }

  const current = await TimelineEvent.find({}).select('_id').lean()
  const currentIds = new Set(current.map((event) => String(event._id)))
  if (current.length !== items.length || items.some((item) => !currentIds.has(item.id))) {
    throw staleOrder()
  }

  await TimelineEvent.bulkWrite(
    items.map(({ id, order }) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order } }, ...ORDER_ONLY },
    })),
    { ordered: true },
  )
}

/**
 * Permanently deletes an event, then its image (best-effort). A linked
 * memory is never deleted (docs/AUTH.md §32).
 */
export async function deleteTimelineEvent(id) {
  const event = await TimelineEvent.findById(id).lean()
  if (!event) throw notFound()

  await TimelineEvent.deleteOne({ _id: event._id })
  if (event.image) await cloudinaryService.deleteImageQuietly(event.image.publicId)
}

/**
 * Unlinks a memory from every event that references it, so no event is left
 * pointing at a deleted memory (docs/AUTH.md §31). Events are kept. Called by
 * memory deletion before the memory itself is deleted; a failure here aborts
 * that deletion.
 */
export async function unlinkMemoryFromTimeline(memoryId) {
  await TimelineEvent.updateMany({ memory: memoryId }, { $set: { memory: null } })
}
