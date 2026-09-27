import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { v2 as cloudinary } from 'cloudinary'
import { cloudinaryService } from '../src/services/cloudinaryService.js'

const buffers = (count) => Array.from({ length: count }, (_, i) => Buffer.from(`image-${i}`))

describe('cloudinaryService.uploadImages', () => {
  it('uploads in order with at most 3 uploads at a time', async (t) => {
    let active = 0
    let peak = 0
    t.mock.method(cloudinaryService, 'uploadImage', async (buffer, { folder }) => {
      active += 1
      peak = Math.max(peak, active)
      await delay(5)
      active -= 1
      return { url: `u-${buffer}`, publicId: `${folder}/${buffer}` }
    })

    const images = await cloudinaryService.uploadImages(buffers(7), { folder: 'nist-fc/memories/m1' })

    assert.equal(peak, 3)
    assert.deepEqual(
      images.map((img) => img.publicId),
      buffers(7).map((b) => `nist-fc/memories/m1/${b}`),
    )
  })

  it('returns an empty list for no files', async (t) => {
    const upload = t.mock.method(cloudinaryService, 'uploadImage', async () => ({}))
    assert.deepEqual(await cloudinaryService.uploadImages([], { folder: 'f' }), [])
    assert.equal(upload.mock.callCount(), 0)
  })

  it('is all-or-nothing: a failure deletes the images already uploaded', async (t) => {
    t.mock.method(cloudinaryService, 'uploadImage', async (buffer) => {
      await delay(buffer.toString() === 'image-2' ? 1 : 5)
      if (buffer.toString() === 'image-2') throw new Error('upload failed')
      return { url: 'u', publicId: String(buffer) }
    })
    const deleted = t.mock.method(cloudinaryService, 'deleteImageQuietly', async () => {})

    await assert.rejects(cloudinaryService.uploadImages(buffers(6), { folder: 'f' }), /upload failed/)

    const deletedIds = deleted.mock.calls.map((call) => call.arguments[0]).sort()
    assert.ok(deletedIds.length > 0)
    assert.ok(!deletedIds.includes('image-2'))
    // Nothing is left behind: every successful upload was deleted.
    assert.ok(deletedIds.every((id) => /^image-[0-5]$/.test(id)))
  })
})

describe('cloudinaryService.deleteFolderQuietly', () => {
  it('deletes the folder', async (t) => {
    const deleteFolder = t.mock.method(cloudinary.api, 'delete_folder', async () => ({ deleted: ['f'] }))
    await cloudinaryService.deleteFolderQuietly('nist-fc/memories/m1')
    assert.deepEqual(deleteFolder.mock.calls[0].arguments, ['nist-fc/memories/m1'])
  })

  it('logs failures without throwing or leaking details', async (t) => {
    const logged = t.mock.method(console, 'error', () => {})
    t.mock.method(cloudinary.api, 'delete_folder', async () => {
      throw { error: { http_code: 400, message: 'Folder is not empty (account detail)' } }
    })

    await cloudinaryService.deleteFolderQuietly('nist-fc/memories/m1')

    const line = logged.mock.calls[0].arguments.join(' ')
    assert.match(line, /nist-fc\/memories\/m1 \(HTTP 400\)/)
    assert.doesNotMatch(line, /account detail/)
  })
})
