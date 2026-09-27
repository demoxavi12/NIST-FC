import api from './api'

// Drops empty values so they are not sent as query parameters.
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

/** GET /api/players — resolves to `{ players, pagination, filters }`. */
export async function listPlayers(params = {}, { signal } = {}) {
  const { data } = await api.get('/players', { params: cleanParams(params), signal })
  return { players: data.data, pagination: data.pagination, filters: data.filters }
}

/** GET /api/players/:slug — resolves to `{ player, memories }`. */
export async function getPlayerBySlug(slug, { signal } = {}) {
  const { data } = await api.get(`/players/${encodeURIComponent(slug)}`, { signal })
  return data.data
}

/** GET /api/admin/players/:id — admin only. */
export async function getPlayerById(id, { signal } = {}) {
  const { data } = await api.get(`/admin/players/${encodeURIComponent(id)}`, { signal })
  return data.data.player
}

/** POST /api/players — `formData` includes the required `photo` file. */
export async function createPlayer(formData, { onUploadProgress } = {}) {
  const { data } = await api.post('/players', formData, { onUploadProgress })
  return data.data.player
}

/**
 * PATCH /api/players/:id — `body` is FormData (with a new photo) or a plain
 * object of changed fields (e.g. `{ status: 'former' }`).
 */
export async function updatePlayer(id, body, { onUploadProgress } = {}) {
  const { data } = await api.patch(`/players/${encodeURIComponent(id)}`, body, {
    onUploadProgress,
  })
  return data.data.player
}

/** DELETE /api/players/:id — permanent. */
export async function deletePlayer(id) {
  await api.delete(`/players/${encodeURIComponent(id)}`)
}
