import axios from 'axios'

/**
 * The single Axios instance for the NIST FC API.
 *
 * - Always uses the relative `/api` base path. In development Vite proxies it
 *   to the Express backend; in production the host routes it (docs/API.md §2).
 * - `withCredentials` sends the HTTP-only auth cookie (docs/AUTH.md §9).
 *
 * Feature services (players, memories, …) should import this instance rather
 * than creating their own.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

/**
 * Normalise failures to the documented error shape
 * `{ success: false, message, error }` (docs/API.md §5) so the UI can rely on
 * `err.message`, `err.status` and `err.details`.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const body = error.response?.data
    const apiError = new Error(
      body?.message || 'Something went wrong. Please try again.',
    )
    apiError.status = error.response?.status ?? null
    apiError.details = body?.error ?? null
    apiError.cause = error
    return Promise.reject(apiError)
  },
)

export default api
