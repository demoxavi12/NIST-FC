import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  adminListTimelineQuerySchema,
  createTimelineEventSchema,
  reorderTimelineSchema,
  timelineIdParamSchema,
  updateTimelineEventSchema,
} from '../src/validators/timelineValidators.js'

const OPTIONS = { abortEarly: false, stripUnknown: true }
const ID_A = '6a1111111111111111111111'
const ID_B = '6a2222222222222222222222'

const errorsOf = (schema, value) =>
  Object.fromEntries((schema.validate(value, OPTIONS).error?.details ?? []).map((d) => [d.path.join('.'), d.message]))

describe('timeline validators', () => {
  it('converts a create request from multipart text fields', () => {
    const { value, error } = createTimelineEventSchema.validate(
      {
        title: '  Team Founded ',
        year: '2022',
        date: '2022-08-15',
        category: 'founding',
        memory: ID_A,
        published: 'true',
        order: '7',
        extra: 'dropped',
      },
      OPTIONS,
    )
    assert.equal(error, undefined)
    assert.equal(value.title, 'Team Founded')
    assert.equal(value.year, 2022)
    assert.equal(value.date.toISOString(), '2022-08-15T00:00:00.000Z')
    assert.equal(value.published, true)
    assert.equal(value.memory, ID_A)
    assert.equal('order' in value, false, 'order is assigned by the server')
    assert.equal('extra' in value, false)
  })

  it('requires title, year and category and defaults to a draft', () => {
    assert.deepEqual(Object.keys(errorsOf(createTimelineEventSchema, {})).sort(), ['category', 'title', 'year'])
    const { value } = createTimelineEventSchema.validate({ title: 'T', year: 2022, category: 'team' }, OPTIONS)
    assert.equal(value.published, false)
  })

  it('enforces the limits with clear messages', () => {
    const errors = errorsOf(createTimelineEventSchema, {
      title: 'x'.repeat(151),
      year: '1899',
      date: '2022-02-30',
      description: 'x'.repeat(2001),
      category: 'match',
      memory: 'nope',
    })
    assert.equal(errors.title, 'Title must be at most 150 characters')
    assert.equal(errors.year, 'Year must be a whole number from 1900 to 2100')
    assert.equal(errors.date, 'Date must be a valid date in the format YYYY-MM-DD')
    assert.equal(errors.description, 'Description must be at most 2000 characters')
    assert.match(errors.category, /^Category must be one of: founding, tournament/)
    assert.equal(errors.memory, 'Invalid memory id')
    assert.ok(errorsOf(createTimelineEventSchema, { title: 'T', year: '2022.5', category: 'team' }).year)
    assert.ok(errorsOf(createTimelineEventSchema, { title: 'T', year: 2101, category: 'team' }).year)
  })

  it('lets an update clear the date and the memory with empty values', () => {
    const { value, error } = updateTimelineEventSchema.validate(
      { date: '', memory: '', removeImage: 'true', expectedUpdatedAt: '2026-01-01T10:00:00.000Z' },
      OPTIONS,
    )
    assert.equal(error, undefined)
    assert.equal(value.date, '')
    assert.equal(value.memory, '')
    assert.equal(value.removeImage, true)
    assert.ok(value.expectedUpdatedAt instanceof Date)
    assert.deepEqual(errorsOf(updateTimelineEventSchema, {}), {})
  })

  it('validates reorder items: ids, positive whole orders, no duplicates', () => {
    const ok = reorderTimelineSchema.validate({ items: [{ id: ID_A, order: 2 }, { id: ID_B, order: '1' }] }, OPTIONS)
    assert.equal(ok.error, undefined)
    assert.equal(ok.value.items[1].order, 1)

    assert.ok(errorsOf(reorderTimelineSchema, {}).items)
    assert.ok(errorsOf(reorderTimelineSchema, { items: [] }).items)
    assert.ok(errorsOf(reorderTimelineSchema, { items: [{ id: 'reorder', order: 1 }] })['items.0.id'])
    assert.ok(errorsOf(reorderTimelineSchema, { items: [{ id: ID_A, order: 0 }] })['items.0.order'])
    assert.ok(errorsOf(reorderTimelineSchema, { items: [{ id: ID_A, order: 1.5 }] })['items.0.order'])
    const duplicateId = errorsOf(reorderTimelineSchema, { items: [{ id: ID_A, order: 1 }, { id: ID_A, order: 2 }] })
    assert.equal(duplicateId['items.1'], 'Each event and each order may appear only once')
    const duplicateOrder = errorsOf(reorderTimelineSchema, { items: [{ id: ID_A, order: 1 }, { id: ID_B, order: 1 }] })
    assert.equal(duplicateOrder['items.1'], 'Each event and each order may appear only once')
  })

  it('validates the admin filter and id parameter', () => {
    assert.equal(adminListTimelineQuerySchema.validate({ published: 'false' }).value.published, false)
    assert.ok(errorsOf(adminListTimelineQuerySchema, { published: 'maybe' }).published)
    assert.equal(errorsOf(timelineIdParamSchema, { id: 'reorder' }).id, 'Invalid timeline event id')
  })
})
