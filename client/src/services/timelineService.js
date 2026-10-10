import api from './api'

/** GET /api/timeline — every published event in display order. */
export async function listTimeline({ signal } = {}) {
  const { data } = await api.get('/timeline', { signal })
  return data.data
}

/** GET /api/admin/timeline — all events (drafts included) in display order. */
export async function listAdminTimeline(params = {}, { signal } = {}) {
  const query = params.published === undefined ? {} : { published: params.published }
  const { data } = await api.get('/admin/timeline', { params: query, signal })
  return data.data
}

/** GET /api/admin/timeline/:id — the event for the edit form. */
export async function getTimelineEventById(id, { signal } = {}) {
  const { data } = await api.get(`/admin/timeline/${encodeURIComponent(id)}`, { signal })
  return data.data.event
}

/** POST /api/timeline — FormData with an optional `image`. */
export async function createTimelineEvent(formData) {
  const { data } = await api.post('/timeline', formData)
  return data.data.event
}

/** PATCH /api/timeline/:id — FormData, or a plain object such as `{ published: true }`. */
export async function updateTimelineEvent(id, body) {
  const { data } = await api.patch(`/timeline/${encodeURIComponent(id)}`, body)
  return data.data.event
}

/** PATCH /api/timeline/reorder — every event with its new 1-based position. */
export async function reorderTimeline(ids) {
  await api.patch('/timeline/reorder', { items: ids.map((id, index) => ({ id, order: index + 1 })) })
}

/** DELETE /api/timeline/:id — permanent. */
export async function deleteTimelineEvent(id) {
  await api.delete(`/timeline/${encodeURIComponent(id)}`)
}
