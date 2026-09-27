import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage'
import { formatMemoryDate } from '../../utils/formatDate'

function NavLink({ memory, direction }) {
  const older = direction === 'older'
  const Icon = older ? ArrowLeft : ArrowRight
  return (
    <Link
      to={`/memories/${memory.slug}`}
      className={`group flex min-h-11 items-center gap-3 rounded-md border border-border p-3 hover:bg-surface-muted ${
        older ? '' : 'sm:flex-row-reverse sm:text-right'
      }`}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
      <img
        src={cloudinaryImageUrl(memory.coverImage.url, { width: 128, height: 96 })}
        alt=""
        loading="lazy"
        className="h-12 w-16 shrink-0 rounded-sm object-cover"
      />
      <span className="min-w-0">
        <span className="block text-xs font-semibold tracking-widest text-ink-muted uppercase">
          {older ? 'Older memory' : 'Newer memory'}
        </span>
        <span className="block truncate font-semibold text-ink">{memory.title}</span>
        <span className="block text-sm text-ink-muted">{formatMemoryDate(memory.date)}</span>
      </span>
    </Link>
  )
}

/**
 * Chronological navigation at the end of a memory (UI_DESIGN §36):
 * `previous` is the next older memory, `next` the next newer one.
 */
function MemoryNav({ previous, next }) {
  if (!previous && !next) return null
  return (
    <nav aria-label="More memories" className="grid gap-3 sm:grid-cols-2">
      <div>{previous && <NavLink memory={previous} direction="older" />}</div>
      <div>{next && <NavLink memory={next} direction="newer" />}</div>
    </nav>
  )
}

export default MemoryNav
