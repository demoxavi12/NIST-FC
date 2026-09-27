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
    fileFilter(req, file, callback) {
      const extension = extname(file.originalname ?? '').toLowerCase()
      if (PHOTO_TYPES[file.mimetype]?.includes(extension)) {
        callback(null, true)
      } else {
        callback(new ApiError(400, PHOTO_TYPE_MESSAGE, { photo: PHOTO_TYPE_MESSAGE }))
      }
    },
  }).single('photo')

  return function photoUpload(req, res, next) {
    upload(req, res, (error) => {
      if (!error) return next()
      if (error instanceof ApiError) return next(error)

      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        const message = `Image must be at most ${maxImageSizeMb} MB`
        return next(new ApiError(413, message, { photo: message }))
      }
      if (error instanceof multer.MulterError) {
        return next(new ApiError(400, 'Invalid upload: send one image in the "photo" field'))
      }
      next(error)
    })
  }
}

/** Rejects a create request that has no photo file. */
export function requirePhoto(req, res, next) {
  if (!req.file) {
    throw new ApiError(400, 'Validation failed', { photo: 'Photo is required' })
  }
  next()
}
