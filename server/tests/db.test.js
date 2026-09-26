import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { connectDB } from '../src/config/db.js'

describe('connectDB', () => {
  it('fails without exposing the URI or credentials', async () => {
    // An invalid port fails while parsing, so no server is contacted.
    const uri = 'mongodb://fakeuser:SUPER-SECRET@db.example.net:99999/nist-fc'

    await assert.rejects(connectDB(uri), (error) => {
      assert.match(error.message, /^MongoDB connection failed/)
      assert.doesNotMatch(error.message, /SUPER-SECRET|fakeuser/)
      assert.equal(error.cause, undefined)
      return true
    })
  })
})
