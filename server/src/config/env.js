import { adminSeedSchema } from '../validators/authValidators.js'

/**
 * Environment configuration (docs/API.md §38, docs/AUTH.md §46).
 *
 * The server requires the variables its current features use. Cloudinary is
 * required in every environment because player photos are required.
 * MAX_IMAGE_SIZE_MB is optional; MAX_MEMORY_IMAGES is read when memory
 * galleries are implemented. ADMIN_* are read only by the admin seed script
 * (loadAdminSeedConfig).
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

const JWT_SECRET_MIN_LENGTH = 32
// The example value shown in docs/AUTH.md §46.
const PLACEHOLDER_JWT_SECRET = 'change-this-in-production'
// <number><s|m|h|d>, e.g. 1d or 12h (docs/AUTH.md §8).
const JWT_EXPIRES_IN_PATTERN = /^([1-9]\d*)([smhd])$/
const DURATION_UNIT_MS = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }

// Per-image upload limit. Cloudinary's free plan accepts images up to 10 MB.
const DEFAULT_MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_MB_LIMIT = 10

// RFC 6265 cookie-name token characters.
const COOKIE_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/
// "none" would require explicit CSRF protection (docs/AUTH.md §39).
const COOKIE_SAME_SITE_VALUES = ['lax', 'strict']

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

function readMongodbUri(env, problems) {
  const mongodbUri = read(env, 'MONGODB_URI')
  if (!mongodbUri) {
    problems.push('MONGODB_URI is required')
  } else if (!MONGODB_URI_PATTERN.test(mongodbUri)) {
    problems.push(
      'MONGODB_URI must be a mongodb:// or mongodb+srv:// URI that includes the database name in its path (e.g. .../nist-fc)',
    )
  }
  return mongodbUri
}

function readJwtConfig(env, problems) {
  const secret = read(env, 'JWT_SECRET')
  if (!secret) {
    problems.push('JWT_SECRET is required')
  } else if (secret === PLACEHOLDER_JWT_SECRET) {
    problems.push('JWT_SECRET must not be the documented example value')
  } else if (secret.length < JWT_SECRET_MIN_LENGTH) {
    problems.push(
      `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters`,
    )
  }

  const expiresIn = read(env, 'JWT_EXPIRES_IN')
  const match = expiresIn?.match(JWT_EXPIRES_IN_PATTERN)
  if (!expiresIn) {
    problems.push('JWT_EXPIRES_IN is required (e.g. 1d)')
  } else if (!match) {
    problems.push(
      'JWT_EXPIRES_IN must be a positive whole number followed by s, m, h or d (e.g. 1d)',
    )
  }

  return {
    secret,
    expiresIn,
    expiresInMs: match ? Number(match[1]) * DURATION_UNIT_MS[match[2]] : null,
  }
}

function readCookieConfig(env, problems, isProduction) {
  const name = read(env, 'COOKIE_NAME')
  if (!name) {
    problems.push('COOKIE_NAME is required (e.g. nist_fc_token)')
  } else if (!COOKIE_NAME_PATTERN.test(name)) {
    problems.push('COOKIE_NAME contains characters not allowed in a cookie name')
  }

  const secureValue = read(env, 'COOKIE_SECURE')?.toLowerCase()
  if (!secureValue) {
    problems.push('COOKIE_SECURE is required ("true" or "false")')
  } else if (!['true', 'false'].includes(secureValue)) {
    problems.push('COOKIE_SECURE must be "true" or "false"')
  } else if (isProduction && secureValue !== 'true') {
    problems.push('COOKIE_SECURE must be "true" in production')
  }

  const sameSite = read(env, 'COOKIE_SAME_SITE')?.toLowerCase()
  if (!sameSite) {
    problems.push('COOKIE_SAME_SITE is required ("lax" or "strict")')
  } else if (!COOKIE_SAME_SITE_VALUES.includes(sameSite)) {
    problems.push('COOKIE_SAME_SITE must be "lax" or "strict"')
  }

  return { name, secure: secureValue === 'true', sameSite }
}

/**
 * Validates the server environment and returns a frozen config object.
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

  const mongodbUri = readMongodbUri(env, problems)

  const clientUrlValue = read(env, 'CLIENT_URL')
  const clientUrl = clientUrlValue ? parseOrigin(clientUrlValue) : null
  if (!clientUrlValue) {
    problems.push('CLIENT_URL is required')
  } else if (!clientUrl) {
    problems.push(
      'CLIENT_URL must be an absolute http(s) URL (e.g. http://localhost:5173)',
    )
  }

  const jwt = readJwtConfig(env, problems)
  const cookie = readCookieConfig(env, problems, isProduction)

  const missingCloudinary = CLOUDINARY_VARS.filter((name) => !read(env, name))
  if (missingCloudinary.length > 0) {
    problems.push(
      `Cloudinary is not configured (missing ${missingCloudinary.join(', ')})`,
    )
  }

  const maxImageSizeValue = read(env, 'MAX_IMAGE_SIZE_MB')
  const maxImageSizeMb =
    maxImageSizeValue === undefined ? DEFAULT_MAX_IMAGE_SIZE_MB : Number(maxImageSizeValue)
  if (
    !Number.isFinite(maxImageSizeMb) ||
    maxImageSizeMb <= 0 ||
    maxImageSizeMb > MAX_IMAGE_SIZE_MB_LIMIT
  ) {
    problems.push(
      `MAX_IMAGE_SIZE_MB must be a number greater than 0 and at most ${MAX_IMAGE_SIZE_MB_LIMIT}`,
    )
  }

  if (problems.length > 0) throw new ConfigError(problems)

  const cloudinary = Object.freeze({
    cloudName: read(env, 'CLOUDINARY_CLOUD_NAME'),
    apiKey: read(env, 'CLOUDINARY_API_KEY'),
    apiSecret: read(env, 'CLOUDINARY_API_SECRET'),
  })

  return Object.freeze({
    nodeEnv,
    isProduction,
    port,
    mongodbUri,
    clientUrl,
    jwt: Object.freeze(jwt),
    cookie: Object.freeze(cookie),
    cloudinary,
    uploads: Object.freeze({
      maxImageSizeMb,
      maxImageSizeBytes: Math.floor(maxImageSizeMb * 1024 * 1024),
    }),
    warnings: Object.freeze(warnings),
  })
}

/**
 * Validates the environment for `npm run seed:admin` (docs/AUTH.md §55).
 * Needs only MONGODB_URI and ADMIN_*; the password must meet AUTH.md §5.
 */
export function loadAdminSeedConfig(env = process.env) {
  const problems = []
  const mongodbUri = readMongodbUri(env, problems)

  const { value: admin, error } = adminSeedSchema.validate(
    {
      name: read(env, 'ADMIN_NAME'),
      email: read(env, 'ADMIN_EMAIL'),
      password: env.ADMIN_PASSWORD,
    },
    { abortEarly: false },
  )
  if (error) problems.push(...error.details.map((detail) => detail.message))

  if (problems.length > 0) throw new ConfigError(problems)

  return Object.freeze({ mongodbUri, admin: Object.freeze(admin) })
}
