import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { createRequireAuth, requireRole } from '../src/middleware/authMiddleware.js'
import { createErrorHandler } from '../src/middleware/errorMiddleware.js'
import { LOGIN_RATE_LIMIT } from '../src/middleware/rateLimitMiddleware.js'
import Admin from '../src/models/Admin.js'
import { AUTH_ENV, startServer, testConfig } from './helpers.js'

const PASSWORD = 'Correct-Horse-1!'
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4) // low cost keeps tests fast
const COOKIE = AUTH_ENV.COOKIE_NAME
const SECRET = AUTH_ENV.JWT_SECRET

const AUTH_REQUIRED = { success: false, message: 'Authentication required', error: null }
const INVALID_CREDENTIALS = { success: false, message: 'Invalid email or password', error: null }

function fakeAdmin(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'NIST FC Admin',
    email: 'admin@example.com',
    role: 'admin',
    passwordHash: PASSWORD_HASH,
    ...overrides,
  }
}

/** Stubs Admin.findOne(...).select('+passwordHash'). */
function mockFindOne(t, result) {
  return t.mock.method(Admin, 'findOne', () => ({ select: async () => result }))
}

function mockFindById(t, result) {
  return t.mock.method(Admin, 'findById', async () => result)
}

function tokenFor(admin, options = {}) {
  return jwt.sign({ role: admin.role }, SECRET, {
    algorithm: 'HS256',
    subject: String(admin._id),
    expiresIn: '1h',
    ...options,
  })
}

function post(baseUrl, path, body, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function withCookie(token) {
  return { Cookie: `${COOKIE}=${token}` }
}

describe('POST /api/auth/login', () => {
  let server

  before(async () => {
    server = await startServer(createApp(testConfig(), { logRequests: false }))
  })
  after(() => server.close())

  it('returns 400 with field messages for a missing email and password', async (t) => {
    const findOne = mockFindOne(t, null)
    const res = await post(server.baseUrl, '/api/auth/login', {})

    assert.equal(res.status, 400)
    assert.deepEqual(await res.json(), {
      success: false,
      message: 'Validation failed',
      error: { email: 'Email is required', password: 'Password is required' },
    })
    assert.equal(findOne.mock.callCount(), 0)
  })

  it('rejects an invalid email and non-string password (NoSQL operator)', async (t) => {
    const findOne = mockFindOne(t, null)
    const res = await post(server.baseUrl, '/api/auth/login', {
      email: 'not-an-email',
      password: { $ne: null },
    })

    assert.equal(res.status, 400)
    assert.deepEqual((await res.json()).error, {
      email: 'Email must be a valid email address',
      password: 'Password must be a string',
    })
    assert.equal(findOne.mock.callCount(), 0)
  })

  it('rejects a body that is not a JSON object', async () => {
    const res = await post(server.baseUrl, '/api/auth/login', '[]')

    assert.equal(res.status, 400)
    assert.deepEqual((await res.json()).error, { body: 'Request body must be a JSON object' })
  })

  it('returns a generic 401 for an unknown email, still running bcrypt', async (t) => {
    mockFindOne(t, null)
    const compare = t.mock.method(bcrypt, 'compare')
    const res = await post(server.baseUrl, '/api/auth/login', {
      email: 'nobody@example.com',
      password: PASSWORD,
    })

    assert.equal(res.status, 401)
    assert.deepEqual(await res.json(), INVALID_CREDENTIALS)
    assert.equal(compare.mock.callCount(), 1)
    assert.equal(res.headers.getSetCookie().length, 0)
  })

  it('returns the identical 401 for a wrong password', async (t) => {
    mockFindOne(t, fakeAdmin())
    const res = await post(server.baseUrl, '/api/auth/login', {
      email: 'admin@example.com',
      password: 'Wrong-Password-1!',
    })

    assert.equal(res.status, 401)
    assert.deepEqual(await res.json(), INVALID_CREDENTIALS)
    assert.equal(res.headers.getSetCookie().length, 0)
  })

  it('logs in, normalising the email and setting the HTTP-only cookie', async (t) => {
    const admin = fakeAdmin()
    const findOne = mockFindOne(t, admin)
    const res = await post(server.baseUrl, '/api/auth/login', {
      email: '  Admin@Example.COM ',
      password: PASSWORD,
      extra: 'ignored',
    })
    const text = await res.text()

    assert.equal(res.status, 200)
    assert.deepEqual(findOne.mock.calls[0].arguments[0], { email: 'admin@example.com' })
    assert.deepEqual(JSON.parse(text), {
      success: true,
      data: {
        admin: { id: String(admin._id), name: admin.name, email: admin.email, role: 'admin' },
      },
      message: 'Login successful',
    })
    assert.doesNotMatch(text, /passwordHash|\$2b\$|eyJ/)
    assert.equal(res.headers.get('cache-control'), 'no-store')

    const [cookie] = res.headers.getSetCookie()
    const token = cookie.match(new RegExp(`^${COOKIE}=([^;]+)`))[1]
    assert.match(cookie, /; Max-Age=3600;/)
    assert.match(cookie, /; Path=\//)
    assert.match(cookie, /; HttpOnly/)
    assert.match(cookie, /; SameSite=Lax/)
    assert.doesNotMatch(cookie, /; Secure/)

    const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] })
    assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'role', 'sub'])
    assert.equal(payload.sub, String(admin._id))
    assert.equal(payload.role, 'admin')
    assert.equal(payload.exp - payload.iat, 3600)
  })
})

