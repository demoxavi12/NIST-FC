import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ConfigError, loadConfig } from '../src/config/env.js'

const BASE = {
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb+srv://user:s3cret-pass@cluster.example.net/nist-fc?retryWrites=true',
  CLIENT_URL: 'http://localhost:5173/',
}

const CLOUDINARY = {
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
}

function problemsFor(env) {
  try {
    loadConfig(env)
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

    assert.equal(error.problems.length, 3)
    assert.match(error.message, /NODE_ENV is required/)
    assert.match(error.message, /MONGODB_URI is required/)
    assert.match(error.message, /CLIENT_URL is required/)
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

  it('requires Cloudinary in production', () => {
    const error = problemsFor({ ...BASE, NODE_ENV: 'production' })
    assert.match(error.message, /required in production/)

    const config = loadConfig({ ...BASE, ...CLOUDINARY, NODE_ENV: 'production' })
    assert.equal(config.isProduction, true)
    assert.deepEqual(config.cloudinary, {
      cloudName: 'demo',
      apiKey: 'key',
      apiSecret: 'secret',
    })
    assert.equal(config.warnings.length, 0)
  })
})
