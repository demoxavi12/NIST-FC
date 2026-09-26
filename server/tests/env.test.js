import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ConfigError,
  loadAdminSeedConfig,
  loadConfig,
} from '../src/config/env.js'
import { AUTH_ENV } from './helpers.js'

const BASE = {
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb+srv://user:s3cret-pass@cluster.example.net/nist-fc?retryWrites=true',
  CLIENT_URL: 'http://localhost:5173/',
  ...AUTH_ENV,
}

const CLOUDINARY = {
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
}

function problemsFor(env, load = loadConfig) {
  try {
    load(env)
  } catch (error) {
    assert.ok(error instanceof ConfigError)
    return error
  }
  assert.fail('expected ConfigError')
}

describe('loadConfig', () => {
  it('accepts the Phase 2 minimum and applies defaults', () => {
    const config = loadConfig(BASE)

    assert.equal(config.nodeEnv, 'development')
    assert.equal(config.isProduction, false)
    assert.equal(config.port, 5000)
    assert.equal(config.clientUrl, 'http://localhost:5173')
    assert.equal(config.cloudinary, null)
    assert.equal(config.warnings.length, 1)
    assert.match(config.warnings[0], /Cloudinary is not configured/)
    assert.ok(Object.isFrozen(config))
  })

  it('reports every missing required variable at once', () => {
    const error = problemsFor({})

    assert.equal(error.problems.length, 8)
    for (const name of [
      'NODE_ENV',
      'MONGODB_URI',
      'CLIENT_URL',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'COOKIE_NAME',
      'COOKIE_SECURE',
      'COOKIE_SAME_SITE',
    ]) {
      assert.match(error.message, new RegExp(`${name} is required`))
    }
  })

  it('only accepts development or production', () => {
    assert.match(problemsFor({ ...BASE, NODE_ENV: 'test' }).message, /NODE_ENV must be/)
  })

  it('validates PORT', () => {
    assert.equal(loadConfig({ ...BASE, PORT: '8080' }).port, 8080)
    assert.match(problemsFor({ ...BASE, PORT: 'abc' }).message, /PORT must be/)
  })

  it('requires the database name in the MONGODB_URI path without echoing the URI', () => {
    const error = problemsFor({
      ...BASE,
      MONGODB_URI: 'mongodb+srv://user:s3cret-pass@cluster.example.net/?retryWrites=true',
    })

    assert.match(error.message, /database name/)
    assert.doesNotMatch(error.message, /s3cret-pass|cluster\.example\.net/)
  })

  it('rejects a CLIENT_URL that is not an http(s) URL', () => {
    assert.match(
      problemsFor({ ...BASE, CLIENT_URL: 'localhost:5173' }).message,
      /CLIENT_URL must be/,
    )
  })

  it('parses the auth configuration', () => {
    const config = loadConfig({ ...BASE, JWT_EXPIRES_IN: '2d', COOKIE_SAME_SITE: 'Strict' })

    assert.equal(config.jwt.expiresIn, '2d')
    assert.equal(config.jwt.expiresInMs, 2 * 24 * 60 * 60 * 1000)
    assert.deepEqual(config.cookie, {
      name: 'nist_fc_token',
      secure: false,
      sameSite: 'strict',
    })
  })

  it('validates JWT_SECRET without echoing it', () => {
    const short = problemsFor({ ...BASE, JWT_SECRET: 'too-short-secret' })
    assert.match(short.message, /JWT_SECRET must be at least 32 characters/)
    assert.doesNotMatch(short.message, /too-short-secret/)

    for (const NODE_ENV of ['development', 'production']) {
      const placeholder = problemsFor({
        ...BASE,
        ...CLOUDINARY,
        COOKIE_SECURE: 'true',
        NODE_ENV,
        JWT_SECRET: 'change-this-in-production',
      })
      assert.match(placeholder.message, /JWT_SECRET must not be the documented example value/)
    }
  })

  it('restricts JWT_EXPIRES_IN to <number><s|m|h|d>', () => {
    for (const value of ['30s', '15m', '12h', '1d']) {
      assert.equal(loadConfig({ ...BASE, JWT_EXPIRES_IN: value }).jwt.expiresIn, value)
    }
    for (const value of ['1', '1w', '1.5h', '0d', '1 day', '-1d']) {
      assert.match(
        problemsFor({ ...BASE, JWT_EXPIRES_IN: value }).message,
        /JWT_EXPIRES_IN must be/,
        value,
      )
    }
  })

  it('validates cookie settings', () => {
    assert.match(problemsFor({ ...BASE, COOKIE_NAME: 'bad name;' }).message, /COOKIE_NAME contains/)
    assert.match(problemsFor({ ...BASE, COOKIE_SECURE: 'yes' }).message, /COOKIE_SECURE must be "true" or "false"/)
    assert.match(problemsFor({ ...BASE, COOKIE_SAME_SITE: 'none' }).message, /COOKIE_SAME_SITE must be "lax" or "strict"/)
    assert.match(
      problemsFor({ ...BASE, ...CLOUDINARY, NODE_ENV: 'production', COOKIE_SECURE: 'false' }).message,
      /COOKIE_SECURE must be "true" in production/,
    )
  })

  it('requires Cloudinary in production', () => {
    const error = problemsFor({ ...BASE, NODE_ENV: 'production', COOKIE_SECURE: 'true' })
    assert.match(error.message, /required in production/)

    const config = loadConfig({
      ...BASE,
      ...CLOUDINARY,
      NODE_ENV: 'production',
      COOKIE_SECURE: 'true',
    })
    assert.equal(config.isProduction, true)
    assert.deepEqual(config.cloudinary, {
      cloudName: 'demo',
      apiKey: 'key',
      apiSecret: 'secret',
    })
    assert.equal(config.warnings.length, 0)
  })
})

