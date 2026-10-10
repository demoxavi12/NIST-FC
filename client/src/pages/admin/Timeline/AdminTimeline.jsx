import { ArrowDown, ArrowUp, Eye, EyeOff, ListOrdered, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import Button from '../../../components/common/Button'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import EmptyState from '../../../components/common/EmptyState'
import ErrorState from '../../../components/common/ErrorState'
import LoadingState from '../../../components/common/LoadingState'
import SelectField from '../../../components/common/SelectField'
import StatusBadge from '../../../components/common/StatusBadge'
import { PUBLISHED_FILTERS } from '../../../constants/memories'
import { CATEGORY_LABELS } from '../../../constants/timeline'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import useUnsavedChanges from '../../../hooks/useUnsavedChanges'
import {
  deleteTimelineEvent,
  listAdminTimeline,
  reorderTimeline,
  updateTimelineEvent,
} from '../../../services/timelineService'

const actionClass =
  'inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-sm font-semibold transition-colors'

function PublishedBadge({ event }) {
  return <StatusBadge status={event.published ? 'Published' : 'Draft'} />
}

/** The linked memory, labelled when it is a draft (not linked publicly). */
function LinkedMemory({ memory }) {
  if (!memory) return <span className="text-ink-muted">None</span>
  return (
    <span>
      {memory.title}
      {!memory.published && <StatusBadge status="Draft" className="ml-2" />}
    </span>
  )
}

// Each accessible name starts with the visible text; the title adds context.
function RowActions({ event, onTogglePublish, onDelete }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Link
        to={`/admin/timeline/${event.id}/edit`}
        aria-label={`Edit ${event.title}`}
        className={`${actionClass} text-ink hover:bg-surface-muted`}
      >
        <Pencil aria-hidden="true" className="size-4" />
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onTogglePublish(event)}
        aria-label={`${event.published ? 'Unpublish' : 'Publish'} ${event.title}`}
        className={`${actionClass} text-ink hover:bg-surface-muted`}
      >
        {event.published ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        {event.published ? 'Unpublish' : 'Publish'}
      </button>
      <button
        type="button"
        onClick={() => onDelete(event)}
        aria-label={`Delete ${event.title}`}
        className={`${actionClass} text-danger hover:bg-surface-muted`}
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Delete
      </button>
    </div>
  )
}

/**
 * Accessible reordering (docs/UI_DESIGN.md §54): Move up / Move down buttons
 * change a local copy of the order, each move is announced, and Save order
 * sends the whole order in one request. Cancel restores the saved order.
 */
