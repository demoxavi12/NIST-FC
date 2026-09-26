import { once } from 'node:events'
import { loadConfig } from '../src/config/env.js'

export const CLIENT_URL = 'http://localhost:5173'

/** A valid development config; no MongoDB connection is made by the app. */
export function testConfig(overrides = {}) {
  return loadConfig({
    NODE_ENV: 'development',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/nist-fc-test',
    CLIENT_URL,
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
