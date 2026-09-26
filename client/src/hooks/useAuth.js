import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * The admin session:
 * `{ status, admin, sessionEnd, sessionExpired, login, logout, retry }`.
 * status: 'loading' | 'authenticated' | 'unauthenticated' | 'error'.
 */
export default function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}
