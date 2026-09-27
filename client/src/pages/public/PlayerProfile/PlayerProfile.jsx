import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import Container from '../../../components/common/Container'
import ErrorState from '../../../components/common/ErrorState'
import LoadingState from '../../../components/common/LoadingState'
import StatusBadge from '../../../components/common/StatusBadge'
import useApiRequest from '../../../hooks/useApiRequest'
import usePageMeta from '../../../hooks/usePageMeta'
import { getPlayerBySlug } from '../../../services/playerService'
import { cloudinaryImageUrl, cloudinarySrcSet } from '../../../utils/cloudinaryImage'
import NotFound from '../../NotFound/NotFound'

const ASPECT = 5 / 4
const DESCRIPTION_LENGTH = 155

function describePlayer(player) {
  if (!player) return undefined
  // Meta descriptions are a single line.
  const bio = player.bio?.replace(/\s+/g, ' ').trim()
  if (!bio) return `${player.name} — ${player.position} at NIST FC, batch ${player.batch}.`
  return bio.length > DESCRIPTION_LENGTH ? `${bio.slice(0, DESCRIPTION_LENGTH - 1)}…` : bio
}

/**
 * /players/:slug — an individual player (docs/SITE_MAP.md §6, UI_DESIGN
 * §23–§24). Memories involving the player are shown once memories exist
 * (Phase 5); the API already returns the (currently empty) list.
 */
function PlayerProfile() {
  const { slug } = useParams()
  const { loading, data, error, reload } = useApiRequest(
    ({ signal }) => getPlayerBySlug(slug, { signal }),
    slug,
  )
  const player = data?.player

  usePageMeta({
    title: player?.name ?? (error?.status === 404 ? 'Player not found' : 'Player'),
    description: describePlayer(player),
    noindex: error?.status === 404,
  })

  if (error?.status === 404) return <NotFound backTo="/players" backLabel="Back to players" />

  return (
    <Container className="py-8 md:py-12">
      <Link
        to="/players"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All players
      </Link>

      {error ? (
        <div className="py-12">
          <ErrorState title="Unable to load this player." message="Please try again." onRetry={reload} />
        </div>
      ) : loading ? (
        <div className="flex justify-center py-24">
          <LoadingState label="Loading player…" />
        </div>
      ) : (
        <article className="mt-6 grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
          <div className="aspect-[4/5] overflow-hidden rounded-md bg-surface-muted">
            <img
              src={cloudinaryImageUrl(player.photo.url, { width: 720, height: 720 * ASPECT })}
              srcSet={cloudinarySrcSet(player.photo.url, [360, 540, 720, 960], ASPECT)}
              sizes="(min-width: 768px) 40vw, 100vw"
              alt={`${player.name} — NIST FC ${player.position.toLowerCase()}`}
              className="size-full object-cover"
            />
          </div>

          <div className="md:pt-4">
            <StatusBadge status={player.status} />
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              {player.name}
            </h1>
            <p className="mt-3 text-xl font-semibold text-ink">{player.position}</p>
            <p className="mt-1 text-lg text-ink-muted">
              Batch {player.batch} • {player.branch}
            </p>

            {player.bio && (
              <section className="mt-8" aria-labelledby="player-bio">
                <h2 id="player-bio" className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
                  Biography
                </h2>
                {/* Plain text: line breaks are kept, HTML is never rendered. */}
                <p className="mt-3 max-w-prose text-base leading-relaxed whitespace-pre-line text-ink">
                  {player.bio}
                </p>
              </section>
            )}
          </div>
        </article>
      )}
    </Container>
  )
}

export default PlayerProfile
