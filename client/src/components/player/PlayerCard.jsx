import { Link } from 'react-router'
import { cloudinaryImageUrl, cloudinarySrcSet } from '../../utils/cloudinaryImage'
import StatusBadge from '../common/StatusBadge'

// Portrait 4:5 photos; a card is roughly half the viewport on phones and a
// quarter on desktop.
const ASPECT = 5 / 4
const WIDTHS = [240, 360, 480, 720]
const SIZES = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw'

/**
 * Roster card linking to the player's profile (docs/UI_DESIGN.md §21–§22).
 * Used on the Players page (and later the Home page).
 */
function PlayerCard({ player }) {
  const { name, slug, photo, position, batch, branch, status } = player

  return (
    <article className="group relative">
      <div className="aspect-[4/5] overflow-hidden rounded-md bg-surface-muted">
        <img
          src={cloudinaryImageUrl(photo.url, { width: 480, height: 480 * ASPECT })}
          srcSet={cloudinarySrcSet(photo.url, WIDTHS, ASPECT)}
          sizes={SIZES}
          alt={`${name} — NIST FC ${position.toLowerCase()}`}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3">
        <StatusBadge status={status} />
        <h3 className="mt-2 text-base leading-snug font-bold text-ink">
          {/* The stretched link makes the whole card clickable. */}
          <Link
            to={`/players/${slug}`}
            className="after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
          >
            {name}
          </Link>
        </h3>
        <p className="text-sm text-ink-muted">{position}</p>
        <p className="text-sm text-ink-muted">
          Batch {batch} • {branch}
        </p>
      </div>
    </article>
  )
}

export default PlayerCard
