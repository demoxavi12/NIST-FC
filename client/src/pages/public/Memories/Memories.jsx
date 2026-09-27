import { useSearchParams } from 'react-router'
import Button from '../../../components/common/Button'
import Container from '../../../components/common/Container'
import EmptyState from '../../../components/common/EmptyState'
import ErrorState from '../../../components/common/ErrorState'
import Pagination from '../../../components/common/Pagination'
import MemoryCard from '../../../components/memory/MemoryCard'
import MemoryCardSkeleton from '../../../components/memory/MemoryCardSkeleton'
import { PUBLIC_PAGE_SIZE, TAG_MAX_LENGTH } from '../../../constants/memories'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import { listMemories } from '../../../services/memoryService'

const OBJECT_ID = /^[a-f\d]{24}$/i

function MemoryGrid({ children }) {
  return <ul className="grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">{children}</ul>
}

/**
 * /memories — the visual archive, latest to oldest (docs/SITE_MAP.md §7,
 * UI_DESIGN §31). The page, and a tag or player filter reached from a memory
 * or a player profile, live in the URL.
 */
function Memories() {
  usePageMeta({
    title: 'Memories',
    description: 'The visual archive of NIST FC — matches, tournaments, celebrations and moments, from the latest to the oldest.',
  })

  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  // Values the API would reject in a hand-edited URL are ignored.
  const rawTag = (searchParams.get('tag') ?? '').trim().toLowerCase()
  const tag = rawTag.length <= TAG_MAX_LENGTH ? rawTag : ''
  const rawPlayer = searchParams.get('player') ?? ''
  const player = OBJECT_ID.test(rawPlayer) ? rawPlayer : ''

  const params = { page, limit: PUBLIC_PAGE_SIZE, tag, player }
  const { loading, data, error, reload } = useApiRequest(
    ({ signal }) => listMemories(params, { signal }),
    JSON.stringify(params),
  )

  function pageHref(target) {
    const next = new URLSearchParams(searchParams)
    if (target > 1) next.set('page', String(target))
    else next.delete('page')
    const query = next.toString()
    return query ? `?${query}` : '?'
  }

  const filtered = Boolean(tag || player)

  return (
    <>
      <section className="border-b border-border bg-surface" aria-labelledby="memories-title">
        <Container className="py-12 md:py-16">
          <h1 id="memories-title" className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            Memories
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">
            Moments that shaped NIST FC.
          </p>
        </Container>
      </section>

      <Container className="py-8 md:py-12">
        {filtered && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-surface-muted px-4 py-3">
            <p className="text-sm font-medium text-ink">
              {tag ? (
                <>
                  Showing memories tagged <span className="font-bold">“{tag}”</span>
                </>
              ) : (
                'Showing memories featuring the selected player'
              )}
            </p>
            <Button to="/memories" variant="secondary">
              Show all memories
            </Button>
          </div>
        )}

        <p role="status" className="sr-only">
          {loading
            ? 'Loading memories…'
            : data
              ? `${data.pagination.total} ${data.pagination.total === 1 ? 'memory' : 'memories'} found`
              : ''}
        </p>

        {error ? (
          <ErrorState title="Unable to load memories." message="Please try again." onRetry={reload} />
        ) : loading ? (
          <MemoryGrid>
            {Array.from({ length: 6 }, (_, index) => (
              <li key={index}>
                <MemoryCardSkeleton />
              </li>
            ))}
          </MemoryGrid>
        ) : data.memories.length === 0 ? (
          <EmptyState
            title="No memories found."
            message={filtered ? 'No memories match this filter.' : 'Memories will appear here once they are added.'}
          >
            {filtered && (
              <Button to="/memories" variant="secondary">
                Show all memories
              </Button>
            )}
          </EmptyState>
        ) : (
          <>
            <h2 className="sr-only">Memories, latest first</h2>
            <MemoryGrid>
              {data.memories.map((memory) => (
                <li key={memory.id}>
                  <MemoryCard memory={memory} />
                </li>
              ))}
            </MemoryGrid>
            <div className="mt-12">
              <Pagination page={data.pagination.page} pages={data.pagination.pages} getHref={pageHref} />
            </div>
          </>
        )}
      </Container>
    </>
  )
}

export default Memories
