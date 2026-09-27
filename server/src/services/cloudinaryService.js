import { v2 as cloudinary } from 'cloudinary'
import ApiError from '../utils/ApiError.js'

const UPLOAD_OPTIONS = {
  resource_type: 'image',
  allowed_formats: ['jpg', 'png', 'webp'],
  // Store at most 1600×1600. Re-encoding on upload also strips camera
  // metadata (e.g. GPS location) from photos.
  transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
}

// Cloudinary error messages can include account details, so only the HTTP
// status is logged (docs/AUTH.md §36).
function describe(error) {
  return `HTTP ${error?.http_code ?? 'unknown'}`
}

/**
 * Uploads an image buffer to `folder`. Cloudinary assigns a random public ID,
 * so a replaced photo always gets a new URL. Resolves to `{ url, publicId }`.
 */
function uploadImage(buffer, { folder }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { ...UPLOAD_OPTIONS, folder },
      (error, result) => {
        if (error || !result) {
          console.error(`Cloudinary upload failed (${describe(error)})`)
          reject(new ApiError(502, 'Image upload failed'))
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
}

/** Deletes an image. An already-missing image counts as deleted. */
async function deleteImage(publicId) {
  const result = await cloudinary.uploader.destroy(publicId, { invalidate: true })
  if (result?.result !== 'ok' && result?.result !== 'not found') {
    throw new Error(`Cloudinary destroy returned "${result?.result}"`)
  }
}

/**
 * Best-effort deletion for cleanup paths: failures are logged, never thrown,
 * so an orphaned image never fails the request that caused it.
 */
async function deleteImageQuietly(publicId) {
  try {
    await cloudinaryService.deleteImage(publicId)
  } catch (error) {
    const detail = error?.http_code ? describe(error) : error?.message
    console.error(`Failed to delete Cloudinary image ${publicId} (${detail})`)
  }
}

// Exported as an object so tests can replace individual methods.
export const cloudinaryService = { uploadImage, deleteImage, deleteImageQuietly }
