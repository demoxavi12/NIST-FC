import { v2 as cloudinary } from 'cloudinary'

/**
 * Configures the Cloudinary SDK from validated config (config/env.js).
 * Configuration only: upload and deletion services arrive with the upload
 * feature. Returns the configured SDK, or null when Cloudinary is not set
 * (allowed in development only).
 */
export function configureCloudinary(settings) {
  if (!settings) return null

  cloudinary.config({
    cloud_name: settings.cloudName,
    api_key: settings.apiKey,
    api_secret: settings.apiSecret,
    secure: true,
  })

  return cloudinary
}
