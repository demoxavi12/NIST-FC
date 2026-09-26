import { useEffect, useState } from 'react'
import { setSessionExpiredHandler } from '../services/api'
import * as authService from '../services/authService'
import { AuthContext } from './AuthContext'

const SIGNED_OUT = { status: 'unauthenticated', admin: null, sessionEnd: null }

/**
 * Admin session state (docs/AUTH.md §48–§52). Wraps only the admin routes, so
 * public pages never call the API for auth.
 *
 * The session is restored once, when the admin area is entered, from
 * GET /api/auth/me — the HTTP-only cookie is never read by JavaScript and
 * nothing is stored in localStorage/sessionStorage.
 *
 * `sessionEnd` records why a session ended ('logout' | 'expired') so the
 * route guard and login page can respond appropriately.
 */
function AuthProvider({ children }) {
  const [session, setSession] = useState({
    status: 'loading',
    admin: null,
    sessionEnd: null,
  })
  const [checkId, setCheckId] = useState(0)

  // Restore the session. A 401 means "not signed in"; anything else (network
  // failure, 5xx) is an error with Retry rather than a redirect to login.
  useEffect(() => {
    const controller = new AbortController()

    authService
      .getCurrentAdmin({ signal: controller.signal })
      .then((admin) => {
        if (controller.signal.aborted) return
        setSession({ status: 'authenticated', admin, sessionEnd: null })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setSession(
          error.status === 401
            ? SIGNED_OUT
            : { status: 'error', admin: null, sessionEnd: null },
        )
      })

    return () => controller.abort()
  }, [checkId])

  // A protected request returned 401: the session expired mid-use.
  useEffect(
    () =>
      setSessionExpiredHandler(() => {
        setSession((current) =>
          current.status === 'authenticated'
            ? { ...SIGNED_OUT, sessionEnd: 'expired' }
            : current,
        )
      }),
    [],
  )

  async function login(email, password) {
    const admin = await authService.login(email, password)
    setSession({ status: 'authenticated', admin, sessionEnd: null })
    return admin
  }

  /**
   * Ends the session. A 401 means it had already expired, which is still a
   * successful logout. Network/5xx errors are rethrown and the admin stays
   * signed in, because the cookie may still be valid.
   */
  async function logout() {
    try {
      await authService.logout()
    } catch (error) {
      if (error.status !== 401) throw error
    }
    setSession({ ...SIGNED_OUT, sessionEnd: 'logout' })
  }

  function retry() {
    setSession({ status: 'loading', admin: null, sessionEnd: null })
    setCheckId((id) => id + 1)
  }

  const value = {
    ...session,
    sessionExpired: session.sessionEnd === 'expired',
    login,
    logout,
    retry,
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

export default AuthProvider
