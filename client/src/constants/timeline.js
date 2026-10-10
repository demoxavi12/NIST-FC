// Mirrors the API's timeline rules (server/src/models/TimelineEvent.js).

export const TIMELINE_CATEGORIES = [
  { value: 'founding', label: 'Founding' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'team', label: 'Team' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
]

export const CATEGORY_LABELS = Object.fromEntries(
  TIMELINE_CATEGORIES.map(({ value, label }) => [value, label]),
)

export const TIMELINE_FIELD_LIMITS = { title: 150, description: 2000 }
export const MIN_YEAR = 1900
export const MAX_YEAR = 2100
