import { AlertTriangle } from 'lucide-react'
import Button from './Button'

/**
 * Error message with an optional Retry action (docs/UI_DESIGN.md §58).
 * `fullPage` renders it as the page's <main> with an <h1>.
 */
function ErrorState({
  title = 'Something went wrong.',
  message = 'Please try again.',
  onRetry,
  fullPage = false,
}) {
  const Heading = fullPage ? 'h1' : 'h2'

  const content = (
    <div role="alert" className="flex max-w-md flex-col items-center text-center">
      <AlertTriangle aria-hidden="true" className="size-8 text-ink-muted" />
      <Heading className="mt-4 text-xl font-bold tracking-tight text-ink">{title}</Heading>
      <p className="mt-2 text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-6">
          Try again
        </Button>
      )}
    </div>
  )

  if (!fullPage) return content

  return (
    <main
      id="main-content"
      className="flex min-h-svh items-center justify-center bg-surface-muted px-4 py-12"
    >
      {content}
    </main>
  )
}

export default ErrorState
