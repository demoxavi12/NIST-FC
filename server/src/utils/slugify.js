const MAX_SLUG_LENGTH = 80

/**
 * Converts text to a URL-friendly slug (docs/DATABASE.md §3.4):
 * "Rahul Dás" → "rahul-das". Falls back to `fallback` when nothing is left.
 */
export function slugify(text, fallback = 'item') {
  const slug = String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '')

  return slug || fallback
}

/** Escapes text for literal use inside a regular expression. */
export function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
