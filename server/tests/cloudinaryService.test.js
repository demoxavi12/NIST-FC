import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { v2 as cloudinary } from 'cloudinary'
import { cloudinaryService } from '../src/services/cloudinaryService.js'
import ApiError from '../src/utils/ApiError.js'

/** Stubs upload_stream: calls back with (error, result) once the buffer is written. */
function mockUploadStream(t, error, result) {
  return t.mock.method(cloudinary.uploader, 'upload_stream', (options, callback) => ({
    end: (buffer) => callback(error, result, buffer),
  }))
}

describe('cloudinaryService.uploadImage', () => {
  it('uploads to the folder with image-only, size-limited options', async (t) => {
    const stream = mockUploadStream(t, null, {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/nist-fc/players/abc.jpg',
      public_id: 'nist-fc/players/abc',
    })

    const image = await cloudinaryService.uploadImage(Buffer.from('img'), { folder: 'nist-fc/players' })

    assert.deepEqual(image, {
      url: 'https://res.cloudinary.com/demo/image/upload/v1/nist-fc/players/abc.jpg',
      publicId: 'nist-fc/players/abc',
    })
    const [options] = stream.mock.calls[0].arguments
    assert.equal(options.folder, 'nist-fc/players')
    assert.equal(options.resource_type, 'image')
    assert.deepEqual(options.allowed_formats, ['jpg', 'png', 'webp'])
    assert.deepEqual(options.transformation, [{ width: 1600, height: 1600, crop: 'limit' }])
    assert.equal(options.public_id, undefined, 'Cloudinary assigns a random public ID')
  })

  it('fails with 502 and logs only the HTTP status', async (t) => {
    const logged = t.mock.method(console, 'error', () => {})
    mockUploadStream(t, { http_code: 401, message: 'Unknown API key 123456' }, null)

    await assert.rejects(
      cloudinaryService.uploadImage(Buffer.from('img'), { folder: 'x' }),
      (error) => error instanceof ApiError && error.statusCode === 502 && error.message === 'Image upload failed',
    )
    const line = logged.mock.calls[0].arguments.join(' ')
    assert.match(line, /HTTP 401/)
    assert.doesNotMatch(line, /123456|API key/)
  })
})

describe('cloudinaryService.deleteImage', () => {
  it('treats "ok" and "not found" as deleted', async (t) => {
    const destroy = t.mock.method(cloudinary.uploader, 'destroy', async () => ({ result: 'ok' }))
    await cloudinaryService.deleteImage('nist-fc/players/abc')
    assert.deepEqual(destroy.mock.calls[0].arguments, ['nist-fc/players/abc', { invalidate: true }])

    destroy.mock.mockImplementation(async () => ({ result: 'not found' }))
    await cloudinaryService.deleteImage('nist-fc/players/abc')
  })

  it('throws on any other result', async (t) => {
    t.mock.method(cloudinary.uploader, 'destroy', async () => ({ result: 'error' }))
    await assert.rejects(cloudinaryService.deleteImage('x'), /destroy returned "error"/)
  })

  it('deleteImageQuietly logs failures instead of throwing', async (t) => {
    const logged = t.mock.method(console, 'error', () => {})
    t.mock.method(cloudinaryService, 'deleteImage', async () => {
      throw Object.assign(new Error('secret detail'), { http_code: 500 })
    })

    await cloudinaryService.deleteImageQuietly('nist-fc/players/abc')

    const line = logged.mock.calls[0].arguments.join(' ')
    assert.match(line, /nist-fc\/players\/abc \(HTTP 500\)/)
    assert.doesNotMatch(line, /secret detail/)
  })
})
