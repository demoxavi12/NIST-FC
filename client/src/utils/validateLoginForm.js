// Mirrors the backend loginSchema for quick feedback; the API remains
// authoritative. Messages match the API's validation messages.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Returns `{ email?, password? }` messages; an empty object means valid. */
export function validateLoginForm({ email, password }) {
  const errors = {}
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    errors.email = 'Email is required'
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Email must be a valid email address'
  }

  if (!password) errors.password = 'Password is required'

  return errors
}
