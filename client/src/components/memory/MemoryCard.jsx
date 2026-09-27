import { Link } from 'react-router'
import { cloudinaryImageUrl, cloudinarySrcSet } from '../../utils/cloudinaryImage'
import { formatMemoryDate, toDateValue } from '../../utils/formatDate'

// Landscape 3:2 covers; a card is the full width on phones, half on tablets
// and a third on desktop.
const ASPECT = 2 / 3
const WIDTHS = [400, 600, 800, 1200]
const SIZES = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'

/**
 * A memory in a list (docs/UI_DESIGN.md §31–§32): cover, title, date,
 * optional location and a short description. The whole card is clickable.
 */
function MemoryCard({ memory, headingLevel = 'h3' }) {
  const { title, slug, date, location, excerpt, coverImage } = memory
  const Heading = headingLevel

  return (
    <article className="group relative">
      <div className="aspect-[3/2] overflow-hidden rounded-md bg-surface-muted">
        <img
          src={cloudinaryImageUrl(coverImage.url, { width: 800, height: 800 * ASPECT })}
          srcSet={cloudinarySrcSet(coverImage.url, WIDTHS, ASPECT)}
          sizes={SIZES}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3">
        <p className="text-sm text-ink-muted">
          <time dateTime={toDateValue(date)}>{formatMemoryDate(date)}</time>
          {location && <span> • {location}</span>}
        </p>
        <Heading className="mt-1 text-lg leading-snug font-bold text-ink">
          {/* The stretched link makes the whole card clickable. */}
          <Link
            to={`/memories/${slug}`}
            className="after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
          >
            {title}
          </Link>
        </Heading>
        {excerpt && <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{excerpt}</p>}
      </div>
    </article>
  )
}

export default MemoryCard
