import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import Admin from '../src/models/Admin.js'
import Memory from '../src/models/Memory.js'
import Player from '../src/models/Player.js'
import { cloudinaryService } from '../src/services/cloudinaryService.js'
import { buildPlayerFilter } from '../src/services/playerService.js'
import { AUTH_ENV, startServer, testConfig } from './helpers.js'

// ---- fixtures -------------------------------------------------------------

const ADMIN = { _id: new mongoose.Types.ObjectId(), name: 'Admin', email: 'a@b.co', role: 'admin' }
const AUTH = {
  Cookie: `${AUTH_ENV.COOKIE_NAME}=${jwt.sign({ role: 'admin' }, AUTH_ENV.JWT_SECRET, {
    subject: String(ADMIN._id),
    expiresIn: '1h',
  })}`,
}
const UPLOADED = { url: 'https://res.cloudinary.com/demo/image/upload/new.jpg', publicId: 'nist-fc/players/new' }
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4])

function playerDoc(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Rahul Das',
    slug: 'rahul-das',
    photo: { url: 'https://res.cloudinary.com/demo/image/upload/old.jpg', publicId: 'nist-fc/players/old' },
    position: 'Midfielder',
    batch: '2023-2027',
    branch: 'CSE',
    bio: 'Box-to-box midfielder.',
    status: 'current',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
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
    lean: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

function signedIn(t) {
  t.mock.method(Admin, 'findById', async () => ADMIN)
}

function mockUpload(t) {
  return t.mock.method(cloudinaryService, 'uploadImage', async () => UPLOADED)
}

function mockQuietDelete(t) {
  return t.mock.method(cloudinaryService, 'deleteImageQuietly', async () => {})
}

function playerForm(fields = {}, photo = { bytes: PNG, type: 'image/png', name: 'photo.png' }) {
  const form = new FormData()
  const values = { name: 'Rahul Das', position: 'Midfielder', batch: '2023-2027', branch: 'CSE', ...fields }
  for (const [key, value] of Object.entries(values)) if (value !== undefined) form.append(key, value)
  if (photo) form.append('photo', new Blob([photo.bytes], { type: photo.type }), photo.name)
  return form
}

let server
const url = (path) => `${server.baseUrl}${path}`
const json = async (res) => ({ status: res.status, body: await res.json() })

before(async () => {
  server = await startServer(createApp(testConfig({ MAX_IMAGE_SIZE_MB: '0.01' }), { logRequests: false }))
})
after(() => server.close())

// ---- public reads ---------------------------------------------------------

describe('GET /api/players', () => {
  function mockList(t, { players = [playerDoc()], total = players.length } = {}) {
    const listQuery = query(players)
    const find = t.mock.method(Player, 'find', () => listQuery)
    const count = t.mock.method(Player, 'countDocuments', async () => total)
    t.mock.method(Player, 'distinct', async (field) =>
      field === 'batch' ? ['2022-2026', '2024-2028', '2023-2027'] : ['ECE', 'CSE', 'EEE'],
    )
    return { find, count, listQuery }
  }

  it('returns a page of players with pagination and filter options', async (t) => {
    const { find, listQuery } = mockList(t, { total: 25 })
    const { status, body } = await json(await fetch(url('/api/players')))

    assert.equal(status, 200)
    assert.equal(body.success, true)
    assert.equal(body.message, 'Players retrieved successfully')
    assert.deepEqual(body.pagination, { page: 1, limit: 12, total: 25, pages: 3 })
    assert.deepEqual(body.filters, {
      batches: ['2024-2028', '2023-2027', '2022-2026'],
      branches: ['CSE', 'ECE', 'EEE'],
    })
    assert.deepEqual(Object.keys(body.data[0]).sort(), [
      'batch', 'bio', 'branch', 'createdAt', 'id', 'name', 'photo', 'position', 'slug', 'status', 'updatedAt',
    ])
    assert.equal(body.data[0].batch, '2023-2027')
    assert.deepEqual(find.mock.calls[0].arguments[0], {})
    assert.deepEqual(listQuery.calls, { sort: { name: 1, _id: 1 }, skip: 0, limit: 12 })
  })

  it('combines search, filters, sort and pagination', async (t) => {
    const { find, count, listQuery } = mockList(t)
    const params = new URLSearchParams({
      search: 'da.s(', status: 'former', position: 'Defender', batch: '2023-2027',
      branch: 'CSE', page: '3', limit: '5', sort: '-batch',
    })
    const res = await fetch(url(`/api/players?${params}`))
    assert.equal(res.status, 200)

    const filter = find.mock.calls[0].arguments[0]
    assert.equal(filter.status, 'former')
    assert.equal(filter.position, 'Defender')
    assert.equal(filter.batch, '2023-2027')
    assert.equal(filter.branch, 'CSE')
    assert.equal(filter.name.$regex, 'da\\.s\\(')
    assert.equal(filter.name.$options, 'i')
    assert.deepEqual(count.mock.calls[0].arguments[0], filter)
    assert.deepEqual(listQuery.calls, { sort: { batch: -1, name: 1, _id: 1 }, skip: 10, limit: 5 })
  })

  it('rejects invalid query values with field messages', async (t) => {
    mockList(t)
    const params = 'status=retired&position=Striker&batch=2027-2023&page=0&limit=100&sort=age'
    const { status, body } = await json(await fetch(url(`/api/players?${params}`)))

    assert.equal(status, 400)
    assert.equal(body.message, 'Validation failed')
    assert.deepEqual(Object.keys(body.error).sort(), ['batch', 'limit', 'page', 'position', 'sort', 'status'])
    assert.equal(body.error.batch, 'The second batch year must be after the first')
  })

  it('marks the name-search $regex as trusted so sanitizeFilter keeps it', () => {
    // Mongoose runs sanitizeFilter on every query filter (config/db.js). An
    // unmarked $regex would be wrapped in $eq and silently match nothing.
    const filter = buildPlayerFilter({ search: 'da.s(', status: 'former', batch: '2023-2027' })
    const sanitized = mongoose.sanitizeFilter(filter)

    assert.equal(sanitized.name.$eq, undefined, 'the $regex must not be wrapped in $eq')
    assert.equal(sanitized.name.$regex, 'da\\.s\\(')
    assert.equal(sanitized.name.$options, 'i')
    assert.equal(sanitized.status, 'former')
    assert.equal(sanitized.batch, '2023-2027')

    // Control: the same operator without the trusted marker is neutralised.
    const untrusted = mongoose.sanitizeFilter({ name: { $regex: 'da\\.s\\(', $options: 'i' } })
    assert.deepEqual(untrusted.name, { $eq: { $regex: 'da\\.s\\(', $options: 'i' } })
  })

  it('ignores MongoDB operator syntax in the query string', async (t) => {
    const { find } = mockList(t)
    const res = await fetch(url('/api/players?status[$ne]=current&name[$regex]=.*'))

    assert.equal(res.status, 200)
    assert.deepEqual(find.mock.calls[0].arguments[0], {})
  })
})

describe('GET /api/players/:slug', () => {
  it("returns the player and their published memories, newest first", async (t) => {
    const player = playerDoc()
    const findOne = t.mock.method(Player, 'findOne', () => query(player))
    const memoryQuery = query([
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Memory',
        slug: 'test-memory',
        date: new Date('2025-12-12T00:00:00Z'),
        description: 'A day to remember.',
        coverImage: { url: 'https://res.cloudinary.com/demo/image/upload/c.jpg', publicId: 'c' },
        photos: [{ url: 'u', publicId: 'p1' }],
        published: true,
      },
    ])
    const findMemories = t.mock.method(Memory, 'find', () => memoryQuery)
    const { status, body } = await json(await fetch(url('/api/players/Rahul-Das')))

    assert.equal(status, 200)
    assert.equal(body.data.player.slug, 'rahul-das')
    assert.deepEqual(findOne.mock.calls[0].arguments[0], { slug: 'rahul-das' })
    assert.deepEqual(findMemories.mock.calls[0].arguments[0], {
      published: true,
      players: String(player._id),
    })
    assert.deepEqual(memoryQuery.calls, { sort: { date: -1, _id: -1 }, limit: 12, select: '-players' })
    assert.equal(body.data.memories.length, 1)
    assert.equal(body.data.memories[0].slug, 'test-memory')
    assert.equal(body.data.memories[0].photoCount, 1)
  })

  it('returns 404 for an unknown slug', async (t) => {
    t.mock.method(Player, 'findOne', () => query(null))
    const { status, body } = await json(await fetch(url('/api/players/nobody')))

    assert.equal(status, 404)
    assert.deepEqual(body, { success: false, message: 'Player not found', error: null })
  })
})

