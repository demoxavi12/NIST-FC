import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import ApiError from '../utils/ApiError.js'

export const BCRYPT_SALT_ROUNDS = 12
const JWT_ALGORITHM = 'HS256'
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i

// A bcrypt hash of a random value that no password matches. Compared against
// when no admin has the given email, so unknown emails take as long as wrong
// passwords and response timing does not reveal which accounts exist.
const DUMMY_PASSWORD_HASH =
  '$2b$12$Wx5HHKte8n4X.vjXyoXl9eP/C/A2jj2YXnf86.XZvr62DR8zaZcBC'

/** The only admin fields ever sent to the client (docs/AUTH.md §16). */
export function toPublicAdmin(admin) {
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: admin.role,
  }
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

/**
 * Verifies login credentials. Unknown email and wrong password produce the
 * same error (docs/AUTH.md §13).
 */
export async function authenticateAdmin(email, password) {
  const admin = await Admin.findOne({ email }).select('+passwordHash')
  const passwordMatches = await bcrypt.compare(
    password,
    admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
  )

  if (!admin || !passwordMatches) {
    throw new ApiError(401, 'Invalid email or password')
  }
  return toPublicAdmin(admin)
}

/** JWT payload: `sub` (admin id) and `role` only (docs/AUTH.md §6). */
export function signAccessToken(admin, jwtConfig) {
  return jwt.sign({ role: admin.role }, jwtConfig.secret, {
    algorithm: JWT_ALGORITHM,
    subject: admin.id,
    expiresIn: jwtConfig.expiresIn,
  })
}

/**
 * Resolves a token to the current admin, or null if the token is invalid,
 * expired, tampered with, or the admin no longer exists. The database record
 * is authoritative for the admin's role.
 */
export async function getAdminFromToken(token, jwtConfig) {
  let payload
  try {
    payload = jwt.verify(token, jwtConfig.secret, {
      algorithms: [JWT_ALGORITHM],
    })
  } catch {
    return null
  }

  if (typeof payload.sub !== 'string' || !OBJECT_ID_PATTERN.test(payload.sub)) {
    return null
  }

  const admin = await Admin.findById(payload.sub)
  return admin ? toPublicAdmin(admin) : null
}
