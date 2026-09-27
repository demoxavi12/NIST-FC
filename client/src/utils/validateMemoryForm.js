import { MAX_GALLERY_PHOTOS, MEMORY_FIELD_LIMITS } from '../constants/memories'
import { validatePhoto } from './validatePlayerForm'

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function isCalendarDate(value) {
  const match = DATE_PATTERN.exec(value)
  if (!match) return false
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/**
 * Mirrors the API's memory validation for quick feedback; the API remains
 * authoritative. Returns `{ field: message }`; empty means valid.
 * `galleryCount` is the number of photos the memory will have after saving.
 */
export function validateMemoryForm(values, { coverFile, requireCover, galleryCount }) {
  const errors = {}
  const title = values.title.trim()

  if (!title) errors.title = 'Title is required'
  else if (title.length > MEMORY_FIELD_LIMITS.title) {
    errors.title = `Title must be at most ${MEMORY_FIELD_LIMITS.title} characters`
  }

  if (!values.date) errors.date = 'Date is required'
  else if (!isCalendarDate(values.date)) errors.date = 'Date must be a valid date'

  if (values.location.trim().length > MEMORY_FIELD_LIMITS.location) {
    errors.location = `Location must be at most ${MEMORY_FIELD_LIMITS.location} characters`
  }
  if (values.description.trim().length > MEMORY_FIELD_LIMITS.description) {
    errors.description = `Description must be at most ${MEMORY_FIELD_LIMITS.description} characters`
  }

  if (requireCover && !coverFile) errors.coverImage = 'Cover image is required'
  else {
    const coverError = validatePhoto(coverFile)
    if (coverError) errors.coverImage = coverError
  }

  if (galleryCount > MAX_GALLERY_PHOTOS) {
    errors.photos = `A memory can have at most ${MAX_GALLERY_PHOTOS} photos`
  }

  return errors
}
