import { X } from 'lucide-react'
import { useState } from 'react'
import useApiRequest from '../../hooks/useApiRequest'
import { listPlayers } from '../../services/playerService'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage'
import FieldError from '../common/FieldError'
import LoadingState from '../common/LoadingState'
import SearchInput from '../common/SearchInput'

const RESULT_LIMIT = 20

/**
 * Chooses the players who appear in a memory: search current and former
 * players, tick them, and remove chosen ones from the chips above.
 * `selected` holds player summaries (`{ id, name, status, … }`).
 */
function PlayerPicker({ id, selected, onChange, error }) {
  const [search, setSearch] = useState('')
  const { loading, data, error: loadError, reload } = useApiRequest(
    ({ signal }) => listPlayers({ search, limit: RESULT_LIMIT }, { signal }),
    search,
  )
  const selectedIds = new Set(selected.map((player) => player.id))
  const errorId = `${id}-error`

  function toggle(player) {
    if (selectedIds.has(player.id)) onChange(selected.filter((item) => item.id !== player.id))
    else onChange([...selected, player])
  }

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="text-sm font-semibold text-ink">Players in this memory</legend>
      <p className="mt-1 text-sm text-ink-muted">Current and former players can be linked.</p>

      {selected.length > 0 && (
        <ul aria-label="Selected players" className="mt-3 flex flex-wrap gap-2">
          {selected.map((player) => (
            <li
              key={player.id}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-surface-muted py-0.5 pr-1 pl-3 text-sm font-semibold text-ink"
            >
              {player.name}
              <button
                type="button"
                onClick={() => toggle(player)}
                aria-label={`Remove ${player.name}`}
                className="inline-flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <SearchInput
        id={`${id}-search`}
        label="Search players to add"
        placeholder="Search players by name…"
        value={search}
        onSearch={setSearch}
        className="mt-3"
      />

      <div className="mt-2 max-h-72 overflow-y-auto rounded-sm border border-border">
        {loadError ? (
          <p className="flex flex-wrap items-center gap-2 p-3 text-sm text-ink-muted">
            Unable to load players.
            <button type="button" onClick={reload} className="min-h-11 font-semibold text-accent hover:text-accent-strong">
              Try again
            </button>
          </p>
        ) : loading ? (
          <div className="p-3">
            <LoadingState label="Loading players…" />
          </div>
        ) : data.players.length === 0 ? (
          <p className="p-3 text-sm text-ink-muted">No players found.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.players.map((player) => (
              <li key={player.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-surface-muted">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(player.id)}
                    onChange={() => toggle(player)}
                    className="size-4 shrink-0 accent-primary"
                  />
                  <img
                    src={cloudinaryImageUrl(player.photo.url, { width: 64, height: 64 })}
                    alt=""
                    loading="lazy"
                    className="size-8 shrink-0 rounded-full bg-surface-muted object-cover"
                  />
                  <span className="min-w-0 text-sm">
                    <span className="font-semibold text-ink">{player.name}</span>
                    <span className="text-ink-muted">
                      {' '}
                      • {player.position} • Batch {player.batch}
                      {player.status === 'former' && ' • Former'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      {data?.pagination.total > RESULT_LIMIT && (
        <p className="mt-2 text-sm text-ink-muted">
          Showing {RESULT_LIMIT} of {data.pagination.total} players. Search to find others.
        </p>
      )}

      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  )
}

export default PlayerPicker
