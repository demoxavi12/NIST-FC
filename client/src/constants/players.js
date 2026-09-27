// Mirrors the API's player rules (server/src/models/Player.js).

export const PLAYER_POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']

export const PLAYER_STATUS_LABELS = { current: 'Current', former: 'Former' }

// Public Players page tabs; "current" is the default (no status in the URL).
export const PLAYER_STATUS_TABS = [
  { value: 'current', label: 'Current players' },
  { value: 'former', label: 'Former players' },
  { value: 'all', label: 'All players' },
]

export const PUBLIC_PAGE_SIZE = 12
export const ADMIN_PAGE_SIZE = 20

// Academic batch range, e.g. "2023-2027".
export const BATCH_PATTERN = /^(\d{4})-(\d{4})$/
export const BATCH_EXAMPLE = '2023-2027'

export const PLAYER_FIELD_LIMITS = { name: 100, branch: 50, bio: 1000 }

// The API's default limit (MAX_IMAGE_SIZE_MB); the API remains authoritative.
export const MAX_PHOTO_SIZE_MB = 5
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'
export const PHOTO_EXTENSIONS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}
