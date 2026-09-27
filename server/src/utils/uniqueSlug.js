import mongoose from 'mongoose'
import { escapeRegExp, slugify } from './slugify.js'

/**
 * A slug from `text` not used by any other document of `Model`:
 * "rahul-das", then "rahul-das-2", "rahul-das-3", …
 * The model's unique slug index remains the final guarantee; callers retry
 * once if a concurrent save takes the same slug.
 */
export async function uniqueSlug(Model, text, fallback) {
  const base = slugify(text, fallback)
  const existing = await Model.find({
    // Built by the server (the base is already slug-safe), so it is trusted
    // for Mongoose's sanitizeFilter.
    slug: mongoose.trusted({ $regex: `^${escapeRegExp(base)}(-\\d+)?$` }),
  })
    .select('slug')
    .lean()

  const taken = new Set(existing.map((doc) => doc.slug))
  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

/** True for a unique-index violation on the `slug` field. */
export const isDuplicateSlugError = (error) =>
  error?.code === 11000 && Boolean(error.keyPattern?.slug)