describe('GET /api/admin/players/:id', () => {
  it('requires authentication', async () => {
    const { status } = await json(await fetch(url(`/api/admin/players/${new mongoose.Types.ObjectId()}`)))
    assert.equal(status, 401)
  })

  it('validates the id and returns 404 for unknown players', async (t) => {
    signedIn(t)
    const findById = t.mock.method(Player, 'findById', () => query(null))

    assert.equal((await fetch(url('/api/admin/players/not-an-id'), { headers: AUTH })).status, 400)
    assert.equal(findById.mock.callCount(), 0)
    assert.equal(
      (await fetch(url(`/api/admin/players/${new mongoose.Types.ObjectId()}`), { headers: AUTH })).status,
      404,
    )
  })

  it('returns the player', async (t) => {
    signedIn(t)
    const player = playerDoc()
    t.mock.method(Player, 'findById', () => query(player))
    const { status, body } = await json(await fetch(url(`/api/admin/players/${player._id}`), { headers: AUTH }))

    assert.equal(status, 200)
    assert.equal(body.data.player.id, String(player._id))
  })
})

// ---- create ---------------------------------------------------------------

describe('POST /api/players', () => {
  const post = (form, headers = AUTH) => fetch(url('/api/players'), { method: 'POST', headers, body: form })

  it('rejects unauthenticated requests before reading the upload', async (t) => {
    const upload = mockUpload(t)
    const { status } = await json(await post(playerForm(), {}))

    assert.equal(status, 401)
    assert.equal(upload.mock.callCount(), 0)
  })

  it('requires a photo', async (t) => {
    signedIn(t)
    const upload = mockUpload(t)
    const { status, body } = await json(await post(playerForm({}, null)))

    assert.equal(status, 400)
    assert.deepEqual(body.error, { photo: 'Photo is required' })
    assert.equal(upload.mock.callCount(), 0)
  })

  it('validates fields before uploading', async (t) => {
    signedIn(t)
    const upload = mockUpload(t)
    const { status, body } = await json(
      await post(playerForm({ name: '', position: 'Striker', batch: '2023', branch: undefined })),
    )

    assert.equal(status, 400)
    assert.deepEqual(body.error, {
      name: 'Name is required',
      position: 'Position must be one of: Goalkeeper, Defender, Midfielder, Forward',
      batch: 'Batch must use the format YYYY-YYYY (e.g. 2023-2027)',
      branch: 'Branch is required',
    })
    assert.equal(upload.mock.callCount(), 0)
  })

  it('rejects files that are not JPEG, PNG or WEBP', async (t) => {
    signedIn(t)
    const upload = mockUpload(t)

    for (const photo of [
      { bytes: PNG, type: 'text/plain', name: 'notes.txt' },
      { bytes: PNG, type: 'image/png', name: 'photo.exe' },
      { bytes: PNG, type: 'image/gif', name: 'photo.gif' },
    ]) {
      const { status, body } = await json(await post(playerForm({}, photo)))
      assert.equal(status, 400, photo.name)
      assert.equal(body.error.photo, 'Photo must be a JPEG, PNG or WEBP image')
    }
    assert.equal(upload.mock.callCount(), 0)
  })

  it('rejects images over MAX_IMAGE_SIZE_MB with 413', async (t) => {
    signedIn(t)
    mockUpload(t)
    const big = { bytes: new Uint8Array(20 * 1024), type: 'image/jpeg', name: 'big.jpg' }
    const { status, body } = await json(await post(playerForm({}, big)))

    assert.equal(status, 413)
    assert.equal(body.message, 'Image must be at most 0.01 MB')
  })

  it('uploads the photo, generates a unique slug and stores only the image reference', async (t) => {
    signedIn(t)
    const upload = mockUpload(t)
    const existing = t.mock.method(Player, 'find', () => query([{ slug: 'rahul-das' }, { slug: 'rahul-das-2' }]))
    const create = t.mock.method(Player, 'create', async (fields) => playerDoc({ ...fields, _id: new mongoose.Types.ObjectId() }))

    const { status, body } = await json(await post(playerForm({ name: '  Rahul Das ', bio: 'Captain material' })))

    assert.equal(status, 201)
    assert.equal(body.message, 'Player created successfully')
    const [buffer, options] = upload.mock.calls[0].arguments
    assert.deepEqual(new Uint8Array(buffer), PNG)
    assert.deepEqual(options, { folder: 'nist-fc/players' })

    assert.match(existing.mock.calls[0].arguments[0].slug.$regex, /^\^rahul-das/)
    const stored = create.mock.calls[0].arguments[0]
    assert.deepEqual(stored, {
      name: 'Rahul Das',
      position: 'Midfielder',
      batch: '2023-2027',
      branch: 'CSE',
      bio: 'Captain material',
      status: 'current',
      slug: 'rahul-das-3',
      photo: UPLOADED,
    })
    assert.equal(body.data.player.slug, 'rahul-das-3')
  })

  it('retries once when another request takes the same slug', async (t) => {
    signedIn(t)
    mockUpload(t)
    const cleanup = mockQuietDelete(t)
    t.mock.method(Player, 'find', () => query([]))
    let calls = 0
    t.mock.method(Player, 'create', async (fields) => {
      calls += 1
      if (calls === 1) throw Object.assign(new Error('dup'), { code: 11000, keyPattern: { slug: 1 } })
      return playerDoc(fields)
    })

    assert.equal((await post(playerForm())).status, 201)
    assert.equal(calls, 2)
    assert.equal(cleanup.mock.callCount(), 0)
  })

  it('deletes the uploaded photo if saving fails', async (t) => {
    signedIn(t)
    mockUpload(t)
    const cleanup = mockQuietDelete(t)
    t.mock.method(console, 'error', () => {})
    t.mock.method(Player, 'find', () => query([]))
    t.mock.method(Player, 'create', async () => {
      throw new Error('database unavailable')
    })

    const { status, body } = await json(await post(playerForm()))

    assert.equal(status, 500)
    assert.equal(body.message, 'Internal server error')
    assert.deepEqual(cleanup.mock.calls[0].arguments, [UPLOADED.publicId])
  })

  it('returns 502 when Cloudinary rejects the upload', async (t) => {
    signedIn(t)
    const { default: ApiError } = await import('../src/utils/ApiError.js')
    t.mock.method(cloudinaryService, 'uploadImage', async () => {
      throw new ApiError(502, 'Image upload failed')
    })
    const create = t.mock.method(Player, 'create', async () => {})

    const { status, body } = await json(await post(playerForm()))
    assert.equal(status, 502)
    assert.equal(body.message, 'Image upload failed')
    assert.equal(create.mock.callCount(), 0)
  })
})

