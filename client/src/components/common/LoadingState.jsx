import { Loader2 } from 'lucide-react'

/**
 * Announced loading indicator (docs/UI_DESIGN.md §57). The spinner stops for
 * users who prefer reduced motion (index.css); the text always remains.
 * `fullPage` renders it as the page's <main> (e.g. while checking a session).
 */
function LoadingState({ label = 'Loading…', fullPage = false }) {
  const content = (
    <div role="status" className="flex items-center gap-3 text-sm font-medium text-ink-muted">
      <Loader2 aria-hidden="true" className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  )

  if (!fullPage) return content

  return (
    <main
      id="main-content"
      className="flex min-h-svh items-center justify-center bg-surface-muted px-4"
    >
      {content}
    </main>
  )
}

export default LoadingState
