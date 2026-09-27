// Mirrors the API's memory rules (server/src/models/Memory.js).

export const PUBLIC_PAGE_SIZE = 12
export const ADMIN_PAGE_SIZE = 20

// Total gallery photos a memory can hold (the cover is separate).
export const MAX_GALLERY_PHOTOS = 100
// The form uploads new gallery photos this many per request.
export const UPLOAD_BATCH_SIZE = 3

export const MAX_TAGS = 20
export const TAG_MAX_LENGTH = 30

export const MEMORY_FIELD_LIMITS = { title: 150, description: 5000, location: 150 }

// Admin list filter: URL value → API `published` parameter.
export const PUBLISHED_FILTERS = [
  { value: 'published', label: 'Published', published: true },
  { value: 'draft', label: 'Drafts', published: false },
]

// A player profile shows at most this many of their memories (the API's limit).
export const PLAYER_PROFILE_MEMORY_LIMIT = 12
