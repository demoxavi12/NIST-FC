import api from './api'

// Drops empty values so they are not sent as query parameters.
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

/** GET /api/memories — published memories: `{ memories, pagination }`. */
export async function listMemories(params = {}, { signal } = {}) {
  const { data } = await api.get('/memories', { params: cleanParams(params), signal })
  return { memories: data.data, pagination: data.pagination }
}

/** GET /api/memories/:slug — `{ memory, previous, next }`. */
export async function getMemoryBySlug(slug, { signal } = {}) {
  const { data } = await api.get(`/memories/${encodeURIComponent(slug)}`, { signal })
  return data.data
}

/** GET /api/admin/memories — drafts included: `{ memories, pagination }`. */
export async function listAdminMemories(params = {}, { signal } = {}) {
  const { data } = await api.get('/admin/memories', { params: cleanParams(params), signal })
  return { memories: data.data, pagination: data.pagination }
}

/** GET /api/admin/memories/:id — the full memory for the edit form. */
export async function getMemoryById(id, { signal } = {}) {
  const { data } = await api.get(`/admin/memories/${encodeURIComponent(id)}`, { signal })
  return data.data.memory
}

/** POST /api/memories — `formData` includes the required `coverImage`. */
export async function createMemory(formData, { onUploadProgress } = {}) {
  const { data } = await api.post('/memories', formData, { onUploadProgress })
  return data.data.memory
}

/**
 * PATCH /api/memories/:id — FormData (with images) or a plain object of
 * changes (e.g. `{ published: true }`).
 */
export async function updateMemory(id, body, { onUploadProgress } = {}) {
  const { data } = await api.patch(`/memories/${encodeURIComponent(id)}`, body, { onUploadProgress })
  return data.data.memory
}

/** DELETE /api/memories/:id — permanent. */
export async function deleteMemory(id) {
  await api.delete(`/memories/${encodeURIComponent(id)}`)
}
