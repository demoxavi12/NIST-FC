import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import RequireAuth from './RequireAuth'

function LoginProbe() {
  const location = useLocation()
  return <p>Login page, from: {JSON.stringify(location.state?.from ?? null)}</p>
}

function renderGuard(auth, initialEntry = '/admin/players?page=2#top') {
  const router = createMemoryRouter(
    [
      { path: '/admin/login', element: <LoginProbe /> },
      {
        path: '/admin',
        element: <RequireAuth />,
        children: [{ path: 'players', element: <p>Players page</p> }],
      },
    ],
    { initialEntries: [initialEntry] },
  )
  const value = { status: 'loading', sessionEnd: null, retry: vi.fn(), ...auth }
  render(
    <AuthContext value={value}>
      <RouterProvider router={router} />
    </AuthContext>,
  )
  return { router, value }
}

describe('RequireAuth', () => {
  it('shows an announced loading state while the session is checked', () => {
    renderGuard({ status: 'loading' })

    expect(screen.getByRole('status').textContent).toContain('Checking your session…')
    expect(screen.queryByText('Players page')).toBeNull()
  })

  it('renders the protected page when authenticated', () => {
    renderGuard({ status: 'authenticated' })

    expect(screen.getByText('Players page')).toBeTruthy()
  })

  it('redirects to login, remembering the requested page', () => {
    const { router } = renderGuard({ status: 'unauthenticated' })

    expect(router.state.location.pathname).toBe('/admin/login')
    const from = router.state.location.state.from
    expect(from).toMatchObject({ pathname: '/admin/players', search: '?page=2', hash: '#top' })
  })

  it('also remembers the page when the session expired', () => {
    const { router } = renderGuard({ status: 'unauthenticated', sessionEnd: 'expired' })

    expect(router.state.location.state.from.pathname).toBe('/admin/players')
  })

  it('does not remember the page after an explicit logout', () => {
    const { router } = renderGuard({ status: 'unauthenticated', sessionEnd: 'logout' })

    expect(router.state.location.pathname).toBe('/admin/login')
    expect(router.state.location.state).toBeNull()
  })

  it('shows an error with Retry instead of redirecting when the check fails', () => {
    const { router, value } = renderGuard({ status: 'error' })

    expect(screen.getByRole('heading', { name: 'Unable to verify your session' })).toBeTruthy()
    expect(router.state.location.pathname).toBe('/admin/players')

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(value.retry).toHaveBeenCalledTimes(1)
  })
})
