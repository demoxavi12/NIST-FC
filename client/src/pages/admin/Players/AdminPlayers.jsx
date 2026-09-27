import { Archive, ArchiveRestore, Pencil, Plus, Trash2, X } from 'lucide-react'
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
import { ADMIN_PAGE_SIZE, PLAYER_POSITIONS } from '../../../constants/players'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import { deletePlayer, listPlayers, updatePlayer } from '../../../services/playerService'
import { cloudinaryImageUrl } from '../../../utils/cloudinaryImage'

const STATUS_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'former', label: 'Former' },
]
const POSITION_OPTIONS = PLAYER_POSITIONS.map((value) => ({ value, label: value }))

const actionClass =
  'inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-sm font-semibold transition-colors'

function Thumbnail({ player }) {
  return (
    <img
      src={cloudinaryImageUrl(player.photo.url, { width: 96, height: 120 })}
      alt=""
      width="48"
      height="60"
      loading="lazy"
      className="h-15 w-12 shrink-0 rounded-sm bg-surface-muted object-cover"
    />
  )
}

function RowActions({ player, onArchive, onDelete }) {
  const isCurrent = player.status === 'current'
  return (
    <div className="flex flex-wrap gap-1">
      <Link
        to={`/admin/players/${player.id}/edit`}
        aria-label={`Edit ${player.name}`}
        className={`${actionClass} text-ink hover:bg-surface-muted`}
      >
        <Pencil aria-hidden="true" className="size-4" />
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onArchive(player)}
        aria-label={isCurrent ? `Mark ${player.name} as former` : `Mark ${player.name} as current`}
        className={`${actionClass} text-ink hover:bg-surface-muted`}
      >
        {isCurrent ? (
          <Archive aria-hidden="true" className="size-4" />
        ) : (
          <ArchiveRestore aria-hidden="true" className="size-4" />
        )}
        {isCurrent ? 'Mark as former' : 'Mark as current'}
      </button>
      <button
        type="button"
        onClick={() => onDelete(player)}
        aria-label={`Delete ${player.name}`}
        className={`${actionClass} text-danger hover:bg-surface-muted`}
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Delete
      </button>
    </div>
  )
}

/**
 * /admin/players — player management (docs/UI_DESIGN.md §50, §79–§80).
 * Marking a player as former keeps them in the archive; deletion is separate,
 * permanent and visually distinct (CLAUDE.md §44).
 */
function AdminPlayers() {
  usePageMeta({ title: 'Players', noindex: true })
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Success message passed from the form after a redirect (or set here).
  const [flash, setFlash] = useState(() => location.state?.flash ?? null)
  const [confirm, setConfirm] = useState(null) // { type: 'status' | 'delete', player }
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Don't show the redirect message again after a reload.
  useEffect(() => {
    if (location.state?.flash) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const position = searchParams.get('position') ?? ''
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const params = { search, status, position, page, limit: ADMIN_PAGE_SIZE }

  const { loading, data, error, reload } = useApiRequest(
    ({ signal }) => listPlayers(params, { signal }),
    JSON.stringify(params),
  )

  // After deleting the last player on a page, step back a page.
  useEffect(() => {
    if (data && data.players.length === 0 && page > 1) {
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

  function openConfirm(type, player) {
    setActionError(null)
    setConfirm({ type, player })
  }

  async function handleConfirm() {
    const { type, player } = confirm
    setPending(true)
    setActionError(null)
    try {
      if (type === 'delete') {
        await deletePlayer(player.id)
        setFlash(`${player.name} was deleted.`)
      } else {
        const nextStatus = player.status === 'current' ? 'former' : 'current'
        await updatePlayer(player.id, { status: nextStatus })
        setFlash(`${player.name} was marked as ${nextStatus}.`)
      }
      setConfirm(null)
      reload()
    } catch (err) {
      setActionError(
        err.status === 404
          ? 'This player no longer exists. The list has been refreshed.'
          : err.message || 'Something went wrong. Please try again.',
      )
      if (err.status === 404) reload()
    } finally {
      setPending(false)
    }
  }

  const hasFilters = Boolean(search || status || position)
  const target = confirm?.player
  const toFormer = target?.status === 'current'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Players</h1>
        <Button to="/admin/players/new">
          <Plus aria-hidden="true" className="size-4" />
          Add Player
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

      <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <SearchInput
          id="admin-player-search"
          label="Search players"
          placeholder="Search by name…"
          value={search}
          onSearch={(value) => updateParams({ search: value })}
        />
        <SelectField
          id="admin-filter-status"
          label="Status"
          hideLabel
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(event) => updateParams({ status: event.target.value })}
        />
        <SelectField
          id="admin-filter-position"
          label="Position"
          hideLabel
          placeholder="All positions"
          options={POSITION_OPTIONS}
          value={position}
          onChange={(event) => updateParams({ position: event.target.value })}
        />
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState title="Unable to load players." message="Please try again." onRetry={reload} />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <LoadingState label="Loading players…" />
          </div>
        ) : data.players.length === 0 ? (
          hasFilters ? (
            <EmptyState title="No players found." message="Try changing your search or filters." />
          ) : (
            <EmptyState title="No players added yet.">
              <Button to="/admin/players/new">
                <Plus aria-hidden="true" className="size-4" />
                Add Player
              </Button>
            </EmptyState>
          )
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-muted">
              {data.pagination.total} {data.pagination.total === 1 ? 'player' : 'players'}
            </p>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-md border border-border bg-surface md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Players</caption>
                <thead className="border-b border-border bg-surface-muted text-xs tracking-wider text-ink-muted uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Player</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Position</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Batch</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Branch</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.players.map((player) => (
                    <tr key={player.id}>
                      <th scope="row" className="px-4 py-3 font-semibold text-ink">
                        <div className="flex items-center gap-3">
                          <Thumbnail player={player} />
                          {player.name}
                        </div>
                      </th>
                      <td className="px-4 py-3 text-ink">{player.position}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink">{player.batch}</td>
                      <td className="px-4 py-3 text-ink">{player.branch}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={player.status} />
                      </td>
                      <td className="px-4 py-3">
                        <RowActions
                          player={player}
                          onArchive={(p) => openConfirm('status', p)}
                          onDelete={(p) => openConfirm('delete', p)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards (UI_DESIGN §79) */}
            <ul className="flex flex-col gap-3 md:hidden">
              {data.players.map((player) => (
                <li key={player.id} className="rounded-md border border-border bg-surface p-4">
                  <div className="flex gap-3">
                    <Thumbnail player={player} />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{player.name}</p>
                      <p className="text-sm text-ink-muted">
                        {player.position} • Batch {player.batch} • {player.branch}
                      </p>
                      <StatusBadge status={player.status} className="mt-2" />
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border pt-2">
                    <RowActions
                      player={player}
                      onArchive={(p) => openConfirm('status', p)}
                      onDelete={(p) => openConfirm('delete', p)}
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
        open={confirm?.type === 'status'}
        title={toFormer ? 'Mark player as former?' : 'Mark player as current?'}
        confirmLabel={toFormer ? 'Mark as former' : 'Mark as current'}
        pending={pending}
        error={actionError}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      >
        {toFormer
          ? `${target?.name} will remain in the historical archive as a former player.`
          : `${target?.name} will be shown as a current player again.`}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="Delete player?"
        confirmLabel="Delete permanently"
        confirmVariant="danger"
        pending={pending}
        error={actionError}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      >
        This will permanently remove {target?.name} and their photo. This cannot be undone. To keep
        them in the archive, mark them as former instead.
      </ConfirmDialog>
    </div>
  )
}

export default AdminPlayers
