import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import Memory, { MAX_GALLERY_PHOTOS } from '../src/models/Memory.js'

const IMAGE = { url: 'https://res.cloudinary.com/demo/image/upload/x.jpg', publicId: 'x' }
const VALID = {
  title: 'Test Memory',
  slug: 'test-memory',
  date: new Date('2025-12-12T00:00:00Z'),
  coverImage: IMAGE,
}

async function errorsFor(fields) {
  try {
    await new Memory(fields).validate()
  } catch (error) {
    return error.errors
  }
  return {}
}

describe('Memory model', () => {
  it('uses the memories collection and the documented fields', () => {
    assert.equal(Memory.collection.collectionName, 'memories')
    for (const path of ['title', 'slug', 'description', 'date', 'location', 'coverImage', 'photos', 'players', 'tags', 'published', 'createdAt', 'updatedAt']) {
      assert.ok(Memory.schema.path(path), path)
    }
    assert.equal(Memory.schema.path('players').embeddedSchemaType.options.ref, 'Player')
  })

  it('defaults to an unpublished draft with an empty gallery', async () => {
    const memory = new Memory(VALID)
    await memory.validate()
    assert.equal(memory.published, false)
    assert.deepEqual(memory.photos.toObject(), [])
    assert.deepEqual(memory.players.toObject(), [])
    assert.deepEqual(memory.tags.toObject(), [])
  })

  it('requires title, slug, date and a cover image', async () => {
    const errors = await errorsFor({})
    assert.deepEqual(Object.keys(errors).sort(), ['coverImage', 'date', 'slug', 'title'])
  })

  it(`limits the gallery to ${MAX_GALLERY_PHOTOS} photos`, async () => {
    const photos = (count) => Array.from({ length: count }, (_, i) => ({ url: `u${i}`, publicId: `p${i}` }))
    assert.equal((await errorsFor({ ...VALID, photos: photos(MAX_GALLERY_PHOTOS) })).photos, undefined)
    assert.ok((await errorsFor({ ...VALID, photos: photos(MAX_GALLERY_PHOTOS + 1) })).photos)
  })

  it('stores tags trimmed and lowercase', async () => {
    const memory = new Memory({ ...VALID, tags: ['  Final ', 'CUP'] })
    await memory.validate()
    assert.deepEqual(memory.tags.toObject(), ['final', 'cup'])
  })

  it('declares the documented indexes and optimistic concurrency', () => {
    assert.equal(Memory.schema.path('slug').options.unique, true)
    for (const path of ['date', 'players', 'published']) {
      assert.ok(Memory.schema.path(path).options.index, path)
    }
    const indexes = Memory.schema.indexes().map(([fields]) => fields)
    assert.ok(indexes.some((fields) => JSON.stringify(fields) === JSON.stringify({ published: 1, date: -1, _id: -1 })))
    assert.equal(Memory.schema.options.optimisticConcurrency, true)
  })
})
