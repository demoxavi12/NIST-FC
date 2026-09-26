import { Navigate, Outlet, useLocation } from 'react-router'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import useAuth from '../hooks/useAuth'

/**
 * Guards the admin area (docs/AUTH.md §49). This is user experience only —
 * the API remains the authoritative security layer.
 *
 * - Checking the session: loading state (the admin shell is not shown yet).
 * - Not signed in / session expired: redirect to /admin/login, remembering
 *   the requested page so the admin returns to it after signing in.
 * - After an explicit logout: redirect without remembering the page.
 * - Session check failed (network/5xx): error with Retry, not a redirect.
 */
function RequireAuth() {
  const { status, sessionEnd, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <LoadingState fullPage label="Checking your session…" />
  }

  if (status === 'error') {
    return (
      <ErrorState
        fullPage
        title="Unable to verify your session"
        message="The server could not be reached. Please try again."
        onRetry={retry}
      />
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={sessionEnd === 'logout' ? undefined : { from: location }}
      />
    )
  }

  return <Outlet />
}

export default RequireAuth
