import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import Admin from '../src/models/Admin.js'
import Memory from '../src/models/Memory.js'
import TimelineEvent from '../src/models/TimelineEvent.js'
import { cloudinaryService } from '../src/services/cloudinaryService.js'
import { AUTH_ENV, startServer, testConfig } from './helpers.js'

// ---- fixtures -------------------------------------------------------------

const ADMIN = { _id: new mongoose.Types.ObjectId(), name: 'Admin', email: 'a@b.co', role: 'admin' }
const AUTH = {
  Cookie: `${AUTH_ENV.COOKIE_NAME}=${jwt.sign({ role: 'admin' }, AUTH_ENV.JWT_SECRET, {
    subject: String(ADMIN._id),
    expiresIn: '1h',
  })}`,
}
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])
const img = (publicId) => ({ url: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`, publicId })
const MEMORY_ID = new mongoose.Types.ObjectId()
const MEMORY = { _id: MEMORY_ID, title: 'Final Day', slug: 'final-day', coverImage: img('nist-fc/memories/m/cover'), published: true }

function eventDoc(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    title: 'Team Founded',
    year: 2022,
    date: new Date('2022-08-15T00:00:00Z'),
    description: 'Where it began.',
    image: img('nist-fc/timeline/old'),
    category: 'founding',
    memory: null,
    order: 1,
    published: true,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
    ...overrides,
  }
}

/** A chainable, awaitable stand-in for a Mongoose query. */
function query(result) {
  const chain = {
    calls: {},
    sort(value) { chain.calls.sort = value; return chain },
    select(value) { chain.calls.select = value; return chain },
    populate(...args) { chain.calls.populate = args; return chain },
    lean: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

const signedIn = (t) => t.mock.method(Admin, 'findById', async () => ADMIN)

/** Records Cloudinary calls; uploads return deterministic ids. */
function mockCloudinary(t, events = []) {
  let n = 0
  const uploadImage = t.mock.method(cloudinaryService, 'uploadImage', async (buffer, { folder }) => {
    n += 1
    events.push(`upload ${folder}`)
    return img(`${folder}/new-${n}`)
  })
  const deleted = t.mock.method(cloudinaryService, 'deleteImageQuietly', async (publicId) => {
    events.push(`delete ${publicId}`)
  })
  return { uploadImage, deleted, events }
}

function eventForm(fields = {}, { image = false } = {}) {
  const form = new FormData()
  const values = { title: 'Team Founded', year: '2022', category: 'founding', ...fields }
  for (const [key, value] of Object.entries(values)) if (value !== undefined) form.append(key, value)
  if (image) form.append('image', new Blob([PNG], { type: 'image/png' }), 'event.png')
  return form
}

let server
const url = (path) => `${server.baseUrl}${path}`
const json = async (res) => ({ status: res.status, body: await res.json() })
const send = (method, path, body, headers = AUTH) =>
  fetch(url(path), {
    method,
    headers: body instanceof FormData ? headers : { ...headers, 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body),
  })

before(async () => {
  server = await startServer(createApp(testConfig(), { logRequests: false }))
})
after(() => server.close())

// ---- public ---------------------------------------------------------------

describe('GET /api/timeline', () => {
  it('returns every published event in display order, linking only published memories', async (t) => {
    const withPublished = eventDoc({ memory: MEMORY })
    const withDraft = eventDoc({ title: 'Draft link', memory: { ...MEMORY, published: false } })
    const dangling = eventDoc({ title: 'Deleted link', memory: null, image: null, date: null })
    const listQuery = query([withPublished, withDraft, dangling])
    const find = t.mock.method(TimelineEvent, 'find', () => listQuery)

    const { status, body } = await json(await fetch(url('/api/timeline')))

    assert.equal(status, 200)
    assert.deepEqual(find.mock.calls[0].arguments[0], { published: true })
    assert.deepEqual(listQuery.calls.sort, { order: 1, _id: 1 })
    assert.deepEqual(listQuery.calls.populate, ['memory', 'title slug coverImage published'])
    assert.equal(body.message, 'Timeline retrieved successfully')
    assert.equal('pagination' in body, false)
    assert.deepEqual(body.data[0].memory, { title: 'Final Day', slug: 'final-day', coverImage: MEMORY.coverImage })
    assert.equal(body.data[1].memory, null, 'a draft memory is never linked publicly')
    assert.equal(body.data[2].memory, null)
    assert.equal(body.data[2].image, null)
    assert.equal(body.data[0].date, '2022-08-15T00:00:00.000Z')
    assert.deepEqual(Object.keys(body.data[0]).sort(), ['category', 'date', 'description', 'id', 'image', 'memory', 'title', 'year'])
  })

  it('has no public single-event endpoint', async () => {
    const res = await fetch(url(`/api/timeline/${new mongoose.Types.ObjectId()}`))
    assert.equal(res.status, 404)
    assert.equal((await res.json()).message, 'API route not found')
  })
})

// ---- admin reads ----------------------------------------------------------

describe('GET /api/admin/timeline', () => {
  it('requires authentication', async () => {
    assert.equal((await fetch(url('/api/admin/timeline'))).status, 401)
    assert.equal((await fetch(url(`/api/admin/timeline/${new mongoose.Types.ObjectId()}`))).status, 401)
  })

  it('lists drafts too, with the order and the linked memory (drafts flagged)', async (t) => {
    signedIn(t)
    const find = t.mock.method(TimelineEvent, 'find', () =>
      query([eventDoc({ published: false, order: 3, memory: { ...MEMORY, published: false } })]),
    )

    const { status, body } = await json(await fetch(url('/api/admin/timeline?published=false'), { headers: AUTH }))

    assert.equal(status, 200)
    assert.deepEqual(find.mock.calls[0].arguments[0], { published: false })
    assert.equal(body.data[0].order, 3)
    assert.equal(body.data[0].published, false)
    assert.deepEqual(body.data[0].memory, { id: String(MEMORY_ID), title: 'Final Day', slug: 'final-day', published: false })
    assert.ok(body.data[0].updatedAt)

    await fetch(url('/api/admin/timeline'), { headers: AUTH })
    assert.deepEqual(find.mock.calls[1].arguments[0], {})
  })

  it('returns one event by id, or 404', async (t) => {
    signedIn(t)
    const event = eventDoc({ published: false })
    t.mock.method(TimelineEvent, 'findById', (id) => query(String(id) === String(event._id) ? event : null))

    const { status, body } = await json(await fetch(url(`/api/admin/timeline/${event._id}`), { headers: AUTH }))
    assert.equal(status, 200)
    assert.equal(body.data.event.id, String(event._id))

    const missing = await json(await fetch(url(`/api/admin/timeline/${new mongoose.Types.ObjectId()}`), { headers: AUTH }))
    assert.equal(missing.status, 404)
    assert.equal(missing.body.message, 'Timeline event not found')
  })
})

// ---- create ---------------------------------------------------------------

describe('POST /api/timeline', () => {
  const post = (form, headers = AUTH) => send('POST', '/api/timeline', form, headers)

  /** Stubs the order lookup/shift and the insert; returns the recorded calls. */
  function mockCreate(t, { previousOrder = 4, events = [] } = {}) {
    const findOne = t.mock.method(TimelineEvent, 'findOne', () =>
      query(previousOrder === null ? null : { order: previousOrder }),
    )
    const shift = t.mock.method(TimelineEvent, 'updateMany', async (filter, update, options) => {
      events.push('shift')
      return { filter, update, options }
    })
    const create = t.mock.method(TimelineEvent, 'create', async (values) => {
      events.push('create')
      return { _id: new mongoose.Types.ObjectId(), ...values }
    })
    t.mock.method(TimelineEvent, 'findById', (id) => query(eventDoc({ _id: id, published: false })))
    return { findOne, shift, create }
  }

  it('requires authentication and does not upload', async (t) => {
    const { uploadImage } = mockCloudinary(t)
    assert.equal((await post(eventForm({}, { image: true }), {})).status, 401)
    assert.equal(uploadImage.mock.callCount(), 0)
  })

  it('validates fields, the date year and the memory before uploading', async (t) => {
    signedIn(t)
    const { uploadImage } = mockCloudinary(t)
    t.mock.method(Memory, 'exists', async () => null)

    const missing = await json(await post(eventForm({ title: undefined, year: undefined, category: undefined })))
    assert.equal(missing.status, 400)
    assert.deepEqual(Object.keys(missing.body.error).sort(), ['category', 'title', 'year'])

    const wrongYear = await json(await post(eventForm({ date: '2023-01-05' }, { image: true })))
    assert.equal(wrongYear.status, 400)
    assert.deepEqual(wrongYear.body.error, { date: 'Date must be in the selected year' })

    const unknownMemory = await json(await post(eventForm({ memory: String(MEMORY_ID) }, { image: true })))
    assert.equal(unknownMemory.status, 400)
    assert.deepEqual(unknownMemory.body.error, { memory: 'The selected memory does not exist' })

    assert.equal(uploadImage.mock.callCount(), 0)
  })

  it('uploads the image to nist-fc/timeline and places the event chronologically as a draft', async (t) => {
    signedIn(t)
    const events = []
    const { uploadImage } = mockCloudinary(t, events)
    t.mock.method(Memory, 'exists', async () => ({ _id: MEMORY_ID }))
    const { findOne, shift, create } = mockCreate(t, { previousOrder: 4, events })

    const { status, body } = await json(
      await post(eventForm({ date: '2022-08-15', memory: String(MEMORY_ID), description: 'Hi' }, { image: true })),
    )

    assert.equal(status, 201)
    assert.equal(body.message, 'Timeline event created successfully')
    assert.equal(uploadImage.mock.calls[0].arguments[1].folder, 'nist-fc/timeline')
    assert.deepEqual(events, ['upload nist-fc/timeline', 'shift', 'create'])

    // The previous event is the last one earlier in time: an earlier year, an
    // undated event of the same year, or an earlier or equal date.
    const filter = findOne.mock.calls[0].arguments[0]
    const date = new Date('2022-08-15T00:00:00Z')
    // Server-built operators must survive sanitizeFilter (not wrapped in $eq).
    const earlier = mongoose.sanitizeFilter(filter).$or
    assert.equal(earlier.length, 3)
    assert.equal(earlier[0].year.$lt, 2022)
    assert.equal(earlier[0].year.$eq, undefined)
    assert.deepEqual({ ...earlier[1] }, { year: 2022, date: null })
    assert.equal(earlier[2].year, 2022)
    assert.equal(earlier[2].date.$lte.toISOString(), date.toISOString())
    assert.equal(earlier[2].date.$eq, undefined)
    // Later events move down; that is not a content edit.
    const [shiftFilter, shiftUpdate, shiftOptions] = shift.mock.calls[0].arguments
    assert.equal(mongoose.sanitizeFilter(shiftFilter).order.$gte, 5)
    assert.deepEqual(shiftUpdate, { $inc: { order: 1 } })
    assert.deepEqual(shiftOptions, { timestamps: false })

    const saved = create.mock.calls[0].arguments[0]
    assert.equal(saved.order, 5)
    assert.equal(saved.published, false)
    assert.equal(saved.year, 2022)
    assert.equal(saved.memory, String(MEMORY_ID))
    assert.deepEqual(saved.image, img('nist-fc/timeline/new-1'))
  })

  it('puts an undated first event at position 1 without an image', async (t) => {
    signedIn(t)
    const { uploadImage } = mockCloudinary(t)
    const { findOne, shift, create } = mockCreate(t, { previousOrder: null })

    const { status } = await json(await post(eventForm({ date: '', memory: '' })))

    assert.equal(status, 201)
    assert.equal(uploadImage.mock.callCount(), 0)
    assert.equal(findOne.mock.calls[0].arguments[0].$or.length, 2, 'no date clause without a date')
    assert.equal(mongoose.sanitizeFilter(shift.mock.calls[0].arguments[0]).order.$gte, 1)
    const saved = create.mock.calls[0].arguments[0]
    assert.equal(saved.order, 1)
    assert.equal(saved.date, null)
    assert.equal(saved.memory, null)
    assert.equal(saved.image, null)
  })

  it('deletes the uploaded image if saving fails', async (t) => {
    signedIn(t)
    const { deleted } = mockCloudinary(t)
    t.mock.method(console, 'error', () => {})
    mockCreate(t)
    t.mock.method(TimelineEvent, 'create', async () => {
      throw new Error('database unavailable')
    })

    assert.equal((await post(eventForm({}, { image: true }))).status, 500)
    assert.deepEqual(deleted.mock.calls.map((c) => c.arguments[0]), ['nist-fc/timeline/new-1'])
  })

  it('rejects non-image uploads', async (t) => {
    signedIn(t)
    const { uploadImage } = mockCloudinary(t)
    const form = eventForm()
    form.append('image', new Blob(['GIF89a'], { type: 'image/gif' }), 'x.gif')
    const { status, body } = await json(await post(form))
    assert.equal(status, 400)
    assert.deepEqual(body.error, { image: 'Photo must be a JPEG, PNG or WEBP image' })
    assert.equal(uploadImage.mock.callCount(), 0)
  })
})

// ---- update ---------------------------------------------------------------

describe('PATCH /api/timeline/:id', () => {
  /** findById → the editable document first, then the populated result. */
  function mockEditable(t, overrides = {}) {
    const doc = new TimelineEvent(eventDoc(overrides))
    doc.isNew = false
    const save = t.mock.method(doc, 'save', async () => doc)
    let calls = 0
    t.mock.method(TimelineEvent, 'findById', () => {
      calls += 1
      return calls === 1 ? query(doc) : query(doc.toObject())
    })
    return { doc, save }
  }
  const patch = (id, body, headers) => send('PATCH', `/api/timeline/${id}`, body, headers)

  it('requires authentication and returns 404 for unknown events', async (t) => {
    assert.equal((await patch(new mongoose.Types.ObjectId(), { title: 'X' }, {})).status, 401)
    signedIn(t)
    t.mock.method(TimelineEvent, 'findById', () => query(null))
    assert.equal((await patch(new mongoose.Types.ObjectId(), { title: 'X' })).status, 404)
  })

  it('changes only the supplied fields and never the order', async (t) => {
    signedIn(t)
    const { events } = mockCloudinary(t)
    const { doc, save } = mockEditable(t, { order: 7, memory: MEMORY_ID, date: null })

    const { status, body } = await json(await patch(doc._id, { year: 2023, memory: '', published: false }))

    assert.equal(status, 200)
    assert.equal(body.message, 'Timeline event updated successfully')
    assert.equal(save.mock.callCount(), 1)
    assert.equal(doc.year, 2023)
    assert.equal(doc.memory, null)
    assert.equal(doc.published, false)
    assert.equal(doc.order, 7)
    assert.equal(doc.title, 'Team Founded')
    assert.deepEqual(events, [])
  })

  it('checks a new date against the stored year', async (t) => {
    signedIn(t)
    const { doc, save } = mockEditable(t)
    const { status, body } = await json(await patch(doc._id, { date: '2024-01-01' }))
    assert.equal(status, 400)
    assert.deepEqual(body.error, { date: 'Date must be in the selected year' })
    assert.equal(save.mock.callCount(), 0)
  })

  it('rejects linking a memory that does not exist', async (t) => {
    signedIn(t)
    t.mock.method(Memory, 'exists', async () => null)
    const { doc, save } = mockEditable(t)
    assert.equal((await patch(doc._id, { memory: String(MEMORY_ID) })).status, 400)
    assert.equal(save.mock.callCount(), 0)
  })

  it('replaces the image: the old one is deleted only after saving', async (t) => {
    signedIn(t)
    const events = []
    mockCloudinary(t, events)
    const { doc, save } = mockEditable(t)
    save.mock.mockImplementation(async () => {
      events.push('save')
      return doc
    })

    const form = new FormData()
    form.append('image', new Blob([PNG], { type: 'image/png' }), 'new.png')
    const { status } = await json(await patch(doc._id, form))

    assert.equal(status, 200)
    assert.deepEqual(events, ['upload nist-fc/timeline', 'save', 'delete nist-fc/timeline/old'])
    assert.deepEqual(doc.image.toObject(), img('nist-fc/timeline/new-1'))
  })

  it('removes the image after saving', async (t) => {
    signedIn(t)
    const events = []
    mockCloudinary(t, events)
    const { doc, save } = mockEditable(t)
    save.mock.mockImplementation(async () => {
      events.push('save')
      return doc
    })

    assert.equal((await patch(doc._id, { removeImage: true })).status, 200)
    assert.equal(doc.image, null)
    assert.deepEqual(events, ['save', 'delete nist-fc/timeline/old'])
  })

  it('rejects replacing and removing the image at once', async (t) => {
    signedIn(t)
    const { uploadImage } = mockCloudinary(t)
    const { doc } = mockEditable(t)
    const form = new FormData()
    form.append('removeImage', 'true')
    form.append('image', new Blob([PNG], { type: 'image/png' }), 'new.png')
    const { status, body } = await json(await patch(doc._id, form))
    assert.equal(status, 400)
    assert.ok(body.error.image)
    assert.equal(uploadImage.mock.callCount(), 0)
  })

  it('returns 409 for a stale edit before uploading anything', async (t) => {
    signedIn(t)
    const { uploadImage } = mockCloudinary(t)
    const { doc, save } = mockEditable(t)
    const form = new FormData()
    form.append('title', 'New')
    form.append('expectedUpdatedAt', '2025-01-01T00:00:00.000Z')
    form.append('image', new Blob([PNG], { type: 'image/png' }), 'new.png')

    const { status, body } = await json(await patch(doc._id, form))

    assert.equal(status, 409)
    assert.equal(body.message, 'This timeline event was changed by someone else. Reload and try again.')
    assert.equal(uploadImage.mock.callCount(), 0)
    assert.equal(save.mock.callCount(), 0)
  })

  it('accepts a matching expectedUpdatedAt', async (t) => {
    signedIn(t)
    const { doc, save } = mockEditable(t)
    const res = await patch(doc._id, { title: 'New', expectedUpdatedAt: '2026-01-01T10:00:00.000Z' })
    assert.equal(res.status, 200)
    assert.equal(save.mock.callCount(), 1)
  })

  it('returns 409 and deletes the new upload when a concurrent save wins', async (t) => {
    signedIn(t)
    const { deleted } = mockCloudinary(t)
    const { doc, save } = mockEditable(t)
    save.mock.mockImplementation(async () => {
      throw new mongoose.Error.VersionError(doc, 0, [])
    })
    const form = new FormData()
    form.append('image', new Blob([PNG], { type: 'image/png' }), 'new.png')

    const { status } = await json(await patch(doc._id, form))

    assert.equal(status, 409)
    assert.deepEqual(deleted.mock.calls.map((c) => c.arguments[0]), ['nist-fc/timeline/new-1'], 'old image kept')
  })

  it('rejects an empty update', async (t) => {
    signedIn(t)
    mockEditable(t)
    const { status, body } = await json(await patch(new mongoose.Types.ObjectId(), { expectedUpdatedAt: '2026-01-01T10:00:00.000Z' }))
    assert.equal(status, 400)
    assert.deepEqual(body.error, { body: 'Provide at least one field or an image to update' })
  })
})

// ---- reorder --------------------------------------------------------------

describe('PATCH /api/timeline/reorder', () => {
  const ids = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
  const reorder = (items, headers) => send('PATCH', '/api/timeline/reorder', { items }, headers)
  const mockCurrent = (t, current = ids) =>
    t.mock.method(TimelineEvent, 'find', () => query(current.map((_id) => ({ _id }))))

  it('requires authentication', async () => {
    assert.equal((await reorder([{ id: String(ids[0]), order: 1 }], {})).status, 401)
  })

  it('saves the complete order in one bulkWrite without touching updatedAt', async (t) => {
    signedIn(t)
    mockCurrent(t)
    const findById = t.mock.method(TimelineEvent, 'findById', () => query(null))
    const bulkWrite = t.mock.method(TimelineEvent, 'bulkWrite', async () => ({}))
    const items = [
      { id: String(ids[2]), order: 1 },
      { id: String(ids[0]), order: 2 },
      { id: String(ids[1]), order: 3 },
    ]

    const { status, body } = await json(await reorder(items))

    assert.equal(status, 200)
    assert.deepEqual(body, { success: true, data: null, message: 'Timeline reordered successfully' })
    assert.equal(findById.mock.callCount(), 0, '"reorder" is not treated as an event id')
    assert.equal(bulkWrite.mock.callCount(), 1)
    const [operations, options] = bulkWrite.mock.calls[0].arguments
    assert.deepEqual(options, { ordered: true })
    assert.deepEqual(operations, items.map(({ id, order }) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order } }, timestamps: false },
    })))
  })

  it('rejects orders that are not exactly 1..N', async (t) => {
    signedIn(t)
    const bulkWrite = t.mock.method(TimelineEvent, 'bulkWrite', async () => ({}))
    const { status, body } = await json(await reorder([
      { id: String(ids[0]), order: 1 },
      { id: String(ids[1]), order: 3 },
    ]))
    assert.equal(status, 400)
    assert.deepEqual(body.error, { items: 'Orders must run from 1 to 2 without gaps' })

    const duplicate = await json(await reorder([
      { id: String(ids[0]), order: 1 },
      { id: String(ids[0]), order: 2 },
    ]))
    assert.equal(duplicate.status, 400)
    assert.equal(bulkWrite.mock.callCount(), 0)
  })

  it('returns 409 when events were added or deleted since the list was loaded', async (t) => {
    signedIn(t)
    const bulkWrite = t.mock.method(TimelineEvent, 'bulkWrite', async () => ({}))

    mockCurrent(t)
    const missing = await json(await reorder([
      { id: String(ids[0]), order: 1 },
      { id: String(ids[1]), order: 2 },
    ]))
    assert.equal(missing.status, 409)
    assert.equal(missing.body.message, 'The timeline was changed by someone else. Reload and try again.')

    const unknown = await json(await reorder([
      { id: String(ids[0]), order: 1 },
      { id: String(ids[1]), order: 2 },
      { id: String(new mongoose.Types.ObjectId()), order: 3 },
    ]))
    assert.equal(unknown.status, 409)
    assert.equal(bulkWrite.mock.callCount(), 0)
  })
})

// ---- delete ---------------------------------------------------------------

describe('DELETE /api/timeline/:id', () => {
  const del = (id, headers = AUTH) => fetch(url(`/api/timeline/${id}`), { method: 'DELETE', headers })

  it('requires authentication and returns 404 for unknown events', async (t) => {
    assert.equal((await del(new mongoose.Types.ObjectId(), {})).status, 401)
    signedIn(t)
    t.mock.method(TimelineEvent, 'findById', () => query(null))
    assert.equal((await del(new mongoose.Types.ObjectId())).status, 404)
  })

  it('deletes the event, then its image, and never the linked memory', async (t) => {
    signedIn(t)
    const events = []
    mockCloudinary(t, events)
    const event = eventDoc({ memory: MEMORY_ID })
    t.mock.method(TimelineEvent, 'findById', () => query(event))
    t.mock.method(TimelineEvent, 'deleteOne', async (filter) => {
      events.push(`delete event ${filter._id}`)
    })
    const memoryDelete = t.mock.method(Memory, 'deleteOne', async () => {})

    const { status, body } = await json(await del(event._id))

    assert.equal(status, 200)
    assert.deepEqual(body, { success: true, data: null, message: 'Timeline event deleted successfully' })
    assert.deepEqual(events, [`delete event ${event._id}`, 'delete nist-fc/timeline/old'])
    assert.equal(memoryDelete.mock.callCount(), 0)
  })

  it('skips image cleanup when the event has no image', async (t) => {
    signedIn(t)
    const { deleted } = mockCloudinary(t)
    t.mock.method(TimelineEvent, 'findById', () => query(eventDoc({ image: null })))
    t.mock.method(TimelineEvent, 'deleteOne', async () => {})
    assert.equal((await del(new mongoose.Types.ObjectId())).status, 200)
    assert.equal(deleted.mock.callCount(), 0)
  })
})
