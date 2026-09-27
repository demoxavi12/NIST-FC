// Memory dates are calendar days stored as 00:00 UTC. Always formatting them
// in UTC means a date never shifts by a day in the visitor's time zone.
const DAY_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "2025-12-12T00:00:00.000Z" → "12 December 2025". */
export function formatMemoryDate(value) {
  return value ? DAY_FORMAT.format(new Date(value)) : ''
}

/** "2025-12-12T00:00:00.000Z" → "2025-12-12" (for <time dateTime> and date inputs). */
export function toDateValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}
