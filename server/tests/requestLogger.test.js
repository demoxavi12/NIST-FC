import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { createApp } from '../src/app.js'
import { startServer, testConfig } from './helpers.js'

describe('requestLogger', () => {
  it('logs method, path, status and duration without query strings or headers', async (t) => {
    const info = t.mock.method(console, 'info', () => {})
    const server = await startServer(createApp(testConfig()))

    try {
      await fetch(`${server.baseUrl}/api/health?token=abc123`, {
        headers: { Cookie: 'nist_fc_token=secret-cookie' },
      })
      await delay(20) // 'finish' fires after the response is sent
    } finally {
      await server.close()
    }

    const lines = info.mock.calls.map((call) => call.arguments.join(' '))
    const line = lines.find((entry) => entry.startsWith('GET '))

    assert.match(line, /^GET \/api\/health 200 \d+\.\dms$/)
    assert.doesNotMatch(lines.join('\n'), /abc123|secret-cookie|token/)
  })
})
