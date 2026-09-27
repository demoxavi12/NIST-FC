import { Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import Button from '../../../components/common/Button'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import EmptyState from '../../../components/common/EmptyState'
import ErrorState from '../../../components/common/ErrorState'
import LoadingState from '../../../components/common/LoadingState'
import Pagination from '../../../components/common/Pagination'
import SearchInput from '../../../components/common/SearchInput'
import SelectField from '../../../components/common/SelectField'
import StatusBadge from '../../../components/common/StatusBadge'
import { ADMIN_PAGE_SIZE, PUBLISHED_FILTERS } from '../../../constants/memories'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import { deleteMemory, listAdminMemories, updateMemory } from '../../../services/memoryService'
import { cloudinaryImageUrl } from '../../../utils/cloudinaryImage'
import { formatMemoryDate, toDateValue } from '../../../utils/formatDate'

const actionClass =
  'inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-sm font-semibold transition-colors'

function Thumbnail({ memory }) {
  return (
    <img
      src={cloudinaryImageUrl(memory.coverImage.url, { width: 144, height: 96 })}
      alt=""
      width="72"
      height="48"
      loading="lazy"
      className="h-12 w-18 shrink-0 rounded-sm bg-surface-muted object-cover"
    />
  )
}

function PublishedBadge({ memory }) {
  return <StatusBadge status={memory.published ? 'Published' : 'Draft'} />
}

function MemoryDate({ memory }) {
  return <time dateTime={toDateValue(memory.date)}>{formatMemoryDate(memory.date)}</time>
}

// Each accessible name starts with the visible text; the title adds context.
function RowActions({ memory, onTogglePublish, onDelete }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Link
        to={`/admin/memories/${memory.id}/edit`}
        aria-label={`Edit ${memory.title}`}
        className={`${actionClass} text-ink hover:bg-surface-muted`}
      >
        <Pencil aria-hidden="true" className="size-4" />
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onTogglePublish(memory)}
        aria-label={`${memory.published ? 'Unpublish' : 'Publish'} ${memory.title}`}
        className={`${actionClass} text-ink hover:bg-surface-muted`}
      >
        {memory.published ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
        {memory.published ? 'Unpublish' : 'Publish'}
      </button>
      <button
        type="button"
        onClick={() => onDelete(memory)}
        aria-label={`Delete ${memory.title}`}
        className={`${actionClass} text-danger hover:bg-surface-muted`}
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Delete
      </button>
    </div>
  )
}

/**
 * /admin/memories — memory management (docs/UI_DESIGN.md §50, §79–§80).
 * Unpublishing hides a memory from the public site; deletion is separate,
 * permanent and visually distinct (CLAUDE.md §44).
 */
