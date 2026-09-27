import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { PLAYER_POSITIONS } from '../../constants/players'
import Button from '../common/Button'
import SearchInput from '../common/SearchInput'
import SelectField from '../common/SelectField'

// Keeps the selected value listed even if no player currently has it (e.g. an
// older shared link), so the dropdown never silently shows the wrong choice.
const toOptions = (values, selected) =>
  (selected && !values.includes(selected) ? [selected, ...values] : values).map((value) => ({
    value,
    label: value,
  }))

/**
 * Search and filters for the public Players page (docs/UI_DESIGN.md §26–§28).
 * On mobile the filters sit behind a "Filters" toggle; from `md` they are
 * always visible. `filters` holds the batch and branch values that exist.
 */
function PlayerFilters({ values, filters, onChange, onClear }) {
  const [open, setOpen] = useState(false)
  const activeCount = ['position', 'batch', 'branch'].filter((name) => values[name]).length
  const hasActive = activeCount > 0 || Boolean(values.search)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <SearchInput
          id="player-search"
          label="Search players"
          placeholder="Search players…"
          value={values.search}
          onSearch={(search) => onChange('search', search)}
          className="flex-1"
        />
        <Button
          variant="secondary"
          aria-expanded={open}
          aria-controls="player-filter-panel"
          onClick={() => setOpen((current) => !current)}
          className="md:hidden"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filters{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </div>

      <div
        id="player-filter-panel"
        className={`${open ? 'grid' : 'hidden'} gap-3 sm:grid-cols-3 md:grid md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center`}
      >
        <SelectField
          id="filter-position"
          label="Position"
          hideLabel
          placeholder="All positions"
          options={toOptions(PLAYER_POSITIONS)}
          value={values.position}
          onChange={(event) => onChange('position', event.target.value)}
        />
        <SelectField
          id="filter-batch"
          label="Batch"
          hideLabel
          placeholder="All batches"
          options={toOptions(filters.batches, values.batch)}
          value={values.batch}
          onChange={(event) => onChange('batch', event.target.value)}
        />
        <SelectField
          id="filter-branch"
          label="Branch"
          hideLabel
          placeholder="All branches"
          options={toOptions(filters.branches, values.branch)}
          value={values.branch}
          onChange={(event) => onChange('branch', event.target.value)}
        />
        {hasActive && (
          <Button variant="secondary" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}

export default PlayerFilters
