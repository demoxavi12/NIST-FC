import mongoose from 'mongoose'

// Only fields defined in a schema may be used in query filters.
mongoose.set('strictQuery', true)
// Reject query filters containing MongoDB operators ($ne, $gt, $where…) unless
// the backend explicitly wraps them with mongoose.trusted() (docs/AUTH.md §42).
mongoose.set('sanitizeFilter', true)

const SERVER_SELECTION_TIMEOUT_MS = 10_000

/** Removes the URI and any `user:password@` credentials from a message. */
function redact(message, uri) {
  return String(message)
    .replaceAll(uri, '[redacted URI]')
    .replace(/\/\/[^/@\s]+@/g, '//[redacted]@')
}

/**
 * Connects to MongoDB. The database is taken from the URI path.
 * Failures are rethrown with a message that never contains the URI.
 */
export async function connectDB(uri) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    })
  } catch (error) {
    // The original error is deliberately not attached as `cause`: driver
    // errors can contain the URI and credentials.
    // eslint-disable-next-line preserve-caught-error
    throw new Error(
      `MongoDB connection failed (${error.name}): ${redact(error.message, uri)}`,
    )
  }

  // Lifecycle logging starts only once a connection has been established.
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })
  mongoose.connection.on('reconnected', () => {
    console.info('MongoDB reconnected')
  })
  mongoose.connection.on('error', (error) => {
    console.error(`MongoDB error (${error.name}): ${redact(error.message, uri)}`)
  })
  console.info(`MongoDB connected (database: ${mongoose.connection.name})`)
}

export async function disconnectDB() {
  await mongoose.disconnect()
}
