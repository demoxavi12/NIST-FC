import { useState } from 'react'
import useApiRequest from '../../hooks/useApiRequest'
import { listAdminMemories } from '../../services/memoryService'
import { formatMemoryDate } from '../../utils/formatDate'
import FieldError from '../common/FieldError'
import LoadingState from '../common/LoadingState'
import SearchInput from '../common/SearchInput'

const RESULT_LIMIT = 20

function DraftLabel() {
  return (
    <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-xs font-semibold tracking-widest text-ink-muted uppercase">
      Draft
    </span>
  )
}

/**
 * Chooses the one memory a timeline event links to, or none. Searches all
 * memories by title, drafts included (labelled "Draft": a draft is linked
 * but not shown publicly until it is published). `selected` is
 * `{ id, title, published }` or null.
 */
function MemoryPicker({ id, selected, onChange, error }) {
  const [search, setSearch] = useState('')
  const { loading, data, error: loadError, reload } = useApiRequest(
    ({ signal }) => listAdminMemories({ search, limit: RESULT_LIMIT }, { signal }),
    search,
  )
  const errorId = `${id}-error`
  const name = `${id}-choice`
  // The selected memory stays choosable even when it is not in the results.
  const results = data?.memories ?? []
  const options = selected && !results.some((memory) => memory.id === selected.id) ? [selected, ...results] : results

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="text-sm font-semibold text-ink">Linked memory</legend>
      <p className="mt-1 text-sm text-ink-muted">
        Optional. Visitors see a “View memory” link only while the memory is published.
      </p>
      <p className="mt-2 text-sm text-ink">
        Selected:{' '}
        <span className="font-semibold">{selected ? selected.title : 'No memory'}</span>
        {selected && !selected.published && <DraftLabel />}
      </p>

      <SearchInput
        id={`${id}-search`}
        label="Search memories to link"
        placeholder="Search memories by title…"
        value={search}
        onSearch={setSearch}
        className="mt-3"
      />

      <div className="mt-2 max-h-72 overflow-y-auto rounded-sm border border-border">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-border px-3 py-2 hover:bg-surface-muted">
          <input
            type="radio"
            name={name}
            checked={!selected}
            onChange={() => onChange(null)}
            className="size-4 shrink-0 accent-primary"
          />
          <span className="text-sm font-semibold text-ink">No memory</span>
        </label>
        {loadError ? (
          <p className="flex flex-wrap items-center gap-2 p-3 text-sm text-ink-muted">
            Unable to load memories.
            <button type="button" onClick={reload} className="min-h-11 font-semibold text-accent hover:text-accent-strong">
              Try again
            </button>
          </p>
        ) : loading ? (
          <div className="p-3">
            <LoadingState label="Loading memories…" />
          </div>
        ) : options.length === 0 ? (
          <p className="p-3 text-sm text-ink-muted">No memories found.</p>
        ) : (
          <ul className="divide-y divide-border">
            {options.map((memory) => (
              <li key={memory.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-surface-muted">
                  <input
                    type="radio"
                    name={name}
                    checked={selected?.id === memory.id}
                    onChange={() => onChange({ id: memory.id, title: memory.title, published: memory.published })}
                    className="size-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 text-sm">
                    <span className="font-semibold text-ink">{memory.title}</span>
                    {memory.date && <span className="text-ink-muted"> • {formatMemoryDate(memory.date)}</span>}
                    {!memory.published && <DraftLabel />}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      {data?.pagination.total > RESULT_LIMIT && (
        <p className="mt-2 text-sm text-ink-muted">
          Showing {RESULT_LIMIT} of {data.pagination.total} memories. Search to find others.
        </p>
      )}

      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  )
}

export default MemoryPicker
