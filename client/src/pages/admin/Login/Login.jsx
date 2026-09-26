import { AlertCircle, Info } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import Button from '../../../components/common/Button'
import LoadingState from '../../../components/common/LoadingState'
import TextField from '../../../components/common/TextField'
import { SITE_NAME } from '../../../constants/site'
import useAuth from '../../../hooks/useAuth'
import usePageMeta from '../../../hooks/usePageMeta'
import { validateLoginForm } from '../../../utils/validateLoginForm'

const DEFAULT_REDIRECT = '/admin'
const NETWORK_ERROR = 'Unable to reach the server. Please try again.'

/**
 * Where to go after signing in: the admin page the visitor originally
 * requested (set by RequireAuth), or the dashboard. Only internal /admin
 * paths are accepted, so the redirect cannot be pointed elsewhere.
 */
function getRedirectTarget(from) {
  const path = from?.pathname
  const isAdminPath =
    typeof path === 'string' && (path === '/admin' || path.startsWith('/admin/'))

  if (!isAdminPath || path === '/admin/login') return DEFAULT_REDIRECT

  const search = typeof from.search === 'string' ? from.search : ''
  const hash = typeof from.hash === 'string' ? from.hash : ''
  return `${path}${search}${hash}`
}

/** Rendered outside AdminLayout: no sidebar before sign-in. */
function Login() {
  const { status, login, sessionExpired } = useAuth()
  const location = useLocation()
  usePageMeta({ title: 'Admin sign in', noindex: true })

  const [values, setValues] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  if (status === 'loading') {
    return <LoadingState fullPage label="Checking your session…" />
  }

  // Signed in (already, or just now): continue to the requested page.
  if (status === 'authenticated') {
    return <Navigate to={getRedirectTarget(location.state?.from)} replace />
  }

  function focusFirstInvalid(errors) {
    if (errors.email) emailRef.current?.focus()
    else if (errors.password) passwordRef.current?.focus()
  }

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  // After the first submit attempt, re-check fields as the admin leaves them.
  function handleBlur() {
    if (attempted) setFieldErrors(validateLoginForm(values))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const errors = validateLoginForm(values)
    setAttempted(true)
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(errors)
      return
    }

    setSubmitting(true)
    try {
      // On success the session becomes authenticated and this page redirects.
      await login(values.email.trim(), values.password)
    } catch (error) {
      setSubmitting(false)

      if (error.status === 400 && error.details) {
        const serverErrors = {
          email: error.details.email,
          password: error.details.password,
        }
        setFieldErrors(serverErrors)
        focusFirstInvalid(serverErrors)
      } else if (error.status === 401) {
        setFormError(error.message)
        setValues((current) => ({ ...current, password: '' }))
        passwordRef.current?.focus()
      } else if (error.status === 429) {
        setFormError(error.message)
      } else {
        setFormError(NETWORK_ERROR)
      }
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-svh flex-col items-center justify-center gap-6 bg-surface-muted px-4 py-12"
    >
      <p className="text-lg font-extrabold tracking-tight text-ink uppercase">
        {SITE_NAME}
      </p>

      <div className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to manage NIST FC content.
        </p>

        {sessionExpired && (
          <p
            role="status"
            className="mt-6 flex gap-2 rounded-sm border border-border bg-surface-muted px-4 py-3 text-sm text-ink"
          >
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Your session has expired. Please sign in again.
          </p>
        )}

        {formError && (
          <p
            role="alert"
            className="mt-6 flex gap-2 rounded-sm border border-ink bg-surface-muted px-4 py-3 text-sm font-medium text-ink"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {formError}
          </p>
        )}

        <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <TextField
            ref={emailRef}
            id="email"
            label="Email"
            type="email"
            autoComplete="username"
            autoFocus
            required
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldErrors.email}
          />
          <TextField
            ref={passwordRef}
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldErrors.password}
          />
          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>

      <Link to="/" className="text-sm font-semibold text-ink-muted hover:text-ink">
        Back to website
      </Link>
    </main>
  )
}

export default Login
