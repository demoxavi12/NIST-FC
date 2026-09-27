import { once } from 'node:events'
import { loadConfig } from '../src/config/env.js'

export const CLIENT_URL = 'http://localhost:5173'

/** Auth-related variables every valid config needs (docs/AUTH.md §46). */
export const AUTH_ENV = Object.freeze({
  JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
  JWT_EXPIRES_IN: '1h',
  COOKIE_NAME: 'nist_fc_token',
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'lax',
})

/** Placeholder Cloudinary settings; tests never call Cloudinary. */
export const CLOUDINARY_ENV = Object.freeze({
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
})

/** A valid development config; no MongoDB connection is made by the app. */
export function testConfig(overrides = {}) {
  return loadConfig({
    NODE_ENV: 'development',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/nist-fc-test',
    CLIENT_URL,
    ...AUTH_ENV,
    ...CLOUDINARY_ENV,
    ...overrides,
  })
}

/** Starts an Express app on an ephemeral port for native fetch requests. */
export async function startServer(app) {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const { port } = server.address()

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
        server.closeAllConnections()
      }),
  }
}
