import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createErrorHandler, notFound } from './middleware/errorMiddleware.js'
import requestLogger from './middleware/requestLogger.js'
import { createApiRouter } from './routes/index.js'

// JSON payloads only; image uploads will use multipart/form-data separately.
const JSON_BODY_LIMIT = '100kb'

/**
 * Builds the Express application without starting a server or connecting to
 * MongoDB, so it can be imported directly by tests.
 */
export function createApp(config, { logRequests = true } = {}) {
  const app = express()

  // Production runs behind one hosting proxy: trust its X-Forwarded-* headers
  // so req.ip is the client (rate limiting) and req.secure reflects HTTPS.
  // Revisit if the deployment adds or removes a proxy hop.
  if (config.isProduction) app.set('trust proxy', 1)

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
  app.use(cookieParser())

  app.use('/api', createApiRouter(config))

  app.use(notFound)
  app.use(createErrorHandler(config))

  return app
}
