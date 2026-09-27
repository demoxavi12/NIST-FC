import { v2 as cloudinary } from 'cloudinary'

/**
 * Configures the Cloudinary SDK from validated config (config/env.js), which
 * requires the Cloudinary variables. Uploads and deletions go through
 * services/cloudinaryService.js.
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
