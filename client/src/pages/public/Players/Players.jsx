import { useSearchParams } from 'react-router'
import Container from '../../../components/common/Container'
import EmptyState from '../../../components/common/EmptyState'
import ErrorState from '../../../components/common/ErrorState'
import Pagination from '../../../components/common/Pagination'
import PlayerCard from '../../../components/player/PlayerCard'
import PlayerCardSkeleton from '../../../components/player/PlayerCardSkeleton'
import PlayerFilters from '../../../components/player/PlayerFilters'
import Button from '../../../components/common/Button'
import {
  BATCH_PATTERN,
  PLAYER_POSITIONS,
  PLAYER_STATUS_TABS,
  PUBLIC_PAGE_SIZE,
} from '../../../constants/players'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import { listPlayers } from '../../../services/playerService'

const FILTER_KEYS = ['search', 'position', 'batch', 'branch']
const NO_FILTERS = { batches: [], branches: [] }

/**
 * /players — the player directory (docs/SITE_MAP.md §5, UI_DESIGN §26–§29).
 * Search, filters, status and page live in the URL so results are shareable
 * and the Back button works.
 */
function Players() {
  usePageMeta({
    title: 'Our Players',
    description: 'Meet the current and former players of NIST FC, the football team of NIST University.',
  })

  const [searchParams, setSearchParams] = useSearchParams()
  // Unknown values in a hand-edited URL fall back to "no filter".
  const requestedStatus = searchParams.get('status')
  const status = PLAYER_STATUS_TABS.some((tab) => tab.value === requestedStatus)
    ? requestedStatus
    : 'current'
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const values = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? '']))
  if (!PLAYER_POSITIONS.includes(values.position)) values.position = ''
  if (!BATCH_PATTERN.test(values.batch)) values.batch = ''

  const params = {
    ...values,
    status: status === 'all' ? '' : status,
    page,
    limit: PUBLIC_PAGE_SIZE,
  }
  const { loading, data, error, reload, lastData } = useApiRequest(
    ({ signal }) => listPlayers(params, { signal }),
    JSON.stringify(params),
  )

  // Any change other than paging returns to page 1.
  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete('page')
    setSearchParams(next)
  }

  function clearFilters() {
    updateParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])))
  }

  function pageHref(target) {
    const next = new URLSearchParams(searchParams)
    if (target > 1) next.set('page', String(target))
    else next.delete('page')
    const query = next.toString()
    return query ? `?${query}` : '?'
  }

  const hasFilters = FILTER_KEYS.some((key) => values[key])
  const filters = (data ?? lastData)?.filters ?? NO_FILTERS

  return (
    <>
      <section className="border-b border-border bg-surface" aria-labelledby="players-title">
        <Container className="py-12 md:py-16">
          <h1 id="players-title" className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            Our Players
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">
            Meet the players who represent NIST FC.
          </p>
        </Container>
      </section>

      <Container className="py-8 md:py-12">
        <div role="group" aria-label="Player status" className="mb-6 flex flex-wrap gap-2">
          {PLAYER_STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={status === tab.value}
              onClick={() => updateParams({ status: tab.value === 'current' ? '' : tab.value })}
              className={`min-h-11 rounded-sm border px-4 text-sm font-semibold transition-colors ${
                status === tab.value
                  ? 'border-primary bg-primary text-on-dark'
                  : 'border-border bg-surface text-ink hover:bg-surface-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <PlayerFilters
          values={values}
          filters={filters}
          onChange={(name, value) => updateParams({ [name]: value })}
          onClear={clearFilters}
        />

        <p role="status" className="sr-only">
          {loading
            ? 'Loading players…'
            : data
              ? `${data.pagination.total} ${data.pagination.total === 1 ? 'player' : 'players'} found`
              : ''}
        </p>

        <div className="mt-8">
          {error ? (
            <ErrorState title="Unable to load players." message="Please try again." onRetry={reload} />
          ) : loading ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {Array.from({ length: 8 }, (_, index) => (
                <li key={index}>
                  <PlayerCardSkeleton />
                </li>
              ))}
            </ul>
          ) : data.players.length === 0 ? (
            <EmptyState
              title="No players found."
              message={hasFilters ? 'Try changing your search or filters.' : 'There are no players to show here yet.'}
            >
              {hasFilters && (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </EmptyState>
          ) : (
            <>
              <h2 className="sr-only">Players</h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
                {data.players.map((player) => (
                  <li key={player.id}>
                    <PlayerCard player={player} />
                  </li>
                ))}
              </ul>
              <div className="mt-12">
                <Pagination page={data.pagination.page} pages={data.pagination.pages} getHref={pageHref} />
              </div>
            </>
          )}
        </div>
      </Container>
    </>
  )
}

export default Players