// ---- update ---------------------------------------------------------------

describe('PATCH /api/players/:id', () => {
  function mockFindForUpdate(t, overrides) {
    const doc = new Player(playerDoc(overrides))
    const save = t.mock.method(doc, 'save', async () => doc)
    t.mock.method(Player, 'findById', () => query(doc))
    return { doc, save }
  }

  const patchJson = (id, body, headers = AUTH) =>
    fetch(url(`/api/players/${id}`), {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('requires authentication and a valid id', async (t) => {
    assert.equal((await patchJson(new mongoose.Types.ObjectId(), { status: 'former' }, {})).status, 401)
    signedIn(t)
    assert.equal((await patchJson('123', { status: 'former' })).status, 400)
  })

  it('returns 404 for an unknown player without uploading', async (t) => {
    signedIn(t)
    const upload = mockUpload(t)
    t.mock.method(Player, 'findById', () => query(null))
    const form = playerForm({ name: undefined, position: undefined, batch: undefined, branch: undefined })

    const res = await fetch(url(`/api/players/${new mongoose.Types.ObjectId()}`), { method: 'PATCH', headers: AUTH, body: form })
    assert.equal(res.status, 404)
    assert.equal(upload.mock.callCount(), 0)
  })

  it('marks a player as former without touching the photo or slug', async (t) => {
    signedIn(t)
    const upload = mockUpload(t)
    const cleanup = mockQuietDelete(t)
    const { doc, save } = mockFindForUpdate(t)

    const { status, body } = await json(await patchJson(doc._id, { status: 'former' }))

    assert.equal(status, 200)
    assert.equal(body.message, 'Player updated successfully')
    assert.equal(body.data.player.status, 'former')
    assert.equal(body.data.player.slug, 'rahul-das')
    assert.equal(save.mock.callCount(), 1)
    assert.equal(upload.mock.callCount(), 0)
    assert.equal(cleanup.mock.callCount(), 0)
  })

  it('keeps the slug stable when the name changes', async (t) => {
    signedIn(t)
    const { doc } = mockFindForUpdate(t)
    const { body } = await json(await patchJson(doc._id, { name: 'Rahul K. Das' }))

    assert.equal(body.data.player.name, 'Rahul K. Das')
    assert.equal(body.data.player.slug, 'rahul-das')
  })

  it('rejects an empty update and invalid values', async (t) => {
    signedIn(t)
    mockFindForUpdate(t)
    const id = new mongoose.Types.ObjectId()

    const empty = await json(await patchJson(id, {}))
    assert.equal(empty.status, 400)
    assert.deepEqual(empty.body.error, { body: 'Provide at least one field or a new photo to update' })

    const invalid = await json(await patchJson(id, { batch: '2025-2024', status: 'retired' }))
    assert.equal(invalid.status, 400)
    assert.deepEqual(Object.keys(invalid.body.error).sort(), ['batch', 'status'])
  })

  it('replaces the photo and deletes the old one only after saving', async (t) => {
    signedIn(t)
    const events = []
    t.mock.method(cloudinaryService, 'uploadImage', async () => {
      events.push('upload new photo')
      return UPLOADED
    })
    const cleanup = t.mock.method(cloudinaryService, 'deleteImageQuietly', async (publicId) => {
      events.push(`delete ${publicId}`)
    })
    const { doc, save } = mockFindForUpdate(t)
    // The save takes a moment to complete, so cleanup starting before it
    // finished would show up in the recorded order.
    save.mock.mockImplementation(async () => {
      events.push('save started')
      await new Promise((resolve) => setTimeout(resolve, 20))
      events.push('save finished')
      return doc
    })
    const form = playerForm({ name: undefined, position: undefined, batch: undefined, branch: undefined })

    const { status, body } = await json(
      await fetch(url(`/api/players/${doc._id}`), { method: 'PATCH', headers: AUTH, body: form }),
    )

    assert.equal(status, 200)
    assert.deepEqual(body.data.player.photo, UPLOADED)
    assert.deepEqual(events, [
      'upload new photo',
      'save started',
      'save finished',
      'delete nist-fc/players/old',
    ])
    assert.equal(cleanup.mock.callCount(), 1, 'only the old photo is deleted')
  })

  it('deletes the new photo and keeps the old one if saving fails', async (t) => {
    signedIn(t)
    mockUpload(t)
    const cleanup = mockQuietDelete(t)
    t.mock.method(console, 'error', () => {})
    const { doc, save } = mockFindForUpdate(t)
    save.mock.mockImplementation(async () => {
      throw new Error('write failed')
    })

    const res = await fetch(url(`/api/players/${doc._id}`), {
      method: 'PATCH',
      headers: AUTH,
      body: playerForm({ position: 'Forward' }),
    })

    assert.equal(res.status, 500)
    assert.deepEqual(cleanup.mock.calls.map((call) => call.arguments[0]), [UPLOADED.publicId])
  })
})

// ---- delete ---------------------------------------------------------------

describe('DELETE /api/players/:id', () => {
  const del = (id, headers = AUTH) => fetch(url(`/api/players/${id}`), { method: 'DELETE', headers })

  it('requires authentication', async () => {
    assert.equal((await del(new mongoose.Types.ObjectId(), {})).status, 401)
  })

  it('returns 404 for an unknown player', async (t) => {
    signedIn(t)
    t.mock.method(Player, 'findById', () => query(null))
    assert.equal((await del(new mongoose.Types.ObjectId())).status, 404)
  })

  it('removes the player from memories, deletes the player, then its photo', async (t) => {
    signedIn(t)
    const player = playerDoc()
    const order = []
    t.mock.method(Player, 'findById', () => query(player))
    const pull = t.mock.method(Memory, 'updateMany', async () => {
      order.push('memories')
      return { modifiedCount: 2 }
    })
    const deleteOne = t.mock.method(Player, 'deleteOne', async () => {
      order.push('player')
      return { deletedCount: 1 }
    })
    t.mock.method(cloudinaryService, 'deleteImageQuietly', async (publicId) => {
      order.push(`photo:${publicId}`)
    })

    const { status, body } = await json(await del(player._id))

    assert.equal(status, 200)
    assert.deepEqual(body, { success: true, data: null, message: 'Player deleted successfully' })
    assert.deepEqual(deleteOne.mock.calls[0].arguments[0], { _id: player._id })
    assert.deepEqual(pull.mock.calls[0].arguments, [
      { players: player._id },
      { $pull: { players: player._id } },
    ])
    assert.deepEqual(order, ['memories', 'player', 'photo:nist-fc/players/old'])
  })

  it('still succeeds when the photo cannot be deleted', async (t) => {
    signedIn(t)
    const logged = t.mock.method(console, 'error', () => {})
    t.mock.method(Player, 'findById', () => query(playerDoc()))
    t.mock.method(Memory, 'updateMany', async () => ({ modifiedCount: 0 }))
    t.mock.method(Player, 'deleteOne', async () => ({ deletedCount: 1 }))
    t.mock.method(cloudinaryService, 'deleteImage', async () => {
      throw Object.assign(new Error('cloud down'), { http_code: 503 })
    })

    assert.equal((await del(new mongoose.Types.ObjectId())).status, 200)
    assert.match(logged.mock.calls[0].arguments.join(' '), /Failed to delete Cloudinary image nist-fc\/players\/old/)
  })
})
