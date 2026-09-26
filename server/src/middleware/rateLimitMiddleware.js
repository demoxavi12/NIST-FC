import { rateLimit } from 'express-rate-limit'
import { errorBody } from '../utils/apiResponse.js'

// 10 failed login attempts per 15 minutes per IP (docs/AUTH.md §14).
export const LOGIN_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  limit: 10,
})

/**
 * Creates a login rate limiter. Successful logins are not counted.
 * The in-memory store is per process: it resets on restart and is not shared
 * between multiple server instances.
 */
export function createLoginRateLimiter() {
  return rateLimit({
    ...LOGIN_RATE_LIMIT,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      res
        .status(429)
        .json(errorBody('Too many login attempts. Please try again later.'))
    },
  })
}
