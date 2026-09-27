import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router'
import Container from '../../../components/common/Container'
import ErrorState from '../../../components/common/ErrorState'
import LoadingState from '../../../components/common/LoadingState'
import MemoryGallery from '../../../components/memory/MemoryGallery'
import MemoryNav from '../../../components/memory/MemoryNav'
import MemoryPlayers from '../../../components/memory/MemoryPlayers'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import { getMemoryBySlug } from '../../../services/memoryService'
import { cloudinaryImageUrl, cloudinarySrcSet } from '../../../utils/cloudinaryImage'
import { formatMemoryDate, toDateValue } from '../../../utils/formatDate'
import NotFound from '../../NotFound/NotFound'

const COVER_ASPECT = 9 / 16
const DESCRIPTION_LENGTH = 155

function describeMemory(memory) {
  if (!memory) return undefined
  const text = memory.description.replace(/\s+/g, ' ').trim()
  if (!text) return `${memory.title} — a NIST FC memory from ${formatMemoryDate(memory.date)}.`
  return text.length > DESCRIPTION_LENGTH ? `${text.slice(0, DESCRIPTION_LENGTH - 1)}…` : text
}

/**
 * /memories/:slug — one memory with its gallery (docs/SITE_MAP.md §8,
 * UI_DESIGN §33–§37). Drafts are not returned by the API, so they show the
 * not-found page.
 */
function MemoryDetail() {
  const { slug } = useParams()
  const { loading, data, error, reload } = useApiRequest(
    ({ signal }) => getMemoryBySlug(slug, { signal }),
    slug,
  )
  const memory = data?.memory

  usePageMeta({
    title: memory?.title ?? (error?.status === 404 ? 'Memory not found' : 'Memory'),
    description: describeMemory(memory),
    noindex: error?.status === 404,
  })

  if (error?.status === 404) return <NotFound backTo="/memories" backLabel="Back to memories" />

  return (
    <Container className="py-8 md:py-12">
      <Link
        to="/memories"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All memories
      </Link>

      {error ? (
        <div className="py-12">
          <ErrorState title="Unable to load this memory." message="Please try again." onRetry={reload} />
        </div>
      ) : loading ? (
        <div className="flex justify-center py-24">
          <LoadingState label="Loading memory…" />
        </div>
      ) : (
        <>
          <article className="mt-6">
            <header className="max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">{memory.title}</h1>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-base text-ink-muted">
                <p className="flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  <time dateTime={toDateValue(memory.date)}>{formatMemoryDate(memory.date)}</time>
                </p>
                {memory.location && (
                  <p className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="size-4" />
                    <span className="sr-only">Location:</span>
                    {memory.location}
                  </p>
                )}
              </div>
            </header>

            <div className="mt-8 aspect-video overflow-hidden rounded-md bg-surface-muted">
              <img
                src={cloudinaryImageUrl(memory.coverImage.url, { width: 1280, height: 1280 * COVER_ASPECT })}
                srcSet={cloudinarySrcSet(memory.coverImage.url, [640, 960, 1280, 1600], COVER_ASPECT)}
                sizes="(min-width: 1280px) 1216px, 100vw"
                alt={`Cover photo for ${memory.title}`}
                className="size-full object-cover"
              />
            </div>

            {memory.description && (
              // Plain text: line breaks are kept, HTML is never rendered.
              <p className="mt-8 max-w-prose text-lg leading-relaxed whitespace-pre-line text-ink">
                {memory.description}
              </p>
            )}

            {memory.photos.length > 0 && (
              <section className="mt-12" aria-labelledby="memory-gallery">
                <h2 id="memory-gallery" className="text-2xl font-bold tracking-tight text-ink">
                  Gallery <span className="text-base font-semibold text-ink-muted">({memory.photos.length})</span>
                </h2>
                <div className="mt-6">
                  <MemoryGallery photos={memory.photos} title={memory.title} />
                </div>
              </section>
            )}

            <div className="mt-12 flex flex-col gap-10">
              <MemoryPlayers players={memory.players} />

              {memory.tags.length > 0 && (
                <section aria-labelledby="memory-tags">
                  <h2 id="memory-tags" className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
                    Tags
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {memory.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          to={`/memories?tag=${encodeURIComponent(tag)}`}
                          aria-label={`Memories tagged ${tag}`}
                          className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-ink hover:bg-surface-muted"
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </article>

          <div className="mt-16 border-t border-border pt-8">
            <MemoryNav previous={data.previous} next={data.next} />
          </div>
        </>
      )}
    </Container>
  )
}

export default MemoryDetail
