import { createApp } from './app.js'
import { configureCloudinary } from './config/cloudinary.js'
import { connectDB, disconnectDB } from './config/db.js'
import { ConfigError, loadConfig } from './config/env.js'

const SHUTDOWN_TIMEOUT_MS = 10_000

// Sets the exit code instead of calling process.exit(), so the message is
// flushed before Node exits (process.exit can truncate piped output, e.g.
// under `node --watch`).
function fail(message) {
  console.error(message)
  process.exitCode = 1
}

async function start() {
  let config
  try {
    config = loadConfig()
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error
    return fail(error.message)
  }

  for (const warning of config.warnings) console.warn(`Warning: ${warning}`)

  configureCloudinary(config.cloudinary)

  try {
    await connectDB(config.mongodbUri)
  } catch (error) {
    return fail(error.message)
  }

  const app = createApp(config)
  const server = app.listen(config.port, () => {
    console.info(
      `NIST FC API listening on port ${config.port} (${config.nodeEnv})`,
    )
  })

  server.on('error', async (error) => {
    fail(`Server failed to start (${error.code ?? error.name})`)
    await disconnectDB()
  })

  let shuttingDown = false

  // Note: under `npm run dev` (node --watch) on Windows, the watch process
  // force-kills this process on Ctrl+C, so only "SIGINT received" is logged.
  // Use `npm start` to exercise the full graceful shutdown locally.
  async function shutdown(signal) {
    if (shuttingDown) return
    shuttingDown = true
    console.info(`${signal} received, shutting down`)

    setTimeout(() => {
      console.error('Shutdown timed out; forcing exit')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS).unref()

    server.close(async (error) => {
      await disconnectDB()
      console.info('Shutdown complete')
      if (error) process.exitCode = 1
    })
    // Idle keep-alive connections would otherwise hold the server open.
    server.closeIdleConnections()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

await start()
