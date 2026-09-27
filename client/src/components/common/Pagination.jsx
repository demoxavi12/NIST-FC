import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

// Pages to show: first, last, and one either side of the current page.
function visiblePages(page, pages) {
  const shown = new Set([1, pages, page - 1, page, page + 1])
  const list = [...shown].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b)

  const withGaps = []
  list.forEach((value, index) => {
    if (index > 0 && value - list[index - 1] > 1) withGaps.push(`gap-${value}`)
    withGaps.push(value)
  })
  return withGaps
}

const itemClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-3 text-sm font-semibold'

/**
 * Page links (no infinite scroll, docs/UI_DESIGN.md §94). `getHref(page)`
 * builds each link, so pages are shareable URLs.
 */
function Pagination({ page, pages, getHref, label = 'Pagination' }) {
  if (pages <= 1) return null

  return (
    <nav aria-label={label} className="flex justify-center">
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          {page > 1 ? (
            <Link to={getHref(page - 1)} className={`${itemClass} text-ink hover:bg-surface-muted`}>
              <ChevronLeft aria-hidden="true" className="size-4" />
              Previous
            </Link>
          ) : (
            <span aria-disabled="true" className={`${itemClass} text-ink-muted opacity-50`}>
              <ChevronLeft aria-hidden="true" className="size-4" />
              Previous
            </span>
          )}
        </li>

        {visiblePages(page, pages).map((value) =>
          typeof value === 'string' ? (
            <li key={value} aria-hidden="true" className="px-1 text-ink-muted">
              …
            </li>
          ) : (
            <li key={value}>
              <Link
                to={getHref(value)}
                aria-label={`Page ${value}`}
                aria-current={value === page ? 'page' : undefined}
                className={`${itemClass} ${
                  value === page ? 'bg-primary text-on-dark' : 'text-ink hover:bg-surface-muted'
                }`}
              >
                {value}
              </Link>
            </li>
          ),
        )}

        <li>
          {page < pages ? (
            <Link to={getHref(page + 1)} className={`${itemClass} text-ink hover:bg-surface-muted`}>
              Next
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span aria-disabled="true" className={`${itemClass} text-ink-muted opacity-50`}>
              Next
              <ChevronRight aria-hidden="true" className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default Pagination
