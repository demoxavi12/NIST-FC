const UPLOAD_MARKER = '/image/upload/'

/**
 * Adds Cloudinary delivery transformations to an uploaded image URL, so the
 * browser downloads an appropriately sized, optimised image — never the
 * full-size original (docs/UI_DESIGN.md §90). Non-Cloudinary URLs are
 * returned unchanged.
 */
export function cloudinaryImageUrl(url, { width, height, crop = 'fill' } = {}) {
  const index = url ? url.indexOf(UPLOAD_MARKER) : -1
  if (index === -1) return url

  const transformation = [
    'f_auto',
    'q_auto',
    `c_${crop}`,
    crop === 'fill' && 'g_auto',
    width && `w_${Math.round(width)}`,
    height && `h_${Math.round(height)}`,
  ]
    .filter(Boolean)
    .join(',')

  const start = index + UPLOAD_MARKER.length
  return `${url.slice(0, start)}${transformation}/${url.slice(start)}`
}

/**
 * A `srcSet` of several widths at a fixed aspect ratio (height / width), for
 * use with a `sizes` attribute.
 */
export function cloudinarySrcSet(url, widths, aspectRatio) {
  return widths
    .map((width) => `${cloudinaryImageUrl(url, { width, height: width * aspectRatio })} ${width}w`)
    .join(', ')
}
