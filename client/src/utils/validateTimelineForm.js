import { CATEGORY_LABELS, MAX_YEAR, MIN_YEAR, TIMELINE_FIELD_LIMITS } from '../constants/timeline'
import { isCalendarDate } from './validateMemoryForm'
import { validatePhoto } from './validatePlayerForm'

const YEAR_PATTERN = /^\d{4}$/

/**
 * Mirrors the API's timeline validation for quick feedback; the API remains
 * authoritative. Returns `{ field: message }`; empty means valid.
 */
export function validateTimelineForm(values, { imageFile }) {
  const errors = {}
  const title = values.title.trim()
  const year = values.year.trim()

  if (!title) errors.title = 'Title is required'
  else if (title.length > TIMELINE_FIELD_LIMITS.title) {
    errors.title = `Title must be at most ${TIMELINE_FIELD_LIMITS.title} characters`
  }

  if (!year) errors.year = 'Year is required'
  else if (!YEAR_PATTERN.test(year) || Number(year) < MIN_YEAR || Number(year) > MAX_YEAR) {
    errors.year = `Year must be a whole number from ${MIN_YEAR} to ${MAX_YEAR}`
  }

  if (values.date) {
    if (!isCalendarDate(values.date)) errors.date = 'Date must be a valid date'
    else if (!errors.year && year && values.date.slice(0, 4) !== year) {
      errors.date = 'Date must be in the selected year'
    }
  }

  if (!values.category) errors.category = 'Category is required'
  else if (!CATEGORY_LABELS[values.category]) errors.category = 'Category is not valid'

  if (values.description.trim().length > TIMELINE_FIELD_LIMITS.description) {
    errors.description = `Description must be at most ${TIMELINE_FIELD_LIMITS.description} characters`
  }

  const imageError = validatePhoto(imageFile)
  if (imageError) errors.image = imageError

  return errors
}
