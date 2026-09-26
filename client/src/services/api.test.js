import { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import api, { setSessionExpiredHandler } from './api'

// Axios adapters let a request fail with a given response without a network.
function failWith(status, data) {
  return (config) =>
    Promise.reject(
      new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
        status,
        statusText: '',
        data,
        headers: {},
        config,
      }),
    )
}

function networkFailure(config) {
  return Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config))
}

describe('api client', () => {
  afterEach(() => {
    setSessionExpiredHandler(null)
  })

  it('uses the relative /api base path and sends credentials', () => {
    expect(api.defaults.baseURL).toBe('/api')
    expect(api.defaults.withCredentials).toBe(true)
  })

  it('normalises API errors to message, status and details', async () => {
    const request = api.get('/players', {
      adapter: failWith(400, {
        success: false,
        message: 'Validation failed',
        error: { name: 'Name is required' },
      }),
    })

    await expect(request).rejects.toMatchObject({
      message: 'Validation failed',
      status: 400,
      details: { name: 'Name is required' },
    })
  })

  it('uses a generic message when the server cannot be reached', async () => {
    await expect(api.get('/players', { adapter: networkFailure })).rejects.toMatchObject({
      message: 'Something went wrong. Please try again.',
      status: null,
      details: null,
    })
  })

  it('reports a 401 on a protected request as an expired session', async () => {
    const handler = vi.fn()
    setSessionExpiredHandler(handler)

    await expect(
      api.get('/admin/memories', {
        adapter: failWith(401, { success: false, message: 'Authentication required', error: null }),
      }),
    ).rejects.toMatchObject({ status: 401, message: 'Authentication required' })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not report 401s from requests that opt out, or other statuses', async () => {
    const handler = vi.fn()
    setSessionExpiredHandler(handler)

    await expect(
      api.get('/auth/me', { skipSessionExpiry: true, adapter: failWith(401, {}) }),
    ).rejects.toMatchObject({ status: 401 })
    await expect(api.get('/admin/x', { adapter: failWith(403, {}) })).rejects.toMatchObject({
      status: 403,
    })
    await expect(api.get('/admin/x', { adapter: networkFailure })).rejects.toBeInstanceOf(Error)

    expect(handler).not.toHaveBeenCalled()
  })

  it('only unregisters the handler it registered', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const unregisterFirst = setSessionExpiredHandler(first)
    setSessionExpiredHandler(second)
    unregisterFirst()

    await expect(api.get('/admin/x', { adapter: failWith(401, {}) })).rejects.toBeTruthy()
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
