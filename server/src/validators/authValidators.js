import Joi from 'joi'

// bcrypt only uses the first 72 bytes of a password.
const BCRYPT_MAX_PASSWORD_BYTES = 72

const emailField = Joi.string()
  .trim()
  .lowercase()
  .max(254)
  .email({ tlds: { allow: false } })

/** POST /api/auth/login body. */
export const loginSchema = Joi.object({
  email: emailField.required().messages({
    'any.required': 'Email is required',
    'string.empty': 'Email is required',
    'string.base': 'Email must be a string',
    'string.email': 'Email must be a valid email address',
    'string.max': 'Email must be at most 254 characters',
  }),
  password: Joi.string().max(128).required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password is required',
    'string.base': 'Password must be a string',
    'string.max': 'Password must be at most 128 characters',
  }),
}).messages({ 'object.base': 'Request body must be a JSON object' })

/**
 * ADMIN_* values for the admin seed script. The password must meet the
 * docs/AUTH.md §5 requirements and fit within bcrypt's 72-byte limit.
 */
export const adminSeedSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    'any.required': 'ADMIN_NAME is required',
    'string.empty': 'ADMIN_NAME is required',
    'string.max': 'ADMIN_NAME must be at most 100 characters',
  }),
  email: emailField.required().messages({
    'any.required': 'ADMIN_EMAIL is required',
    'string.empty': 'ADMIN_EMAIL is required',
    'string.email': 'ADMIN_EMAIL must be a valid email address',
    'string.max': 'ADMIN_EMAIL must be at most 254 characters',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special')
    .custom((value, helpers) =>
      Buffer.byteLength(value, 'utf8') > BCRYPT_MAX_PASSWORD_BYTES
        ? helpers.error('password.maxBytes')
        : value,
    )
    .required()
    .messages({
      'any.required': 'ADMIN_PASSWORD is required',
      'string.empty': 'ADMIN_PASSWORD is required',
      'string.min': 'ADMIN_PASSWORD must be at least 8 characters',
      'string.pattern.name':
        'ADMIN_PASSWORD must contain at least one {#name} character',
      'password.maxBytes': `ADMIN_PASSWORD must be at most ${BCRYPT_MAX_PASSWORD_BYTES} bytes`,
    }),
})
