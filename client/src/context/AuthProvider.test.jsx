import { act, render, screen, waitFor } from '@testing-library/react'
import { StrictMode, useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useAuth from '../hooks/useAuth'
import { setSessionExpiredHandler } from '../services/api'
import * as authService from '../services/authService'
import AuthProvider from './AuthProvider'

vi.mock('../services/authService', () => ({
  getCurrentAdmin: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))
vi.mock('../services/api', () => ({ setSessionExpiredHandler: vi.fn() }))

const ADMIN = { id: '1', name: 'NIST FC Admin', email: 'admin@example.com', role: 'admin' }
const apiError = (status, message = 'Failed') => Object.assign(new Error(message), { status })

// The latest auth value, captured after each render for the tests to act on.
const probe = { auth: null }
function Probe() {
  const auth = useAuth()
  useEffect(() => {
    probe.auth = auth
  })
  return <p data-testid="status">{auth.status}</p>
}

function renderProvider({ strict = false } = {}) {
  const tree = (
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

const status = () => screen.getByTestId('status').textContent

beforeEach(() => {
  probe.auth = null
  setSessionExpiredHandler.mockReturnValue(() => {})
})

describe('AuthProvider session restoration', () => {
  it('starts loading and restores an existing session from /auth/me', async () => {
    authService.getCurrentAdmin.mockResolvedValue(ADMIN)
    renderProvider()

    expect(status()).toBe('loading')
    await waitFor(() => expect(status()).toBe('authenticated'))
    expect(probe.auth.admin).toEqual(ADMIN)
    expect(authService.getCurrentAdmin).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) })
  })

  it('treats a 401 as signed out', async () => {
    authService.getCurrentAdmin.mockRejectedValue(apiError(401))
    renderProvider()

    await waitFor(() => expect(status()).toBe('unauthenticated'))
    expect(probe.auth.admin).toBeNull()
    expect(probe.auth.sessionExpired).toBe(false)
  })

  it.each([
    ['a server error', 500],
    ['a network failure', null],
  ])('shows an error state for %s, and Retry checks again', async (_, code) => {
    authService.getCurrentAdmin.mockRejectedValueOnce(apiError(code)).mockResolvedValueOnce(ADMIN)
    renderProvider()

    await waitFor(() => expect(status()).toBe('error'))
    expect(authService.getCurrentAdmin).toHaveBeenCalledTimes(1)

    act(() => probe.auth.retry())
    expect(status()).toBe('loading')
    await waitFor(() => expect(status()).toBe('authenticated'))
    expect(authService.getCurrentAdmin).toHaveBeenCalledTimes(2)
  })

  it('applies only the latest check under StrictMode', async () => {
    let resolveStale
    authService.getCurrentAdmin
      .mockImplementationOnce(() => new Promise((resolve) => (resolveStale = resolve)))
      .mockResolvedValueOnce({ ...ADMIN, name: 'Fresh' })
    renderProvider({ strict: true })

    await waitFor(() => expect(status()).toBe('authenticated'))
    const [firstCall] = authService.getCurrentAdmin.mock.calls
    expect(firstCall[0].signal.aborted).toBe(true)

    await act(async () => resolveStale({ ...ADMIN, name: 'Stale' }))
    expect(probe.auth.admin.name).toBe('Fresh')
  })
})

describe('AuthProvider login and logout', () => {
  beforeEach(() => {
    authService.getCurrentAdmin.mockRejectedValue(apiError(401))
  })

  it('logs in and stores only the returned admin in memory', async () => {
    authService.login.mockResolvedValue(ADMIN)
    renderProvider()
    await waitFor(() => expect(status()).toBe('unauthenticated'))

    await act(() => probe.auth.login('admin@example.com', 'secret'))

    expect(authService.login).toHaveBeenCalledWith('admin@example.com', 'secret')
    expect(status()).toBe('authenticated')
    expect(probe.auth.admin).toEqual(ADMIN)
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('rethrows login errors and stays signed out', async () => {
    authService.login.mockRejectedValue(apiError(401, 'Invalid email or password'))
    renderProvider()
    await waitFor(() => expect(status()).toBe('unauthenticated'))

    await act(async () => {
      await expect(probe.auth.login('admin@example.com', 'wrong')).rejects.toMatchObject({ status: 401 })
    })
    expect(status()).toBe('unauthenticated')
  })

  async function signedIn() {
    authService.getCurrentAdmin.mockResolvedValue(ADMIN)
    renderProvider()
    await waitFor(() => expect(status()).toBe('authenticated'))
  }

  it.each([
    ['succeeds', () => authService.logout.mockResolvedValue()],
    ['returns 401 (already expired)', () => authService.logout.mockRejectedValue(apiError(401))],
  ])('signs out when logout %s', async (_, arrange) => {
    arrange()
    await signedIn()

    await act(() => probe.auth.logout())

    expect(status()).toBe('unauthenticated')
    expect(probe.auth.admin).toBeNull()
    expect(probe.auth.sessionEnd).toBe('logout')
    expect(probe.auth.sessionExpired).toBe(false)
  })

  it.each([500, null])('stays signed in when logout fails with %s', async (code) => {
    authService.logout.mockRejectedValue(apiError(code))
    await signedIn()

    await act(async () => {
      await expect(probe.auth.logout()).rejects.toMatchObject({ status: code })
    })
    expect(status()).toBe('authenticated')
    expect(probe.auth.admin).toEqual(ADMIN)
  })
})

describe('AuthProvider expired sessions', () => {
  it('signs out with sessionExpired when a protected request returns 401', async () => {
    authService.getCurrentAdmin.mockResolvedValue(ADMIN)
    renderProvider()
    await waitFor(() => expect(status()).toBe('authenticated'))

    const onExpired = setSessionExpiredHandler.mock.calls.at(-1)[0]
    act(() => onExpired())

    expect(status()).toBe('unauthenticated')
    expect(probe.auth.sessionExpired).toBe(true)
    expect(probe.auth.sessionEnd).toBe('expired')
  })

  it('ignores expiry notifications when not signed in', async () => {
    authService.getCurrentAdmin.mockRejectedValue(apiError(401))
    renderProvider()
    await waitFor(() => expect(status()).toBe('unauthenticated'))

    act(() => setSessionExpiredHandler.mock.calls.at(-1)[0]())
    expect(probe.auth.sessionExpired).toBe(false)
  })

  it('unregisters its handler on unmount', async () => {
    const unregister = vi.fn()
    setSessionExpiredHandler.mockReturnValue(unregister)
    authService.getCurrentAdmin.mockRejectedValue(apiError(401))
    const { unmount } = renderProvider()
    await waitFor(() => expect(status()).toBe('unauthenticated'))

    unmount()
    expect(unregister).toHaveBeenCalled()
  })
})

describe('useAuth', () => {
  it('throws outside AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow('useAuth must be used inside <AuthProvider>')
  })
})
