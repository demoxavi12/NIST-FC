import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import bcrypt from 'bcrypt'
import { createInitialAdmin } from '../scripts/seedAdmin.js'
import Admin from '../src/models/Admin.js'

const INPUT = {
  name: 'NIST FC Admin',
  email: 'admin@example.com',
  password: 'Str0ng!Passw0rd',
}

describe('createInitialAdmin', () => {
  it('leaves an existing admin unchanged', async (t) => {
    t.mock.method(Admin, 'exists', async () => ({ _id: 'existing' }))
    const create = t.mock.method(Admin, 'create', async () => {})

    assert.deepEqual(await createInitialAdmin(INPUT), { created: false })
    assert.equal(create.mock.callCount(), 0)
  })

  it('stores a bcrypt hash, never the plaintext password', async (t) => {
    const exists = t.mock.method(Admin, 'exists', async () => null)
    const create = t.mock.method(Admin, 'create', async () => {})

    assert.deepEqual(await createInitialAdmin(INPUT), { created: true })
    assert.deepEqual(exists.mock.calls[0].arguments[0], { email: INPUT.email })

    const stored = create.mock.calls[0].arguments[0]
    assert.equal(stored.name, INPUT.name)
    assert.equal(stored.email, INPUT.email)
    assert.equal(stored.role, 'admin')
    assert.equal(stored.password, undefined)
    assert.notEqual(stored.passwordHash, INPUT.password)
    assert.match(stored.passwordHash, /^\$2b\$12\$/)
    assert.equal(await bcrypt.compare(INPUT.password, stored.passwordHash), true)
  })

  it('treats a concurrent duplicate as already existing', async (t) => {
    t.mock.method(Admin, 'exists', async () => null)
    t.mock.method(Admin, 'create', async () => {
      throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
    })

    assert.deepEqual(await createInitialAdmin(INPUT), { created: false })
  })

  it('rethrows other database errors', async (t) => {
    t.mock.method(Admin, 'exists', async () => null)
    t.mock.method(Admin, 'create', async () => {
      throw new Error('write failed')
    })

    await assert.rejects(createInitialAdmin(INPUT), /write failed/)
  })
})