describe('loadAdminSeedConfig', () => {
  const SEED = {
    MONGODB_URI: 'mongodb://127.0.0.1:27017/nist-fc',
    ADMIN_NAME: ' NIST FC Admin ',
    ADMIN_EMAIL: '  Admin@Example.COM ',
    ADMIN_PASSWORD: 'Str0ng!Passw0rd',
  }

  it('needs only MONGODB_URI and ADMIN_* and normalises values', () => {
    const config = loadAdminSeedConfig(SEED)

    assert.equal(config.mongodbUri, SEED.MONGODB_URI)
    assert.deepEqual(config.admin, {
      name: 'NIST FC Admin',
      email: 'admin@example.com',
      password: 'Str0ng!Passw0rd',
    })
  })

  it('reports every missing variable', () => {
    const error = problemsFor({}, loadAdminSeedConfig)

    for (const name of ['MONGODB_URI', 'ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']) {
      assert.match(error.message, new RegExp(`${name} is required`))
    }
  })

  it('rejects an invalid ADMIN_EMAIL', () => {
    assert.match(
      problemsFor({ ...SEED, ADMIN_EMAIL: 'not-an-email' }, loadAdminSeedConfig).message,
      /ADMIN_EMAIL must be a valid email address/,
    )
  })

  it('enforces the password requirements without echoing the password', () => {
    const cases = [
      ['Sh0rt!', /at least 8 characters/],
      ['lowercase1!', /at least one uppercase character/],
      ['UPPERCASE1!', /at least one lowercase character/],
      ['NoNumbers!!', /at least one number character/],
      ['NoSpecial123', /at least one special character/],
      [`Aa1!${'é'.repeat(35)}`, /at most 72 bytes/], // 39 characters, 74 bytes
    ]

    for (const [password, expected] of cases) {
      const error = problemsFor({ ...SEED, ADMIN_PASSWORD: password }, loadAdminSeedConfig)
      assert.match(error.message, expected, password)
      assert.ok(!error.message.includes(password), 'password must not be echoed')
    }
  })
})
