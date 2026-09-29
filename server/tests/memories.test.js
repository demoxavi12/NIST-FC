import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import Admin from '../src/models/Admin.js'
import Memory from '../src/models/Memory.js'
import Player from '../src/models/Player.js'
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
const PLAYER_A = { _id: new mongoose.Types.ObjectId(), name: 'Zed Player', slug: 'zed-player', photo: img('pz'), position: 'Forward', status: 'former' }
const PLAYER_B = { _id: new mongoose.Types.ObjectId(), name: 'Amal Player', slug: 'amal-player', photo: img('pa'), position: 'Defender', status: 'current' }

function memoryDoc(overrides = {}) {
  const _id = overrides._id ?? new mongoose.Types.ObjectId()
  return {
    _id,
    title: 'Test Memory',
    slug: 'test-memory',
    description: 'First line.\nSecond line.',
    date: new Date('2025-12-12T00:00:00Z'),
    location: 'NIST University',
    coverImage: img(`nist-fc/memories/${_id}/cover`),
    photos: [img(`nist-fc/memories/${_id}/p1`), img(`nist-fc/memories/${_id}/p2`)],
    players: [PLAYER_A, PLAYER_B],
    tags: ['final'],
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
    skip(value) { chain.calls.skip = value; return chain },
    limit(value) { chain.calls.limit = value; return chain },
    select(value) { chain.calls.select = value; return chain },
    populate(...args) { chain.calls.populate = args; return chain },
    lean: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

const signedIn = (t) => t.mock.method(Admin, 'findById', async () => ADMIN)

function memoryForm(fields = {}, { cover = true, photos = 0 } = {}) {
  const form = new FormData()
  const values = { title: 'Test Memory', date: '2025-12-12', ...fields }
  for (const [key, value] of Object.entries(values)) if (value !== undefined) form.append(key, value)
  if (cover) form.append('coverImage', new Blob([PNG], { type: 'image/png' }), 'cover.png')
  for (let i = 0; i < photos; i += 1) form.append('photos', new Blob([PNG], { type: 'image/png' }), `p${i}.png`)
  return form
}

/** Records Cloudinary calls; uploads return deterministic ids. */
function mockCloudinary(t, events = []) {
  let n = 0
  const uploadImage = t.mock.method(cloudinaryService, 'uploadImage', async (buffer, { folder }) => {
    n += 1
    events.push(`upload ${folder.split('/').slice(0, 2).join('/')}/…`)
    return img(`${folder}/new-${n}`)
  })
  const uploadImages = t.mock.method(cloudinaryService, 'uploadImages', async (buffers, { folder }) => {
    events.push(`upload ${buffers.length} photos`)
    return buffers.map(() => {
      n += 1
      return img(`${folder}/new-${n}`)
    })
  })
  const deleted = t.mock.method(cloudinaryService, 'deleteImageQuietly', async (publicId) => {
    events.push(`delete ${publicId}`)
  })
  const folderDeleted = t.mock.method(cloudinaryService, 'deleteFolderQuietly', async (folder) => {
    events.push(`delete folder ${folder}`)
  })
  return { uploadImage, uploadImages, deleted, folderDeleted, events }
}

let server
const url = (path) => `${server.baseUrl}${path}`
const json = async (res) => ({ status: res.status, body: await res.json() })

before(async () => {
  server = await startServer(
    createApp(testConfig({ MAX_MEMORY_IMAGES: '3' }), { logRequests: false }),
  )
})
after(() => server.close())

// ---- public reads ---------------------------------------------------------

describe('GET /api/memories', () => {
  it('returns published memories newest first as slim summaries', async (t) => {
    const listQuery = query([memoryDoc()])
    const find = t.mock.method(Memory, 'find', () => listQuery)
    t.mock.method(Memory, 'countDocuments', async () => 13)

    const { status, body } = await json(await fetch(url('/api/memories')))

    assert.equal(status, 200)
    assert.deepEqual(find.mock.calls[0].arguments[0], { published: true })
    assert.deepEqual(listQuery.calls, { sort: { date: -1, _id: -1 }, skip: 0, limit: 12, select: '-players' })
    assert.deepEqual(body.pagination, { page: 1, limit: 12, total: 13, pages: 2 })
    assert.deepEqual(Object.keys(body.data[0]).sort(), [
      'coverImage', 'date', 'excerpt', 'id', 'location', 'photoCount', 'slug', 'title',
    ])
    assert.equal(body.data[0].excerpt, 'First line. Second line.')
    assert.equal(body.data[0].photoCount, 2)
    assert.equal(body.data[0].date, '2025-12-12T00:00:00.000Z')
  })

  it('filters by tag and player', async (t) => {
    const find = t.mock.method(Memory, 'find', () => query([]))
    t.mock.method(Memory, 'countDocuments', async () => 0)
    const playerId = String(PLAYER_A._id)

    await fetch(url(`/api/memories?tag=Final&player=${playerId}&page=2`))

    assert.deepEqual(find.mock.calls[0].arguments[0], { published: true, tags: 'final', players: playerId })
  })

  it('rejects invalid queries', async () => {
    const { status, body } = await json(await fetch(url('/api/memories?limit=49&player=nope')))
    assert.equal(status, 400)
    assert.deepEqual(Object.keys(body.error).sort(), ['limit', 'player'])
  })
})

describe('GET /api/memories/:slug', () => {
  function mockDetail(t, memory, older = null, newer = null) {
    const calls = []
    t.mock.method(Memory, 'findOne', (filter) => {
      calls.push(filter)
      const chain = query([memory, older, newer][calls.length - 1])
      calls[calls.length - 1] = { filter, chain }
      return chain
    })
    return calls
  }

  it('returns the published memory with players, previous (older) and next (newer)', async (t) => {
    const memory = memoryDoc()
    const older = memoryDoc({ title: 'Older', slug: 'older', date: new Date('2025-10-01T00:00:00Z') })
    const newer = memoryDoc({ title: 'Newer', slug: 'newer', date: new Date('2026-02-01T00:00:00Z') })
    const calls = mockDetail(t, memory, older, newer)

    const { status, body } = await json(await fetch(url('/api/memories/Test-Memory')))

    assert.equal(status, 200)
    assert.deepEqual(calls[0].filter, { slug: 'test-memory', published: true })
    assert.deepEqual(calls[0].chain.calls.populate, ['players', 'name slug photo position status'])
    const { memory: m, previous, next } = body.data
    assert.deepEqual(m.players.map((p) => p.name), ['Amal Player', 'Zed Player'], 'sorted by name')
    assert.deepEqual(Object.keys(m.players[0]).sort(), ['id', 'name', 'photo', 'position', 'slug', 'status'])
    assert.equal(m.photos.length, 2)
    assert.deepEqual(m.tags, ['final'])
    assert.deepEqual(previous, { title: 'Older', slug: 'older', date: '2025-10-01T00:00:00.000Z', coverImage: older.coverImage })
    assert.equal(next.slug, 'newer')
  })

  it('finds neighbours with published-only, tie-safe, sanitizeFilter-trusted queries', async (t) => {
    const memory = memoryDoc()
    const calls = mockDetail(t, memory, null, null)

    const { body } = await json(await fetch(url('/api/memories/test-memory')))

    assert.equal(body.data.previous, null)
    assert.equal(body.data.next, null)
    const [, olderQuery, newerQuery] = calls
    assert.deepEqual(olderQuery.chain.calls.sort, { date: -1, _id: -1 })
    assert.deepEqual(newerQuery.chain.calls.sort, { date: 1, _id: 1 })

    // Mongoose applies sanitizeFilter to every filter; the server-built
    // operators must survive it rather than being wrapped in $eq.
    const older = mongoose.sanitizeFilter(olderQuery.filter)
    assert.equal(older.published, true)
    assert.equal(older.$or[0].date.$lt.toISOString(), memory.date.toISOString())
    assert.equal(older.$or[1].date.toISOString(), memory.date.toISOString())
    assert.equal(String(older.$or[1]._id.$lt), String(memory._id))
    const newer = mongoose.sanitizeFilter(newerQuery.filter)
    assert.ok(newer.$or[0].date.$gt && newer.$or[1]._id.$gt)
    assert.equal(newer.$or[0].date.$eq, undefined)
  })

  it('treats drafts and unknown slugs as not found', async (t) => {
    t.mock.method(Memory, 'findOne', () => query(null))
    const { status, body } = await json(await fetch(url('/api/memories/draft-memory')))
    assert.equal(status, 404)
    assert.deepEqual(body, { success: false, message: 'Memory not found', error: null })
  })
})

// ---- admin reads ------------------------------------------------------------

describe('GET /api/admin/memories', () => {
  it('requires authentication', async () => {
    assert.equal((await fetch(url('/api/admin/memories'))).status, 401)
  })

  it('includes drafts, filters by published and searches titles', async (t) => {
    signedIn(t)
    const listQuery = query([memoryDoc({ published: false })])
    const find = t.mock.method(Memory, 'find', () => listQuery)
    t.mock.method(Memory, 'countDocuments', async () => 1)

    const { body } = await json(await fetch(url('/api/admin/memories'), { headers: AUTH }))
    assert.deepEqual(find.mock.calls[0].arguments[0], {})
    assert.equal(listQuery.calls.limit, 20)
    assert.equal(body.data[0].published, false)
    assert.ok(body.data[0].updatedAt)

    await fetch(url('/api/admin/memories?published=false&search=cup.(final'), { headers: AUTH })
    const filter = mongoose.sanitizeFilter(find.mock.calls[1].arguments[0])
    assert.equal(filter.published, false)
    assert.equal(filter.title.$regex, 'cup\\.\\(final')
    assert.equal(filter.title.$eq, undefined, 'the $regex must be trusted for sanitizeFilter')
  })

  it('returns one memory by id (drafts included); 400 for a bad id', async (t) => {
    signedIn(t)
    const memory = memoryDoc({ published: false })
    t.mock.method(Memory, 'findById', () => query(memory))
    const ok = await json(await fetch(url(`/api/admin/memories/${memory._id}`), { headers: AUTH }))
    assert.equal(ok.body.data.memory.published, false)

    assert.equal((await fetch(url('/api/admin/memories/nope'), { headers: AUTH })).status, 400)
  })
})

// ---- create ---------------------------------------------------------------

describe('POST /api/memories', () => {
  const post = (form, headers = AUTH) => fetch(url('/api/memories'), { method: 'POST', headers, body: form })

  it('rejects unauthenticated requests before reading uploads', async (t) => {
    const { uploadImage } = mockCloudinary(t)
    assert.equal((await post(memoryForm(), {})).status, 401)
    assert.equal(uploadImage.mock.callCount(), 0)
  })

  it('requires a cover image and valid fields, uploading nothing', async (t) => {
    signedIn(t)
    const { uploadImage } = mockCloudinary(t)

    const noCover = await json(await post(memoryForm({}, { cover: false })))
    assert.deepEqual(noCover.body.error, { coverImage: 'Cover image is required' })

    const invalid = await json(await post(memoryForm({ title: '', date: '2025-02-30', players: '[bad' })))
    assert.equal(invalid.status, 400)
    assert.deepEqual(Object.keys(invalid.body.error).sort(), ['date', 'players', 'title'])
    assert.equal(uploadImage.mock.callCount(), 0)
  })

  it('rejects unknown players before uploading', async (t) => {
    signedIn(t)
    const { uploadImage } = mockCloudinary(t)
    t.mock.method(Player, 'countDocuments', async () => 1)

    const players = JSON.stringify([String(PLAYER_A._id), String(PLAYER_B._id)])
    const { status, body } = await json(await post(memoryForm({ players })))

    assert.equal(status, 400)
    assert.deepEqual(body.error, { players: 'One or more selected players do not exist' })
    assert.equal(uploadImage.mock.callCount(), 0)
  })

  it('rejects more photos than MAX_MEMORY_IMAGES in one request (413)', async (t) => {
    signedIn(t)
    mockCloudinary(t)
    const { status, body } = await json(await post(memoryForm({}, { photos: 4 })))
    assert.equal(status, 413)
    assert.equal(body.message, 'At most 3 photos can be uploaded at a time')
  })

  it("uploads into the memory's own folder and saves a draft", async (t) => {
    signedIn(t)
    const { uploadImage, uploadImages } = mockCloudinary(t)
    t.mock.method(Player, 'countDocuments', async () => 2)
    t.mock.method(Memory, 'find', () => query([{ slug: 'test-memory' }]))
    const create = t.mock.method(Memory, 'create', async () => {})
    t.mock.method(Memory, 'findById', (id) => query(memoryDoc({ _id: id, published: false })))

    const players = JSON.stringify([String(PLAYER_A._id), String(PLAYER_B._id), String(PLAYER_A._id)])
    const { status, body } = await json(
      await post(memoryForm({ players, tags: JSON.stringify(['Final', 'final', ' Cup ']) }, { photos: 2 })),
    )

    assert.equal(status, 201)
    assert.equal(body.message, 'Memory created successfully')
    const saved = create.mock.calls[0].arguments[0]
    const folder = `nist-fc/memories/${saved._id}`
    assert.equal(uploadImage.mock.calls[0].arguments[1].folder, folder)
    assert.equal(uploadImages.mock.calls[0].arguments[0].length, 2)
    assert.equal(uploadImages.mock.calls[0].arguments[1].folder, folder)
    assert.equal(saved.slug, 'test-memory-2')
    assert.equal(saved.published, false)
    assert.equal(saved.date.toISOString(), '2025-12-12T00:00:00.000Z')
    assert.deepEqual(saved.players, [String(PLAYER_A._id), String(PLAYER_B._id)])
    assert.deepEqual(saved.tags, ['final', 'cup'])
    assert.equal(saved.coverImage.publicId, `${folder}/new-1`)
    assert.deepEqual(saved.photos.map((p) => p.publicId), [`${folder}/new-2`, `${folder}/new-3`])
  })

  it('deletes the cover and the folder if a gallery upload fails', async (t) => {
    signedIn(t)
    const { deleted, uploadImages, events } = mockCloudinary(t)
    uploadImages.mock.mockImplementation(async () => {
      const { default: ApiError } = await import('../src/utils/ApiError.js')
      throw new ApiError(502, 'Image upload failed')
    })
    const create = t.mock.method(Memory, 'create', async () => {})

    const { status } = await json(await post(memoryForm({}, { photos: 2 })))

    assert.equal(status, 502)
    assert.equal(create.mock.callCount(), 0)
    assert.equal(deleted.mock.callCount(), 1)
    assert.match(deleted.mock.calls[0].arguments[0], /\/new-1$/)
    // The folder goes after its images.
    assert.match(events.at(-1), /^delete folder nist-fc\/memories\/[a-f\d]{24}$/)
  })

  it('deletes every uploaded image and the folder if saving fails', async (t) => {
    signedIn(t)
    const { deleted, folderDeleted, events } = mockCloudinary(t)
    t.mock.method(console, 'error', () => {})
    t.mock.method(Memory, 'find', () => query([]))
    t.mock.method(Memory, 'create', async () => {
      throw new Error('database unavailable')
    })

    assert.equal((await post(memoryForm({}, { photos: 2 }))).status, 500)
    assert.deepEqual(deleted.mock.calls.map((c) => c.arguments[0].split('/').pop()).sort(), ['new-1', 'new-2', 'new-3'])
    const folder = folderDeleted.mock.calls[0].arguments[0]
    assert.equal(folderDeleted.mock.callCount(), 1)
    assert.equal(deleted.mock.calls[0].arguments[0].startsWith(`${folder}/`), true)
    assert.equal(events.at(-1), `delete folder ${folder}`)
  })
})

// ---- update ---------------------------------------------------------------

describe('PATCH /api/memories/:id', () => {
  /** findById → the editable document first, then the populated result. */
  function mockEditable(t, overrides = {}) {
    const doc = new Memory(memoryDoc({ players: [PLAYER_A._id], ...overrides }))
    doc.isNew = false
    const save = t.mock.method(doc, 'save', async () => doc)
    let calls = 0
    t.mock.method(Memory, 'findById', () => {
      calls += 1
      return calls === 1 ? query(doc) : query(memoryDoc({ ...doc.toObject(), players: [PLAYER_A] }))
    })
    return { doc, save }
  }

  const patchJson = (id, body, headers = AUTH) =>
    fetch(url(`/api/memories/${id}`), {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  const patchForm = (id, form) => fetch(url(`/api/memories/${id}`), { method: 'PATCH', headers: AUTH, body: form })

  it('requires authentication and returns 404 without uploading', async (t) => {
    assert.equal((await patchJson(new mongoose.Types.ObjectId(), { published: true }, {})).status, 401)
    signedIn(t)
    const { uploadImages } = mockCloudinary(t)
    t.mock.method(Memory, 'findById', () => query(null))
    const form = memoryForm({ title: undefined, date: undefined }, { cover: false, photos: 1 })
    assert.equal((await patchForm(new mongoose.Types.ObjectId(), form)).status, 404)
    assert.equal(uploadImages.mock.callCount(), 0)
  })

  it('publishes with a JSON update and no image changes', async (t) => {
    signedIn(t)
    const { events } = mockCloudinary(t)
    const { doc, save } = mockEditable(t, { published: false })

    const { status, body } = await json(await patchJson(doc._id, { published: true }))

    assert.equal(status, 200)
    assert.equal(save.mock.callCount(), 1)
    assert.equal(doc.published, true)
    assert.equal(body.data.memory.slug, 'test-memory')
    assert.deepEqual(events.filter((e) => e !== 'upload 0 photos'), [])
  })

  it('keeps the slug when the title changes', async (t) => {
    signedIn(t)
    mockCloudinary(t)
    const { doc } = mockEditable(t)
    await patchJson(doc._id, { title: 'Renamed Memory' })
    assert.equal(doc.slug, 'test-memory')
    assert.equal(doc.title, 'Renamed Memory')
  })

  it('appends photos, removes photos and replaces the cover; old images deleted only after saving', async (t) => {
    signedIn(t)
    const events = []
    mockCloudinary(t, events)
    const { doc, save } = mockEditable(t)
    save.mock.mockImplementation(async () => {
      events.push('save')
      return doc
    })
    const folder = `nist-fc/memories/${doc._id}`
    const form = memoryForm(
      { title: undefined, date: undefined, removePhotos: JSON.stringify([`${folder}/p1`]) },
      { cover: true, photos: 2 },
    )

    const { status } = await json(await patchForm(doc._id, form))

    assert.equal(status, 200)
    assert.deepEqual(events, [
      'upload nist-fc/memories/…',
      'upload 2 photos',
      'save',
      `delete ${folder}/cover`,
      `delete ${folder}/p1`,
    ])
    assert.equal(doc.coverImage.publicId, `${folder}/new-1`)
    assert.deepEqual(doc.photos.map((p) => p.publicId), [`${folder}/p2`, `${folder}/new-2`, `${folder}/new-3`])
  })

  it('rejects removing photos that are not in this memory', async (t) => {
    signedIn(t)
    const { uploadImages } = mockCloudinary(t)
    const { doc } = mockEditable(t)
    const { status, body } = await json(await patchJson(doc._id, { removePhotos: ['elsewhere/p9'] }))
    assert.equal(status, 400)
    assert.deepEqual(body.error, { removePhotos: 'Some photos to remove do not belong to this memory' })
    assert.equal(uploadImages.mock.callCount(), 0)
  })

  it('enforces the 100-photo gallery limit before uploading', async (t) => {
    signedIn(t)
    const { uploadImages } = mockCloudinary(t)
    const photos = Array.from({ length: 99 }, (_, i) => img(`p${i}`))
    const { doc } = mockEditable(t, { photos })
    const form = memoryForm({ title: undefined, date: undefined }, { cover: false, photos: 2 })

    const { status, body } = await json(await patchForm(doc._id, form))

    assert.equal(status, 400)
    assert.deepEqual(body.error, { photos: 'A memory can have at most 100 photos' })
    assert.equal(uploadImages.mock.callCount(), 0)
  })

  it('returns 409 for a stale form without uploading', async (t) => {
    signedIn(t)
    const { uploadImages } = mockCloudinary(t)
    const { doc, save } = mockEditable(t)
    const form = memoryForm(
      { title: 'Changed', date: undefined, expectedUpdatedAt: '2025-12-31T00:00:00.000Z' },
      { cover: false, photos: 1 },
    )

    const { status, body } = await json(await patchForm(doc._id, form))

    assert.equal(status, 409)
    assert.equal(body.message, 'This memory was changed by someone else. Reload and try again.')
    assert.equal(uploadImages.mock.callCount(), 0)
    assert.equal(save.mock.callCount(), 0)
  })

  it('returns 409 and deletes the new uploads when a concurrent save wins', async (t) => {
    signedIn(t)
    const { deleted } = mockCloudinary(t)
    const { doc, save } = mockEditable(t)
    save.mock.mockImplementation(async () => {
      throw new mongoose.Error.VersionError(doc, 1, ['photos'])
    })
    const form = memoryForm(
      { title: undefined, date: undefined, expectedUpdatedAt: doc.updatedAt.toISOString() },
      { cover: false, photos: 2 },
    )

    const { status } = await json(await patchForm(doc._id, form))

    assert.equal(status, 409)
    assert.deepEqual(deleted.mock.calls.map((c) => c.arguments[0].split('/').pop()).sort(), ['new-1', 'new-2'])
  })

  it('rejects an update with nothing to change', async (t) => {
    signedIn(t)
    const { status, body } = await json(await patchJson(new mongoose.Types.ObjectId(), { expectedUpdatedAt: '2026-01-01T10:00:00.000Z' }))
    assert.equal(status, 400)
    assert.deepEqual(body.error, { body: 'Provide at least one field, photo or cover image to update' })
  })
})

// ---- delete ---------------------------------------------------------------

describe('DELETE /api/memories/:id', () => {
  const del = (id, headers = AUTH) => fetch(url(`/api/memories/${id}`), { method: 'DELETE', headers })

  it('requires authentication and returns 404 for unknown memories', async (t) => {
    assert.equal((await del(new mongoose.Types.ObjectId(), {})).status, 401)
    signedIn(t)
    t.mock.method(Memory, 'findById', () => query(null))
    assert.equal((await del(new mongoose.Types.ObjectId())).status, 404)
  })

  it('deletes the memory, then its cover, every photo and its folder', async (t) => {
    signedIn(t)
    const events = []
    mockCloudinary(t, events)
    const memory = memoryDoc()
    t.mock.method(Memory, 'findById', () => query(memory))
    t.mock.method(Memory, 'deleteOne', async (filter) => {
      events.push(`delete memory ${filter._id}`)
      return { deletedCount: 1 }
    })
    const playerDelete = t.mock.method(Player, 'deleteOne', async () => {})

    const { status, body } = await json(await del(memory._id))

    assert.equal(status, 200)
    assert.deepEqual(body, { success: true, data: null, message: 'Memory deleted successfully' })
    const folder = `nist-fc/memories/${memory._id}`
    assert.deepEqual(events, [
      `delete memory ${memory._id}`,
      `delete ${folder}/cover`,
      `delete ${folder}/p1`,
      `delete ${folder}/p2`,
      `delete folder ${folder}`,
    ])
    assert.equal(playerDelete.mock.callCount(), 0, 'players are never deleted')
  })
})