describe('login cookie in production-style configuration', () => {
  it('sets Secure when COOKIE_SECURE is true', async (t) => {
    const server = await startServer(
      createApp(testConfig({ COOKIE_SECURE: 'true' }), { logRequests: false }),
    )
    try {
      mockFindOne(t, fakeAdmin())
      const res = await post(server.baseUrl, '/api/auth/login', {
        email: 'admin@example.com',
        password: PASSWORD,
      })
      assert.equal(res.status, 200)
      assert.match(res.headers.getSetCookie()[0], /; Secure/)
    } finally {
      await server.close()
    }
  })
})

describe('login rate limiting', () => {
  const attempt = (baseUrl, password) =>
    post(baseUrl, '/api/auth/login', { email: 'admin@example.com', password })

  it(`returns 429 after ${LOGIN_RATE_LIMIT.limit} failed attempts`, async (t) => {
    const server = await startServer(createApp(testConfig(), { logRequests: false }))
    try {
      mockFindOne(t, null)
      t.mock.method(bcrypt, 'compare', async () => false)

      for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i += 1) {
        assert.equal((await attempt(server.baseUrl, 'Wrong-1!')).status, 401)
      }
      const limited = await attempt(server.baseUrl, 'Wrong-1!')

      assert.equal(limited.status, 429)
      assert.deepEqual(await limited.json(), {
        success: false,
        message: 'Too many login attempts. Please try again later.',
        error: null,
      })
    } finally {
      await server.close()
    }
  })

  it('does not count successful logins', async (t) => {
    const server = await startServer(createApp(testConfig(), { logRequests: false }))
    try {
      mockFindOne(t, fakeAdmin())
      const compare = t.mock.method(bcrypt, 'compare', async (password) => password === PASSWORD)

      for (let i = 0; i < LOGIN_RATE_LIMIT.limit - 1; i += 1) {
        assert.equal((await attempt(server.baseUrl, 'Wrong-1!')).status, 401)
      }
      for (let i = 0; i < 5; i += 1) {
        assert.equal((await attempt(server.baseUrl, PASSWORD)).status, 200)
      }
      // The 10th failure is still allowed; the 11th is limited.
      assert.equal((await attempt(server.baseUrl, 'Wrong-1!')).status, 401)
      assert.equal((await attempt(server.baseUrl, 'Wrong-1!')).status, 429)
      assert.ok(compare.mock.callCount() >= LOGIN_RATE_LIMIT.limit + 5)
    } finally {
      await server.close()
    }
  })
})

describe('GET /api/auth/me', () => {
  let server

  before(async () => {
    server = await startServer(createApp(testConfig(), { logRequests: false }))
  })
  after(() => server.close())

  const me = (headers) => fetch(`${server.baseUrl}/api/auth/me`, { headers })

  it('returns the authenticated admin without sensitive fields', async (t) => {
    const admin = fakeAdmin()
    const findById = mockFindById(t, admin)
    const res = await me(withCookie(tokenFor(admin)))

    assert.equal(res.status, 200)
    assert.equal(res.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await res.json(), {
      success: true,
      data: {
        admin: { id: String(admin._id), name: admin.name, email: admin.email, role: 'admin' },
      },
      message: 'Authenticated admin retrieved successfully',
    })
    assert.equal(findById.mock.calls[0].arguments[0], String(admin._id))
  })

  it('uses the role stored in the database, not the token', async (t) => {
    const admin = fakeAdmin({ role: 'admin' })
    mockFindById(t, admin)
    const res = await me(withCookie(tokenFor({ ...admin, role: 'superAdmin' })))

    assert.equal((await res.json()).data.admin.role, 'admin')
  })

  const rejected = {
    'no cookie': () => ({}),
    'a malformed token': () => withCookie('not-a-jwt'),
    'a token signed with another secret': () =>
      withCookie(jwt.sign({ role: 'admin' }, 'another-secret-that-is-at-least-32-chars', {
        subject: String(new mongoose.Types.ObjectId()),
      })),
    'an expired token': () =>
      withCookie(jwt.sign(
        { role: 'admin', exp: Math.floor(Date.now() / 1000) - 60 },
        SECRET,
        { subject: String(new mongoose.Types.ObjectId()) },
      )),
    'an unsigned alg:none token': () => {
      const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
      const sub = String(new mongoose.Types.ObjectId())
      return withCookie(`${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub, role: 'admin' })}.`)
    },
    'a token whose subject is not an ObjectId': () =>
      withCookie(jwt.sign({ role: 'admin' }, SECRET, { subject: 'not-an-id', expiresIn: '1h' })),
  }

  for (const [label, headers] of Object.entries(rejected)) {
    it(`returns 401 for ${label}`, async (t) => {
      const findById = mockFindById(t, fakeAdmin())
      const res = await me(headers())

      assert.equal(res.status, 401)
      assert.deepEqual(await res.json(), AUTH_REQUIRED)
      assert.equal(findById.mock.callCount(), 0)
    })
  }

  it('returns 401 when the admin no longer exists', async (t) => {
    mockFindById(t, null)
    const res = await me(withCookie(tokenFor(fakeAdmin())))

    assert.equal(res.status, 401)
    assert.deepEqual(await res.json(), AUTH_REQUIRED)
  })
})

