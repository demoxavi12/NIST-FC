import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createErrorHandler, notFound } from './middleware/errorMiddleware.js'
import requestLogger from './middleware/requestLogger.js'
import apiRoutes from './routes/index.js'

// JSON payloads only; image uploads will use multipart/form-data separately.
const JSON_BODY_LIMIT = '100kb'

/**
 * Builds the Express application without starting a server or connecting to
 * MongoDB, so it can be imported directly by tests.
 */
export function createApp(config, { logRequests = true } = {}) {
  const app = express()

  if (logRequests) app.use(requestLogger)

  app.use(helmet())

  // Only the configured frontend origin may make credentialed requests
  // (docs/AUTH.md §38). Requests without an Origin header (curl, platform
  // health checks, the Vite dev proxy's server-side hop) are unaffected.
  app.use(
    cors({
      origin: (origin, callback) => callback(null, origin === config.clientUrl),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    }),
  )

  app.use(express.json({ limit: JSON_BODY_LIMIT }))

  app.use('/api', apiRoutes)

  app.use(notFound)
  app.use(createErrorHandler(config))

  return app
}
