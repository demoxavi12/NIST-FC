import {
  BATCH_EXAMPLE,
  BATCH_PATTERN,
  MAX_PHOTO_SIZE_MB,
  PHOTO_EXTENSIONS,
  PLAYER_FIELD_LIMITS,
  PLAYER_POSITIONS,
} from '../constants/players'

/** Validates a photo file's type and size; returns a message or null. */
export function validatePhoto(file) {
  if (!file) return null
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!PHOTO_EXTENSIONS[file.type]?.includes(extension)) {
    return 'Photo must be a JPEG, PNG or WEBP image'
  }
  if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
    return `Image must be at most ${MAX_PHOTO_SIZE_MB} MB`
  }
  return null
}

/**
 * Mirrors the API's player validation for quick feedback; the API remains
 * authoritative. Returns `{ field: message }`; empty means valid.
 * `requirePhoto` is true when creating a player.
 */
export function validatePlayerForm(values, { photo, requirePhoto }) {
  const errors = {}
  const name = values.name.trim()
  const batch = values.batch.trim()
  const branch = values.branch.trim()

  if (!name) errors.name = 'Name is required'
  else if (name.length > PLAYER_FIELD_LIMITS.name) {
    errors.name = `Name must be at most ${PLAYER_FIELD_LIMITS.name} characters`
  }

  if (!values.position) errors.position = 'Position is required'
  else if (!PLAYER_POSITIONS.includes(values.position)) errors.position = 'Position is not valid'

  const match = BATCH_PATTERN.exec(batch)
  if (!batch) errors.batch = 'Batch is required'
  else if (!match) errors.batch = `Batch must use the format YYYY-YYYY (e.g. ${BATCH_EXAMPLE})`
  else if (Number(match[2]) <= Number(match[1])) {
    errors.batch = 'The second batch year must be after the first'
  }

  if (!branch) errors.branch = 'Branch is required'
  else if (branch.length > PLAYER_FIELD_LIMITS.branch) {
    errors.branch = `Branch must be at most ${PLAYER_FIELD_LIMITS.branch} characters`
  }

  if (values.bio.trim().length > PLAYER_FIELD_LIMITS.bio) {
    errors.bio = `Bio must be at most ${PLAYER_FIELD_LIMITS.bio} characters`
  }

  if (requirePhoto && !photo) errors.photo = 'Photo is required'
  else {
    const photoError = validatePhoto(photo)
    if (photoError) errors.photo = photoError
  }

  return errors
}
