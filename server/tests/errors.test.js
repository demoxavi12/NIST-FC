import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import express from 'express'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { createErrorHandler } from '../src/middleware/errorMiddleware.js'
import ApiError from '../src/utils/ApiError.js'
import { startServer, testConfig } from './helpers.js'

describe('404 and request-body errors', () => {
  let server

  before(async () => {
    server = await startServer(createApp(testConfig(), { logRequests: false }))
  })
  after(() => server.close())

  for (const path of ['/api/does-not-exist', '/not-an-api-route']) {
    it(`returns the 404 contract for ${path}`, async () => {
      const res = await fetch(`${server.baseUrl}${path}`)

      assert.equal(res.status, 404)
      assert.deepEqual(await res.json(), {
        success: false,
        message: 'API route not found',
        error: null,
      })
    })
  }

  it('rejects malformed JSON with 400', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name": ',
    })

    assert.equal(res.status, 400)
    assert.deepEqual(await res.json(), {
      success: false,
      message: 'Invalid JSON in request body',
      error: null,
    })
  })

  it('rejects JSON bodies over the limit with 413', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(150 * 1024) }),
    })

    assert.equal(res.status, 413)
    assert.deepEqual(await res.json(), {
      success: false,
      message: 'Request body too large',
      error: null,
    })
  })
})

describe('central error handler', () => {
  let server

  before(async () => {
    const app = express()
    app.get('/unexpected', () => {
      throw new Error('connection string mongodb://user:secret@host/db failed')
    })
    app.get('/async-unexpected', async () => {
      throw new Error('async failure')
    })
    app.get('/api-error', () => {
      throw new ApiError(422, 'Unprocessable', { field: 'Problem' })
    })
    app.get('/cast', () => {
      throw new mongoose.Error.CastError('ObjectId', 'not-an-id', '_id')
    })
    app.get('/validation', () => {
      const error = new mongoose.Error.ValidationError()
      error.addError(
        'name',
        new mongoose.Error.ValidatorError({ message: 'Name is required', path: 'name' }),
      )
      throw error
    })
    app.get('/duplicate', () => {
      throw Object.assign(new Error('E11000 duplicate key'), {
        code: 11000,
        keyValue: { slug: 'rahul-das' },
      })
    })
    app.use(createErrorHandler({ isProduction: true }))

    server = await startServer(app)
  })
  after(() => server.close())

  async function get(path) {
    const res = await fetch(`${server.baseUrl}${path}`)
    return { status: res.status, body: await res.json() }
  }

  it('hides unexpected errors behind a generic 500', async (t) => {
    const logged = t.mock.method(console, 'error', () => {})
    const { status, body } = await get('/unexpected')

    assert.equal(status, 500)
    assert.deepEqual(body, {
      success: false,
      message: 'Internal server error',
      error: null,
    })
    // Logged server-side in production without a stack trace.
    assert.equal(logged.mock.callCount(), 1)
    assert.doesNotMatch(logged.mock.calls[0].arguments.join(' '), /\n\s+at /)
  })

  it('handles rejected async handlers (Express 5)', async (t) => {
    t.mock.method(console, 'error', () => {})
    const { status, body } = await get('/async-unexpected')

    assert.equal(status, 500)
    assert.equal(body.message, 'Internal server error')
  })

  it('passes ApiError status, message and details through', async () => {
    assert.deepEqual(await get('/api-error'), {
      status: 422,
      body: { success: false, message: 'Unprocessable', error: { field: 'Problem' } },
    })
  })

  it('maps Mongoose CastError to 400', async () => {
    assert.deepEqual(await get('/cast'), {
      status: 400,
      body: { success: false, message: 'Invalid _id', error: null },
    })
  })

  it('maps Mongoose ValidationError to 400 with field messages', async () => {
    assert.deepEqual(await get('/validation'), {
      status: 400,
      body: {
        success: false,
        message: 'Validation failed',
        error: { name: 'Name is required' },
      },
    })
  })

  it('maps duplicate keys to 409', async () => {
    assert.deepEqual(await get('/duplicate'), {
      status: 409,
      body: {
        success: false,
        message: 'Resource already exists',
        error: { slug: 'Already exists' },
      },
    })
  })
})
