/** Placeholder with the shape of a MemoryCard while memories load. */
function MemoryCardSkeleton() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="aspect-[3/2] rounded-md bg-surface-muted" />
      <div className="mt-3 h-4 w-32 rounded-sm bg-surface-muted" />
      <div className="mt-2 h-5 w-3/4 rounded-sm bg-surface-muted" />
      <div className="mt-2 h-4 w-full rounded-sm bg-surface-muted" />
    </div>
  )
}

export default MemoryCardSkeleton
