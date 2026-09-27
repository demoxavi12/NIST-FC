import { extname } from 'node:path'
import multer from 'multer'
import ApiError from '../utils/ApiError.js'

// Accepted photo types: MIME type and file extension must both match.
const PHOTO_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}
const PHOTO_TYPE_MESSAGE = 'Photo must be a JPEG, PNG or WEBP image'

function photoFileFilter(req, file, callback) {
  const extension = extname(file.originalname ?? '').toLowerCase()
  if (PHOTO_TYPES[file.mimetype]?.includes(extension)) {
    callback(null, true)
  } else {
    callback(new ApiError(400, PHOTO_TYPE_MESSAGE, { [file.fieldname]: PHOTO_TYPE_MESSAGE }))
  }
}

/**
 * Runs a multer handler and maps its errors to the API error contract.
 * `tooManyFilesMessage` explains the per-request file limit, if any;
 * `invalidMessage` covers other malformed uploads.
 */
function withUploadErrors(upload, { maxImageSizeMb, tooManyFilesMessage, invalidMessage }) {
  return function uploadRequest(req, res, next) {
    upload(req, res, (error) => {
      if (!error) return next()
      if (error instanceof ApiError) return next(error)

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          const message = `Image must be at most ${maxImageSizeMb} MB`
          return next(new ApiError(413, message, { [error.field]: message }))
        }
        if (
          tooManyFilesMessage &&
          (error.code === 'LIMIT_FILE_COUNT' ||
            (error.code === 'LIMIT_UNEXPECTED_FILE' && error.field === 'photos'))
        ) {
          return next(new ApiError(413, tooManyFilesMessage, { photos: tooManyFilesMessage }))
        }
        return next(new ApiError(400, invalidMessage))
      }
      next(error)
    })
  }
}

/**
 * Parses an optional single `photo` file from multipart/form-data into memory
 * (req.file). The file is never written to disk. Requests that are not
 * multipart pass through unchanged. Must run after requireAuth so
 * unauthenticated uploads are never parsed.
 */
export function createPhotoUpload({ maxImageSizeBytes, maxImageSizeMb }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxImageSizeBytes, files: 1, fields: 20 },
    fileFilter: photoFileFilter,
  }).single('photo')

  return withUploadErrors(upload, {
    maxImageSizeMb,
    invalidMessage: 'Invalid upload: send one image in the "photo" field',
  })
}

/**
 * Parses memory images from multipart/form-data into memory (req.files):
 * an optional `coverImage` (one file) and up to `maxMemoryImages` gallery
 * `photos` per request (docs/AUTH.md §35). Must run after requireAuth.
 */
export function createMemoryUpload({ maxImageSizeBytes, maxImageSizeMb, maxMemoryImages }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxImageSizeBytes, files: maxMemoryImages + 1, fields: 20 },
    fileFilter: photoFileFilter,
  }).fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'photos', maxCount: maxMemoryImages },
  ])

  return withUploadErrors(upload, {
    maxImageSizeMb,
    tooManyFilesMessage: `At most ${maxMemoryImages} photos can be uploaded at a time`,
    invalidMessage: 'Invalid upload: send images in the "coverImage" and "photos" fields',
  })
}

/** Rejects a create request that has no photo file. */
export function requirePhoto(req, res, next) {
  if (!req.file) {
    throw new ApiError(400, 'Validation failed', { photo: 'Photo is required' })
  }
  next()
}

/** Rejects a create request that has no cover image file. */
export function requireCoverImage(req, res, next) {
  if (!req.files?.coverImage?.length) {
    throw new ApiError(400, 'Validation failed', { coverImage: 'Cover image is required' })
  }
  next()
}
