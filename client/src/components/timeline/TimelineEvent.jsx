import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { CATEGORY_LABELS } from '../../constants/timeline'
import { cloudinaryImageUrl, cloudinarySrcSet } from '../../utils/cloudinaryImage'
import { formatMemoryDate, toDateValue } from '../../utils/formatDate'

const ASPECT = 9 / 16
const WIDTHS = [400, 600, 800]
const SIZES = '(min-width: 1024px) 40vw, 100vw'

/**
 * One event on the public timeline (docs/UI_DESIGN.md §40–§41): a strong
 * year, the exact date when known, the category as text, title, description,
 * an optional image and — only when a published memory is linked — a link to
 * it. Without a memory there is no link at all.
 */
function TimelineEvent({ event }) {
  const { title, year, date, description, image, category, memory } = event

  return (
    <article className="rounded-md border border-border bg-surface p-5 shadow-sm md:p-6">
      <p className="text-3xl leading-none font-extrabold tracking-tight text-ink">{year}</p>
      <p className="mt-2 text-sm text-ink-muted">
        <span className="font-semibold tracking-widest uppercase">
          <span className="sr-only">Category: </span>
          {CATEGORY_LABELS[category] ?? category}
        </span>
        {date && (
          <>
            {' • '}
            <time dateTime={toDateValue(date)}>{formatMemoryDate(date)}</time>
          </>
        )}
      </p>
      <h2 className="mt-3 text-xl leading-snug font-bold text-ink">{title}</h2>
      {image && (
        <div className="mt-4 aspect-video overflow-hidden rounded-sm bg-surface-muted">
          <img
            src={cloudinaryImageUrl(image.url, { width: 800, height: 800 * ASPECT })}
            srcSet={cloudinarySrcSet(image.url, WIDTHS, ASPECT)}
            sizes={SIZES}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </div>
      )}
      {description && (
        // Plain text: line breaks are kept, HTML is never rendered.
        <p className="mt-4 text-base leading-relaxed whitespace-pre-line text-ink">{description}</p>
      )}
      {memory && (
        <Link
          to={`/memories/${memory.slug}`}
          aria-label={`View memory: ${memory.title}`}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-strong"
        >
          View memory
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </article>
  )
}

export default TimelineEvent
