import { isRouteErrorResponse, useRouteError } from 'react-router'
import usePageMeta from '../../hooks/usePageMeta'
import ButtonLink from './ButtonLink'
import Container from './Container'

/** Router-level error boundary: a useful message instead of a blank page. */
function RouteError() {
  const error = useRouteError()
  usePageMeta({ title: 'Something went wrong', noindex: true })

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error?.message

  return (
    <main
      id="main-content"
      className="flex min-h-svh items-center bg-surface-muted py-16"
    >
      <Container>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Something went wrong.
        </h1>
        <p className="mt-3 text-lg text-ink-muted">Please try again.</p>
        {import.meta.env.DEV && detail && (
          <pre className="mt-6 max-w-2xl overflow-x-auto rounded-sm border border-border bg-surface p-4 font-mono text-sm text-ink">
            {detail}
          </pre>
        )}
        <ButtonLink to="/" reloadDocument className="mt-8">
          Back to home
        </ButtonLink>
      </Container>
    </main>
  )
}

export default RouteError
