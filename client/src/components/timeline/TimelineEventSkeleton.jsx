/** Placeholder with the shape of a TimelineEvent card while the timeline loads. */
function TimelineEventSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-md border border-border bg-surface p-5 motion-safe:animate-pulse md:p-6">
      <div className="h-8 w-20 rounded-sm bg-surface-muted" />
      <div className="mt-3 h-4 w-32 rounded-sm bg-surface-muted" />
      <div className="mt-4 h-6 w-3/4 rounded-sm bg-surface-muted" />
      <div className="mt-4 h-4 w-full rounded-sm bg-surface-muted" />
      <div className="mt-2 h-4 w-5/6 rounded-sm bg-surface-muted" />
    </div>
  )
}

export default TimelineEventSkeleton
