/**
 * Creates the initial administrator (docs/AUTH.md §55).
 *
 *   npm run seed:admin
 *
 * Reads MONGODB_URI and ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD, hashes the
 * password with bcrypt and creates the admin. If an admin with that email
 * already exists, nothing is changed. The password is never printed.
 */
import { pathToFileURL } from 'node:url'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { ConfigError, loadAdminSeedConfig } from '../src/config/env.js'
import Admin from '../src/models/Admin.js'
import { hashPassword } from '../src/services/authService.js'

/** Returns { created: true } or { created: false } if the email already exists. */
export async function createInitialAdmin({ name, email, password }) {
  if (await Admin.exists({ email })) return { created: false }

  const passwordHash = await hashPassword(password)
  try {
    await Admin.create({ name, email, passwordHash, role: 'admin' })
  } catch (error) {
    // Another seed run created the same email in the meantime.
    if (error.code === 11000) return { created: false }
    throw error
  }
  return { created: true }
}

async function main() {
  let seedConfig
  try {
    seedConfig = loadAdminSeedConfig()
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error
    console.error(error.message)
    process.exitCode = 1
    return
  }

  const { email } = seedConfig.admin
  try {
    await connectDB(seedConfig.mongodbUri)
    // Ensure the unique email index exists before inserting.
    await Admin.init()

    const { created } = await createInitialAdmin(seedConfig.admin)
    console.info(
      created
        ? `Admin created: ${email}`
        : `An admin with email ${email} already exists; nothing changed.`,
    )
  } catch (error) {
    console.error(`Admin seed failed: ${error.message}`)
    process.exitCode = 1
  } finally {
    await disconnectDB()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