function ReorderPanel({ events, onSaved, onCancel }) {
  const [order, setOrder] = useState(events)
  const [announcement, setAnnouncement] = useState('')
  const [focusRequest, setFocusRequest] = useState(null) // { id, direction }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const dirty = order.some((event, index) => event.id !== events[index].id)
  const { blocker, allowNavigation } = useUnsavedChanges(dirty)

  // Keep focus on the button just used, which moves with its event. At the
  // top or bottom it stays focusable but inactive (aria-disabled), so
  // pressing it again never moves the event back the other way.
  useEffect(() => {
    if (!focusRequest) return
    document.getElementById(`move-${focusRequest.direction}-${focusRequest.id}`)?.focus()
  }, [focusRequest, order])

  function move(index, direction) {
    const target = direction === 'up' ? index - 1 : index + 1
    if (saving || target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
    setAnnouncement(`${next[target].title} moved to position ${target + 1} of ${next.length}.`)
    setFocusRequest({ id: next[target].id, direction })
    setError(null)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await reorderTimeline(order.map((event) => event.id))
      allowNavigation()
      onSaved()
    } catch (err) {
      setSaving(false)
      setError(
        err.status === 409
          ? 'The timeline was changed by someone else. Reload the page and reorder again.'
          : err.message || 'Something went wrong. Please try again.',
      )
    }
  }

  const moveButton =
    'inline-flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-ink hover:bg-surface-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-surface'

  return (
    <section aria-labelledby="reorder-title" className="mt-6">
      <h2 id="reorder-title" className="text-lg font-bold text-ink">
        Reorder events
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Move events up or down, then save. The public timeline shows events in this order.
      </p>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-sm border border-danger bg-surface px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <ol className="mt-4 flex flex-col gap-2">
        {order.map((event, index) => (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
          >
            <span className="w-8 shrink-0 text-center text-sm font-bold text-ink-muted">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{event.title}</span>
              <span className="block text-sm text-ink-muted">
                {event.year} • {CATEGORY_LABELS[event.category] ?? event.category}
                {!event.published && ' • Draft'}
              </span>
            </span>
            <button
              type="button"
              id={`move-up-${event.id}`}
              onClick={() => move(index, 'up')}
              aria-disabled={index === 0 || saving}
              aria-label={`Move ${event.title} up`}
              className={moveButton}
            >
              <ArrowUp aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              id={`move-down-${event.id}`}
              onClick={() => move(index, 'down')}
              aria-disabled={index === order.length - 1 || saving}
              aria-label={`Move ${event.title} down`}
              className={moveButton}
            >
              <ArrowDown aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save order'}
        </Button>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave without saving the order?"
        confirmLabel="Leave page"
        confirmVariant="danger"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Your new timeline order has not been saved and will be lost.
      </ConfirmDialog>
    </section>
  )
}

/**
 * /admin/timeline — timeline management (docs/UI_DESIGN.md §54, §79–§80).
 * All events are listed in display order (no pagination). Unpublishing hides
 * an event; deletion is separate, permanent and visually distinct.
 */
function AdminTimeline() {
  usePageMeta({ title: 'Timeline', noindex: true })
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [flash, setFlash] = useState(() => location.state?.flash ?? null)
  const [confirm, setConfirm] = useState(null) // { type: 'publish' | 'delete', event }
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [reordering, setReordering] = useState(false)

  // Don't show the redirect message again after a reload.
  useEffect(() => {
    if (location.state?.flash) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  const filter = PUBLISHED_FILTERS.find((option) => option.value === searchParams.get('status'))
  const { loading, data, error, reload } = useApiRequest(
    ({ signal }) => listAdminTimeline({ published: filter?.published }, { signal }),
    filter?.value ?? 'all',
  )

  function openConfirm(type, event) {
    setActionError(null)
    setConfirm({ type, event })
  }

  async function handleConfirm() {
    const { type, event } = confirm
    setPending(true)
    setActionError(null)
    try {
      if (type === 'delete') {
        await deleteTimelineEvent(event.id)
        setFlash(`${event.title} was deleted.`)
      } else {
        await updateTimelineEvent(event.id, { published: !event.published })
        setFlash(event.published ? `${event.title} was unpublished.` : `${event.title} was published.`)
      }
      setConfirm(null)
      reload()
    } catch (err) {
      setActionError(
        err.status === 404
          ? 'This event no longer exists. The list has been refreshed.'
          : err.message || 'Something went wrong. Please try again.',
      )
      if (err.status === 404) reload()
    } finally {
      setPending(false)
    }
  }

  const target = confirm?.event
  const canReorder = !filter && data?.length > 1

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Timeline</h1>
        {!reordering && (
          <Button to="/admin/timeline/new">
            <Plus aria-hidden="true" className="size-4" />
            Add Event
          </Button>
        )}
      </div>

      {flash && (
        <div
          role="status"
          className="mt-6 flex items-start justify-between gap-3 rounded-sm border border-border bg-surface px-4 py-3 text-sm font-medium text-ink"
        >
          <p>{flash}</p>
          <button
            type="button"
            onClick={() => setFlash(null)}
            aria-label="Dismiss message"
            className="-m-2 inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-surface-muted"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}

      {reordering ? (
        <ReorderPanel
          events={data}
          onCancel={() => setReordering(false)}
          onSaved={() => {
            setReordering(false)
            setFlash('Timeline order saved.')
            reload()
          }}
        />
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SelectField
              id="admin-filter-published"
              label="Visibility"
              hideLabel
              placeholder="All events"
              options={PUBLISHED_FILTERS}
              value={filter?.value ?? ''}
              onChange={(event) => {
                const next = new URLSearchParams(searchParams)
                if (event.target.value) next.set('status', event.target.value)
                else next.delete('status')
                setSearchParams(next)
              }}
              className="sm:w-56"
            />
            <div className="flex flex-col gap-1 sm:items-end">
              <Button variant="secondary" onClick={() => setReordering(true)} disabled={!canReorder || loading}>
                <ListOrdered aria-hidden="true" className="size-4" />
                Reorder
              </Button>
              {filter && <p className="text-xs text-ink-muted">Show all events to reorder.</p>}
            </div>
          </div>

          <div className="mt-6">
            {error ? (
              <ErrorState title="Unable to load the timeline." message="Please try again." onRetry={reload} />
            ) : loading ? (
              <div className="flex justify-center py-16">
                <LoadingState label="Loading timeline…" />
              </div>
            ) : data.length === 0 ? (
              filter ? (
                <EmptyState title="No events found." message="Try a different visibility filter." />
              ) : (
                <EmptyState title="No timeline events added yet.">
                  <Button to="/admin/timeline/new">
                    <Plus aria-hidden="true" className="size-4" />
                    Add Event
                  </Button>
                </EmptyState>
              )
            ) : (
              <>
                <p className="mb-3 text-sm text-ink-muted">
                  {data.length} {data.length === 1 ? 'event' : 'events'}, in timeline order
                </p>

                {/* Desktop: table */}
                <div className="hidden overflow-x-auto rounded-md border border-border bg-surface lg:block">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Timeline events in display order</caption>
                    <thead className="border-b border-border bg-surface-muted text-xs tracking-wider text-ink-muted uppercase">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Event</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Year</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Memory</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Visibility</th>
                        <th scope="col" className="px-4 py-3 font-semibold">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.map((event, index) => (
                        <tr key={event.id}>
                          <td className="px-4 py-3 font-semibold text-ink-muted">{index + 1}</td>
                          <th scope="row" className="px-4 py-3 font-semibold text-ink">
                            <span className="line-clamp-2">{event.title}</span>
                          </th>
                          <td className="px-4 py-3 text-ink">{event.year}</td>
                          <td className="px-4 py-3 text-ink">{CATEGORY_LABELS[event.category] ?? event.category}</td>
                          <td className="px-4 py-3 text-ink">
                            <LinkedMemory memory={event.memory} />
                          </td>
                          <td className="px-4 py-3">
                            <PublishedBadge event={event} />
                          </td>
                          <td className="px-4 py-3">
                            <RowActions
                              event={event}
                              onTogglePublish={(e) => openConfirm('publish', e)}
                              onDelete={(e) => openConfirm('delete', e)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile and tablet: stacked cards (UI_DESIGN §79) */}
                <ul className="flex flex-col gap-3 lg:hidden">
                  {data.map((event, index) => (
                    <li key={event.id} className="rounded-md border border-border bg-surface p-4">
                      <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
                        #{index + 1} • {event.year} • {CATEGORY_LABELS[event.category] ?? event.category}
                      </p>
                      <p className="mt-1 font-semibold text-ink">{event.title}</p>
                      <p className="mt-1 text-sm text-ink">
                        <span className="text-ink-muted">Memory: </span>
                        <LinkedMemory memory={event.memory} />
                      </p>
                      <div className="mt-2">
                        <PublishedBadge event={event} />
                      </div>
                      <div className="mt-3 border-t border-border pt-2">
                        <RowActions
                          event={event}
                          onTogglePublish={(e) => openConfirm('publish', e)}
                          onDelete={(e) => openConfirm('delete', e)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirm?.type === 'publish'}
        title={target?.published ? 'Unpublish event?' : 'Publish event?'}
        confirmLabel={target?.published ? 'Unpublish' : 'Publish'}
        pending={pending}
        error={actionError}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      >
        {target?.published
          ? `${target?.title} will be hidden from the public timeline. It is kept and can be published again.`
          : `${target?.title} will appear on the public timeline.`}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="Delete timeline event?"
        confirmLabel="Delete permanently"
        confirmVariant="danger"
        pending={pending}
        error={actionError}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      >
        This will permanently delete {target?.title} and its image. The linked memory is not
        affected. This cannot be undone. To hide it instead, unpublish it.
      </ConfirmDialog>
    </div>
  )
}

export default AdminTimeline
