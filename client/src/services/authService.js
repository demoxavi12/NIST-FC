import api from './api'

// A 401 from these endpoints is a normal answer ("not signed in", "wrong
// password"), not an expired session.
const AUTH_REQUEST = { skipSessionExpiry: true }

/** POST /api/auth/login — resolves to the admin; sets the HTTP-only cookie. */
export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password }, AUTH_REQUEST)
  return data.data.admin
}

/** GET /api/auth/me — resolves to the admin for the current session cookie. */
export async function getCurrentAdmin({ signal } = {}) {
  const { data } = await api.get('/auth/me', { ...AUTH_REQUEST, signal })
  return data.data.admin
}

/** POST /api/auth/logout — the server clears the cookie. */
export async function logout() {
  await api.post('/auth/logout', null, AUTH_REQUEST)
}
