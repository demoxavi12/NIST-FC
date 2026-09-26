import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import Admin, { ADMIN_ROLES } from '../src/models/Admin.js'

async function validationErrorOf(doc) {
  try {
    await doc.validate()
  } catch (error) {
    return error
  }
  assert.fail('expected a validation error')
}

describe('Admin model', () => {
  it('uses the admins collection', () => {
    assert.equal(Admin.collection.collectionName, 'admins')
  })

  it('requires name, email and passwordHash', async () => {
    const { errors } = await validationErrorOf(new Admin({}))

    assert.deepEqual(Object.keys(errors).sort(), ['email', 'name', 'passwordHash'])
    assert.equal(errors.name.message, 'Name is required')
    assert.equal(errors.email.message, 'Email is required')
  })

  it('normalises email and name and defaults role to admin', async () => {
    const admin = new Admin({
      name: '  NIST FC Admin ',
      email: '  Admin@Example.COM ',
      passwordHash: 'hash',
    })

    await admin.validate()
    assert.equal(admin.name, 'NIST FC Admin')
    assert.equal(admin.email, 'admin@example.com')
    assert.equal(admin.role, 'admin')
  })

  it('supports admin and the future superAdmin role only', async () => {
    assert.deepEqual(ADMIN_ROLES, ['admin', 'superAdmin'])

    const superAdmin = new Admin({ name: 'A', email: 'a@b.co', passwordHash: 'h', role: 'superAdmin' })
    await superAdmin.validate()

    const invalid = new Admin({ name: 'A', email: 'a@b.co', passwordHash: 'h', role: 'owner' })
    const { errors } = await validationErrorOf(invalid)
    assert.equal(errors.role.message, 'Role must be admin or superAdmin')
  })

  it('declares a unique email and hides passwordHash from queries', () => {
    assert.equal(Admin.schema.path('email').options.unique, true)
    assert.equal(Admin.schema.path('passwordHash').options.select, false)
    assert.ok(Admin.schema.path('createdAt'), 'timestamps enabled')
    assert.ok(Admin.schema.path('updatedAt'), 'timestamps enabled')
  })

  it('never serialises passwordHash', () => {
    const admin = new Admin({ name: 'A', email: 'a@b.co', passwordHash: 'secret-hash' })

    for (const output of [admin.toJSON(), admin.toObject(), JSON.parse(JSON.stringify(admin))]) {
      assert.equal(output.passwordHash, undefined)
      assert.equal(output.__v, undefined)
      assert.equal(output.email, 'a@b.co')
    }
  })
})