describe('POST /api/auth/logout', () => {
  let server

  before(async () => {
    server = await startServer(createApp(testConfig(), { logRequests: false }))
  })
  after(() => server.close())

  it('requires authentication', async () => {
    const res = await post(server.baseUrl, '/api/auth/logout', {})

    assert.equal(res.status, 401)
    assert.deepEqual(await res.json(), AUTH_REQUIRED)
    assert.equal(res.headers.getSetCookie().length, 0)
  })

  it('clears the cookie with the attributes it was set with', async (t) => {
    const admin = fakeAdmin()
    mockFindById(t, admin)
    const res = await post(server.baseUrl, '/api/auth/logout', {}, withCookie(tokenFor(admin)))

    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { success: true, data: null, message: 'Logout successful' })

    const [cookie] = res.headers.getSetCookie()
    assert.match(cookie, new RegExp(`^${COOKIE}=;`))
    assert.match(cookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/)
    assert.match(cookie, /; Path=\//)
    assert.match(cookie, /; HttpOnly/)
    assert.match(cookie, /; SameSite=Lax/)
  })
})

describe('requireRole', () => {
  let server

  before(async () => {
    const config = testConfig()
    const app = express()
    app.use(cookieParser())
    app.get('/super', createRequireAuth(config), requireRole('superAdmin'), (req, res) => {
      res.json({ ok: true })
    })
    app.get('/unauthenticated', requireRole('admin'), (req, res) => res.json({ ok: true }))
    app.use(createErrorHandler(config))
    server = await startServer(app)
  })
  after(() => server.close())

  it('returns 403 for a role that is not allowed', async (t) => {
    const admin = fakeAdmin({ role: 'admin' })
    mockFindById(t, admin)
    const res = await fetch(`${server.baseUrl}/super`, { headers: withCookie(tokenFor(admin)) })

    assert.equal(res.status, 403)
    assert.deepEqual(await res.json(), {
      success: false,
      message: 'Insufficient permissions',
      error: null,
    })
  })

  it('allows an allowed role', async (t) => {
    const admin = fakeAdmin({ role: 'superAdmin' })
    mockFindById(t, admin)
    const res = await fetch(`${server.baseUrl}/super`, { headers: withCookie(tokenFor(admin)) })

    assert.equal(res.status, 200)
  })

  it('returns 401 when used without requireAuth', async () => {
    const res = await fetch(`${server.baseUrl}/unauthenticated`)

    assert.equal(res.status, 401)
    assert.deepEqual(await res.json(), AUTH_REQUIRED)
  })
})

describe('proxy trust and logging', () => {
  it('trusts one proxy hop in production only', () => {
    assert.equal(createApp(testConfig(), { logRequests: false }).get('trust proxy'), false)

    const production = testConfig({
      NODE_ENV: 'production',
      COOKIE_SECURE: 'true',
      CLOUDINARY_CLOUD_NAME: 'demo',
      CLOUDINARY_API_KEY: 'key',
      CLOUDINARY_API_SECRET: 'secret',
    })
    assert.equal(createApp(production, { logRequests: false }).get('trust proxy'), 1)
  })

  it('never logs credentials or tokens for login requests', async (t) => {
    const info = t.mock.method(console, 'info', () => {})
    mockFindOne(t, fakeAdmin())
    const server = await startServer(createApp(testConfig()))

    try {
      const res = await post(server.baseUrl, '/api/auth/login', {
        email: 'admin@example.com',
        password: PASSWORD,
      })
      assert.equal(res.status, 200)
      await delay(20)
    } finally {
      await server.close()
    }

    const logged = info.mock.calls.map((call) => call.arguments.join(' ')).join('\n')
    assert.match(logged, /POST \/api\/auth\/login 200/)
    assert.doesNotMatch(logged, /admin@example\.com|Correct-Horse|eyJ|\$2b\$/)
  })
})
