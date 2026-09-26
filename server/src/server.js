import { createApp } from './app.js'
import { configureCloudinary } from './config/cloudinary.js'
import { connectDB, disconnectDB } from './config/db.js'
import { ConfigError, loadConfig } from './config/env.js'

const SHUTDOWN_TIMEOUT_MS = 10_000

function exitWithError(message) {
  console.error(message)
  process.exit(1)
}

let config
try {
  config = loadConfig()
} catch (error) {
  if (!(error instanceof ConfigError)) throw error
  exitWithError(error.message)
}

for (const warning of config.warnings) console.warn(`Warning: ${warning}`)

configureCloudinary(config.cloudinary)

try {
  await connectDB(config.mongodbUri)
} catch (error) {
  exitWithError(error.message)
}

const app = createApp(config)
const server = app.listen(config.port, () => {
  console.info(
    `NIST FC API listening on port ${config.port} (${config.nodeEnv})`,
  )
})

server.on('error', async (error) => {
  await disconnectDB()
  exitWithError(`Server failed to start (${error.code ?? error.name})`)
})

let shuttingDown = false

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.info(`${signal} received, shutting down`)

  setTimeout(() => {
    exitWithError('Shutdown timed out; forcing exit')
  }, SHUTDOWN_TIMEOUT_MS).unref()

  server.close(async (error) => {
    await disconnectDB()
    console.info('Shutdown complete')
    process.exit(error ? 1 : 0)
  })
  // Idle keep-alive connections would otherwise hold the server open.
  server.closeIdleConnections()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
