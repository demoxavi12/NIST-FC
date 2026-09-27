/** Placeholder with the shape of a PlayerCard while players load (UI_DESIGN §57). */
function PlayerCardSkeleton() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="aspect-[4/5] rounded-md bg-surface-muted" />
      <div className="mt-3 h-4 w-16 rounded-sm bg-surface-muted" />
      <div className="mt-3 h-5 w-3/4 rounded-sm bg-surface-muted" />
      <div className="mt-2 h-4 w-1/2 rounded-sm bg-surface-muted" />
    </div>
  )
}

export default PlayerCardSkeleton
