/**
 * Environment configuration (docs/API.md §38, docs/AUTH.md §46).
 *
 * Phase 2 requires only what the backend foundation uses. JWT/cookie
 * variables become required in Phase 3; upload limits are read when uploads
 * are implemented.
 *
 * Error and warning messages name variables but never include their values.
 */

const NODE_ENVS = ['development', 'production']
const DEFAULT_PORT = 5000
const CLOUDINARY_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

// scheme://<hosts>/<database>[?options] — the database name comes from the path.
const MONGODB_URI_PATTERN = /^mongodb(\+srv)?:\/\/[^/]+\/([^/?]+)/

export class ConfigError extends Error {
  constructor(problems) {
    super(`Invalid environment configuration:\n- ${problems.join('\n- ')}`)
    this.name = 'ConfigError'
    this.problems = problems
  }
}

function read(env, name) {
  const value = env[name]?.trim()
  return value ? value : undefined
}

function parseOrigin(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null
  } catch {
    return null
  }
}

/**
 * Validates the environment and returns a frozen config object.
 * Throws ConfigError listing every problem at once.
 */
export function loadConfig(env = process.env) {
  const problems = []
  const warnings = []

  const nodeEnv = read(env, 'NODE_ENV')
  if (!nodeEnv) {
    problems.push('NODE_ENV is required ("development" or "production")')
  } else if (!NODE_ENVS.includes(nodeEnv)) {
    problems.push('NODE_ENV must be "development" or "production"')
  }
  const isProduction = nodeEnv === 'production'

  const portValue = read(env, 'PORT')
  const port = portValue === undefined ? DEFAULT_PORT : Number(portValue)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push('PORT must be an integer between 1 and 65535')
  }

  const mongodbUri = read(env, 'MONGODB_URI')
  if (!mongodbUri) {
    problems.push('MONGODB_URI is required')
  } else if (!MONGODB_URI_PATTERN.test(mongodbUri)) {
    problems.push(
      'MONGODB_URI must be a mongodb:// or mongodb+srv:// URI that includes the database name in its path (e.g. .../nist-fc)',
    )
  }

  const clientUrlValue = read(env, 'CLIENT_URL')
  const clientUrl = clientUrlValue ? parseOrigin(clientUrlValue) : null
  if (!clientUrlValue) {
    problems.push('CLIENT_URL is required')
  } else if (!clientUrl) {
    problems.push(
      'CLIENT_URL must be an absolute http(s) URL (e.g. http://localhost:5173)',
    )
  }

  const missingCloudinary = CLOUDINARY_VARS.filter((name) => !read(env, name))
  if (missingCloudinary.length > 0) {
    const message = `Cloudinary is not configured (missing ${missingCloudinary.join(', ')})`
    if (isProduction) {
      problems.push(`${message}; it is required in production`)
    } else {
      warnings.push(`${message}; image features will not work until it is set`)
    }
  }

  if (problems.length > 0) throw new ConfigError(problems)

  const cloudinary =
    missingCloudinary.length === 0
      ? Object.freeze({
          cloudName: read(env, 'CLOUDINARY_CLOUD_NAME'),
          apiKey: read(env, 'CLOUDINARY_API_KEY'),
          apiSecret: read(env, 'CLOUDINARY_API_SECRET'),
        })
      : null

  return Object.freeze({
    nodeEnv,
    isProduction,
    port,
    mongodbUri,
    clientUrl,
    cloudinary,
    warnings: Object.freeze(warnings),
  })
}
