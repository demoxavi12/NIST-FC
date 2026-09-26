import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { CLIENT_URL, startServer, testConfig } from './helpers.js'

describe('GET /api/health', () => {
  let server

  before(async () => {
    server = await startServer(createApp(testConfig(), { logRequests: false }))
  })
  after(() => server.close())

  it('returns 200 with the success contract', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`)

    assert.equal(res.status, 200)
    assert.match(res.headers.get('content-type'), /application\/json/)
    assert.deepEqual(await res.json(), {
      success: true,
      data: null,
      message: 'NIST FC API is running',
    })
  })

  it('sets security headers and hides X-Powered-By', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`)

    assert.equal(res.headers.get('x-powered-by'), null)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  })
})

describe('CORS', () => {
  let server

  before(async () => {
    server = await startServer(createApp(testConfig(), { logRequests: false }))
  })
  after(() => server.close())

  it('allows credentialed requests from CLIENT_URL', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, {
      headers: { Origin: CLIENT_URL },
    })

    assert.equal(res.headers.get('access-control-allow-origin'), CLIENT_URL)
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true')
  })

  it('does not allow other origins', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, {
      headers: { Origin: 'https://evil.example' },
    })

    assert.equal(res.headers.get('access-control-allow-origin'), null)
  })

  it('answers preflight requests for the frontend origin', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: CLIENT_URL,
        'Access-Control-Request-Method': 'PATCH',
      },
    })

    assert.equal(res.status, 204)
    assert.equal(res.headers.get('access-control-allow-origin'), CLIENT_URL)
    assert.match(res.headers.get('access-control-allow-methods'), /PATCH/)
  })
})
