import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import mongoose from 'mongoose'
import TimelineEvent, { TIMELINE_CATEGORIES } from '../src/models/TimelineEvent.js'

const VALID = { title: 'Team Founded', year: 2022, category: 'founding', order: 1 }

async function errorsFor(fields) {
  try {
    await new TimelineEvent(fields).validate()
  } catch (error) {
    return error.errors
  }
  return {}
}

describe('TimelineEvent model', () => {
  it('uses the timelineEvents collection and the documented fields', () => {
    assert.equal(TimelineEvent.collection.collectionName, 'timelineEvents')
    for (const path of ['title', 'year', 'date', 'description', 'image', 'category', 'memory', 'order', 'published', 'createdAt', 'updatedAt']) {
      assert.ok(TimelineEvent.schema.path(path), path)
    }
    assert.equal(TimelineEvent.schema.path('memory').options.ref, 'Memory')
    assert.deepEqual(TIMELINE_CATEGORIES, ['founding', 'tournament', 'achievement', 'milestone', 'team', 'event', 'other'])
  })

  it('defaults to an unpublished draft with no date, image or memory', async () => {
    const event = new TimelineEvent(VALID)
    await event.validate()
    assert.equal(event.published, false)
    assert.equal(event.date, null)
    assert.equal(event.image, null)
    assert.equal(event.memory, null)
  })

  it('requires title, year, category and order', async () => {
    const errors = await errorsFor({})
    assert.deepEqual(Object.keys(errors).sort(), ['category', 'order', 'title', 'year'])
  })

  it('enforces the documented limits', async () => {
    const errors = await errorsFor({
      ...VALID,
      title: 'x'.repeat(151),
      description: 'x'.repeat(2001),
      year: 1899,
      category: 'match',
      order: 0,
    })
    assert.deepEqual(Object.keys(errors).sort(), ['category', 'description', 'order', 'title', 'year'])
    assert.ok((await errorsFor({ ...VALID, year: 2101 })).year)
    assert.ok((await errorsFor({ ...VALID, year: 2022.5 })).year)
    assert.ok((await errorsFor({ ...VALID, order: 1.5 })).order)
    assert.deepEqual(await errorsFor({ ...VALID, title: 'x'.repeat(150), description: 'x'.repeat(2000), year: 2100 }), {})
  })

  it('requires an exact date to fall in the event year', async () => {
    assert.ok((await errorsFor({ ...VALID, date: new Date('2023-01-01T00:00:00Z') })).date)
    assert.deepEqual(await errorsFor({ ...VALID, date: new Date('2022-12-31T00:00:00Z') }), {})
  })

  it('uses optimistic concurrency and indexes the public order', () => {
    assert.equal(TimelineEvent.schema.options.optimisticConcurrency, true)
    const indexes = TimelineEvent.schema.indexes().map(([fields]) => JSON.stringify(fields))
    for (const index of ['{"year":1}', '{"memory":1}', '{"order":1}', '{"published":1}', '{"published":1,"order":1,"_id":1}']) {
      assert.ok(indexes.includes(index), index)
    }
  })

  it('stores the memory as an ObjectId reference', async () => {
    const memory = new mongoose.Types.ObjectId()
    const event = new TimelineEvent({ ...VALID, memory: String(memory) })
    await event.validate()
    assert.ok(event.memory instanceof mongoose.Types.ObjectId)
    assert.equal(String(event.memory), String(memory))
  })
})