function AdminMemories() {
  usePageMeta({ title: 'Memories', noindex: true })
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [flash, setFlash] = useState(() => location.state?.flash ?? null)
  const [confirm, setConfirm] = useState(null) // { type: 'publish' | 'delete', memory }
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Don't show the redirect message again after a reload.
  useEffect(() => {
    if (location.state?.flash) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  const search = searchParams.get('search') ?? ''
  const filter = PUBLISHED_FILTERS.find((option) => option.value === searchParams.get('status'))
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const params = { search, published: filter?.published, page, limit: ADMIN_PAGE_SIZE }

  const { loading, data, error, reload } = useApiRequest(
    ({ signal }) => listAdminMemories(params, { signal }),
    JSON.stringify(params),
  )

  // After deleting the last memory on a page, step back a page.
  useEffect(() => {
    if (data && data.memories.length === 0 && page > 1) {
      const next = new URLSearchParams(searchParams)
      next.set('page', String(Math.min(page - 1, Math.max(1, data.pagination.pages))))
      setSearchParams(next, { replace: true })
    }
  }, [data, page, searchParams, setSearchParams])

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete('page')
    setSearchParams(next)
  }

  function pageHref(target) {
    const next = new URLSearchParams(searchParams)
    if (target > 1) next.set('page', String(target))
    else next.delete('page')
    return `?${next.toString()}`
  }

  function openConfirm(type, memory) {
    setActionError(null)
    setConfirm({ type, memory })
  }

  async function handleConfirm() {
    const { type, memory } = confirm
    setPending(true)
    setActionError(null)
    try {
      if (type === 'delete') {
        await deleteMemory(memory.id)
        setFlash(`${memory.title} was deleted.`)
      } else {
        await updateMemory(memory.id, { published: !memory.published })
        setFlash(memory.published ? `${memory.title} was unpublished.` : `${memory.title} was published.`)
      }
      setConfirm(null)
      reload()
    } catch (err) {
      setActionError(
        err.status === 404
          ? 'This memory no longer exists. The list has been refreshed.'
          : err.message || 'Something went wrong. Please try again.',
      )
      if (err.status === 404) reload()
    } finally {
      setPending(false)
    }
  }

  const hasFilters = Boolean(search || filter)
  const target = confirm?.memory

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Memories</h1>
        <Button to="/admin/memories/new">
          <Plus aria-hidden="true" className="size-4" />
          Add Memory
        </Button>
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

      <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SearchInput
          id="admin-memory-search"
          label="Search memories"
          placeholder="Search by title…"
          value={search}
          onSearch={(value) => updateParams({ search: value })}
        />
        <SelectField
          id="admin-filter-published"
          label="Visibility"
          hideLabel
          placeholder="All memories"
          options={PUBLISHED_FILTERS}
          value={filter?.value ?? ''}
          onChange={(event) => updateParams({ status: event.target.value })}
        />
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState title="Unable to load memories." message="Please try again." onRetry={reload} />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <LoadingState label="Loading memories…" />
          </div>
        ) : data.memories.length === 0 ? (
          hasFilters ? (
            <EmptyState title="No memories found." message="Try changing your search or filter." />
          ) : (
            <EmptyState title="No memories added yet.">
              <Button to="/admin/memories/new">
                <Plus aria-hidden="true" className="size-4" />
                Add Memory
              </Button>
            </EmptyState>
          )
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-muted">
              {data.pagination.total} {data.pagination.total === 1 ? 'memory' : 'memories'}
            </p>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-md border border-border bg-surface lg:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Memories, latest first</caption>
                <thead className="border-b border-border bg-surface-muted text-xs tracking-wider text-ink-muted uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Memory</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Photos</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Visibility</th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.memories.map((memory) => (
                    <tr key={memory.id}>
                      <th scope="row" className="px-4 py-3 font-semibold text-ink">
                        <div className="flex items-center gap-3">
                          <Thumbnail memory={memory} />
                          <span className="line-clamp-2">{memory.title}</span>
                        </div>
                      </th>
                      <td className="px-4 py-3 whitespace-nowrap text-ink">
                        <MemoryDate memory={memory} />
                      </td>
                      <td className="px-4 py-3 text-ink">{memory.photoCount}</td>
                      <td className="px-4 py-3">
                        <PublishedBadge memory={memory} />
                      </td>
                      <td className="px-4 py-3">
                        <RowActions
                          memory={memory}
                          onTogglePublish={(m) => openConfirm('publish', m)}
                          onDelete={(m) => openConfirm('delete', m)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile and tablet: stacked cards (UI_DESIGN §79) */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {data.memories.map((memory) => (
                <li key={memory.id} className="rounded-md border border-border bg-surface p-4">
                  <div className="flex gap-3">
                    <Thumbnail memory={memory} />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{memory.title}</p>
                      <p className="text-sm text-ink-muted">
                        <MemoryDate memory={memory} /> • {memory.photoCount}{' '}
                        {memory.photoCount === 1 ? 'photo' : 'photos'}
                      </p>
                      <div className="mt-2">
                        <PublishedBadge memory={memory} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border pt-2">
                    <RowActions
                      memory={memory}
                      onTogglePublish={(m) => openConfirm('publish', m)}
                      onDelete={(m) => openConfirm('delete', m)}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Pagination page={data.pagination.page} pages={data.pagination.pages} getHref={pageHref} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirm?.type === 'publish'}
        title={target?.published ? 'Unpublish memory?' : 'Publish memory?'}
        confirmLabel={target?.published ? 'Unpublish' : 'Publish'}
        pending={pending}
        error={actionError}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      >
        {target?.published
          ? `${target?.title} will be hidden from the public site. It is kept and can be published again.`
          : `${target?.title} will be visible on the public site.`}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="Delete memory?"
        confirmLabel="Delete permanently"
        confirmVariant="danger"
        pending={pending}
        error={actionError}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      >
        This will permanently remove {target?.title}, its cover image and all of its gallery photos.
        This cannot be undone. To hide it instead, unpublish it.
      </ConfirmDialog>
    </div>
  )
}

export default AdminMemories
