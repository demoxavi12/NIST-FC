import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  adminListMemoriesQuerySchema,
  createMemorySchema,
  listMemoriesQuerySchema,
  updateMemorySchema,
} from '../src/validators/memoryValidators.js'

const OPTIONS = { abortEarly: false, stripUnknown: true }
const ID_A = '6a1111111111111111111111'
const ID_B = '6a2222222222222222222222'

const errorsOf = (schema, value) =>
  Object.fromEntries((schema.validate(value, OPTIONS).error?.details ?? []).map((d) => [d.path.join('.'), d.message]))

describe('memory validators', () => {
  it('converts a create request from multipart text fields', () => {
    const { value, error } = createMemorySchema.validate(
      {
        title: '  University Tournament 2025 ',
        date: '2025-12-12',
        players: JSON.stringify([ID_A, ID_B, ID_A]),
        tags: JSON.stringify([' Final ', 'final', 'CUP']),
        published: 'true',
        extra: 'dropped',
      },
      OPTIONS,
    )

    assert.equal(error, undefined)
    assert.equal(value.title, 'University Tournament 2025')
    assert.equal(value.date.toISOString(), '2025-12-12T00:00:00.000Z')
    assert.deepEqual(value.players, [ID_A, ID_B])
    assert.deepEqual(value.tags, ['final', 'cup'])
    assert.equal(value.published, true)
    assert.equal(value.extra, undefined)
  })

  it('defaults new memories to drafts with no players or tags', () => {
    const { value } = createMemorySchema.validate({ title: 'T', date: '2024-01-31' }, OPTIONS)
    assert.equal(value.published, false)
    assert.deepEqual(value.players, [])
    assert.deepEqual(value.tags, [])
  })

  it('requires title and a real calendar date', () => {
    assert.deepEqual(errorsOf(createMemorySchema, {}), { title: 'Title is required', date: 'Date is required' })
    for (const date of ['2025-02-30', '2025-13-01', '12/12/2025', '2025-1-5']) {
      assert.equal(errorsOf(createMemorySchema, { title: 'T', date }).date, 'Date must be a valid date in the format YYYY-MM-DD', date)
    }
  })

  it('rejects malformed arrays, bad player ids and oversized tags', () => {
    const errors = errorsOf(createMemorySchema, {
      title: 'T',
      date: '2025-12-12',
      players: '["not-an-id"]',
      tags: JSON.stringify(Array.from({ length: 21 }, (_, i) => `tag-${i}`)),
    })
    assert.equal(errors['players.0'], 'Invalid player id')
    assert.equal(errors.tags, 'A memory can have at most 20 tags')

    assert.match(errorsOf(createMemorySchema, { title: 'T', date: '2025-12-12', players: '[oops' }).players, /must be a JSON array/)
    assert.match(errorsOf(createMemorySchema, { title: 'T', date: '2025-12-12', tags: 'final, cup' }).tags, /must be a JSON array/)
    assert.equal(
      errorsOf(createMemorySchema, { title: 'T', date: '2025-12-12', tags: JSON.stringify(['x'.repeat(31)]) })['tags.0'],
      'Each tag must be at most 30 characters',
    )
  })

  it('accepts partial updates, removePhotos and expectedUpdatedAt', () => {
    const { value, error } = updateMemorySchema.validate(
      { removePhotos: '["a","b","a"]', expectedUpdatedAt: '2026-01-01T10:00:00.000Z', published: 'false' },
      OPTIONS,
    )
    assert.equal(error, undefined)
    assert.deepEqual(value.removePhotos, ['a', 'b'])
    assert.equal(value.expectedUpdatedAt.toISOString(), '2026-01-01T10:00:00.000Z')
    assert.equal(value.published, false)
    assert.equal(value.title, undefined, 'unsupplied fields stay absent')
  })

  it('validates list queries', () => {
    assert.deepEqual(listMemoriesQuerySchema.validate({}, OPTIONS).value, { page: 1, limit: 12 })
    assert.deepEqual(adminListMemoriesQuerySchema.validate({}, OPTIONS).value, { page: 1, limit: 20 })
    assert.equal(listMemoriesQuerySchema.validate({ tag: ' Final ' }, OPTIONS).value.tag, 'final')
    assert.deepEqual(Object.keys(errorsOf(listMemoriesQuerySchema, { limit: '49', player: 'x' })).sort(), ['limit', 'player'])
    assert.equal(adminListMemoriesQuerySchema.validate({ published: 'false' }, OPTIONS).value.published, false)
  })
})
