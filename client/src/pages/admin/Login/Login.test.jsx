import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../../context/AuthContext'
import AuthProvider from '../../../context/AuthProvider'
import * as authService from '../../../services/authService'
import Login from './Login'

vi.mock('../../../services/authService', () => ({
  getCurrentAdmin: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

const apiError = (status, message = 'Failed', details = null) =>
  Object.assign(new Error(message), { status, details })

function routes() {
  return [
    { path: '/admin/login', element: <Login /> },
    { path: '/admin', element: <p>Dashboard page</p> },
    { path: '/admin/players', element: <p>Players page</p> },
  ]
}

/** Renders Login with a fake auth context. */
function renderLogin(auth = {}, entry = '/admin/login') {
  const router = createMemoryRouter(routes(), { initialEntries: [entry] })
  const value = {
    status: 'unauthenticated',
    admin: null,
    sessionEnd: null,
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    retry: vi.fn(),
    ...auth,
  }
  render(
    <AuthContext value={value}>
      <RouterProvider router={router} />
    </AuthContext>,
  )
  return { router, value }
}

/** A /admin/login history entry carrying RequireAuth's `from` state. */
const entry = (from) => ({ pathname: '/admin/login', state: from === undefined ? undefined : { from } })

const emailInput = () => screen.getByLabelText(/^Email/)
const passwordInput = () => screen.getByLabelText(/^Password/)
const submitButton = () => screen.getByRole('button', { name: /Sign in|Signing in/ })

function fillAndSubmit(email, password) {
  fireEvent.change(emailInput(), { target: { value: email } })
  fireEvent.change(passwordInput(), { target: { value: password } })
  fireEvent.click(submitButton())
}

describe('Login page', () => {
  it('renders an accessible sign-in form with the email field focused', () => {
    renderLogin()

    expect(screen.getByRole('heading', { level: 1, name: 'Admin sign in' })).toBeTruthy()
    expect(emailInput().getAttribute('type')).toBe('email')
    expect(emailInput().getAttribute('autocomplete')).toBe('username')
    expect(passwordInput().getAttribute('type')).toBe('password')
    expect(passwordInput().getAttribute('autocomplete')).toBe('current-password')
    expect(document.activeElement).toBe(emailInput())
    expect(document.title).toBe('Admin sign in | NIST FC')
  })

  it('shows client-side errors, linked to the fields, without calling the API', () => {
    const { value } = renderLogin()
    fireEvent.click(submitButton())

    expect(value.login).not.toHaveBeenCalled()
    expect(emailInput().getAttribute('aria-invalid')).toBe('true')
    const describedBy = emailInput().getAttribute('aria-describedby')
    expect(document.getElementById(describedBy).textContent).toBe('Email is required')
    expect(screen.getByText('Password is required')).toBeTruthy()
    expect(document.activeElement).toBe(emailInput())
  })

  it('re-validates a field on blur after the first attempt', () => {
    renderLogin()
    fillAndSubmit('not-an-email', 'secret')
    expect(screen.getByText('Email must be a valid email address')).toBeTruthy()

    fireEvent.change(emailInput(), { target: { value: 'admin@example.com' } })
    fireEvent.blur(emailInput())
    expect(screen.queryByText('Email must be a valid email address')).toBeNull()
  })

  it('submits trimmed credentials once and shows a pending state', async () => {
    let finish
    const login = vi.fn(() => new Promise((resolve, reject) => (finish = reject)))
    renderLogin({ login })

    fillAndSubmit('  admin@example.com ', 'Secret-1!')
    expect(login).toHaveBeenCalledWith('admin@example.com', 'Secret-1!')
    expect(submitButton().textContent).toBe('Signing in…')
    expect(submitButton().disabled).toBe(true)

    fireEvent.submit(submitButton().closest('form'))
    expect(login).toHaveBeenCalledTimes(1)

    await act(async () => finish(apiError(401, 'Invalid email or password')))
    expect(submitButton().disabled).toBe(false)
  })

  it('shows the generic invalid-credentials message, clears the password and focuses it', async () => {
    const login = vi.fn().mockRejectedValue(apiError(401, 'Invalid email or password'))
    renderLogin({ login })

    fillAndSubmit('admin@example.com', 'wrong')

    expect((await screen.findByRole('alert')).textContent).toBe('Invalid email or password')
    expect(passwordInput().value).toBe('')
    expect(emailInput().value).toBe('admin@example.com')
    expect(document.activeElement).toBe(passwordInput())
  })

  it('shows server validation errors next to the fields', async () => {
    const login = vi.fn().mockRejectedValue(
      apiError(400, 'Validation failed', { email: 'Email must be a valid email address' }),
    )
    renderLogin({ login })

    fillAndSubmit('admin@example.com', 'secret')

    expect(await screen.findByText('Email must be a valid email address')).toBeTruthy()
    expect(emailInput().getAttribute('aria-invalid')).toBe('true')
  })

  it('shows the rate-limit message', async () => {
    const message = 'Too many login attempts. Please try again later.'
    renderLogin({ login: vi.fn().mockRejectedValue(apiError(429, message)) })

    fillAndSubmit('admin@example.com', 'secret')

    expect((await screen.findByRole('alert')).textContent).toBe(message)
  })

  it.each([500, null])('shows a connection message for status %s', async (code) => {
    renderLogin({ login: vi.fn().mockRejectedValue(apiError(code, 'Internal server error')) })

    fillAndSubmit('admin@example.com', 'secret')

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Unable to reach the server. Please try again.',
    )
  })

  it('shows a loading state while the session is being checked', () => {
    renderLogin({ status: 'loading' })

    expect(screen.getByRole('status').textContent).toContain('Checking your session…')
    expect(screen.queryByRole('form')).toBeNull()
  })

  it('shows a notice when the session expired', () => {
    renderLogin({ sessionExpired: true, sessionEnd: 'expired' })

    expect(screen.getByRole('status').textContent).toBe(
      'Your session has expired. Please sign in again.',
    )
  })
})

describe('Login redirects', () => {
  it('sends an already signed-in admin to the dashboard', () => {
    renderLogin({ status: 'authenticated' })

    expect(screen.getByText('Dashboard page')).toBeTruthy()
  })

  it('returns to the originally requested admin page', () => {
    const { router } = renderLogin(
      { status: 'authenticated' },
      entry({ pathname: '/admin/players', search: '?page=2', hash: '' }),
    )

    expect(screen.getByText('Players page')).toBeTruthy()
    expect(router.state.location.search).toBe('?page=2')
  })

  it.each([
    ['a public page', { pathname: '/players' }],
    ['another origin', { pathname: '//evil.example/admin' }],
    ['the login page', { pathname: '/admin/login' }],
    ['a look-alike path', { pathname: '/administrator' }],
    ['a malformed value', 'https://evil.example'],
  ])('ignores an unsafe redirect target (%s)', (_, from) => {
    renderLogin({ status: 'authenticated' }, entry(from))

    expect(screen.getByText('Dashboard page')).toBeTruthy()
  })
})

describe('Login with the real AuthProvider', () => {
  beforeEach(() => {
    authService.getCurrentAdmin.mockRejectedValue(apiError(401))
  })

  it('signs in and continues to the requested page', async () => {
    authService.login.mockResolvedValue({ id: '1', name: 'Admin', email: 'a@b.co', role: 'admin' })
    const router = createMemoryRouter(
      [
        {
          element: <AuthProvider><Outlet /></AuthProvider>,
          children: routes(),
        },
      ],
      { initialEntries: [entry({ pathname: '/admin/players', search: '', hash: '' })] },
    )
    render(<RouterProvider router={router} />)

    await screen.findByRole('heading', { name: 'Admin sign in' })
    fillAndSubmit('a@b.co', 'Secret-1!')

    expect(await screen.findByText('Players page')).toBeTruthy()
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/players'))
  })
})
