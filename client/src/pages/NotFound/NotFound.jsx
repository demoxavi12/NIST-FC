import ButtonLink from '../../components/common/ButtonLink'
import Container from '../../components/common/Container'
import usePageMeta from '../../hooks/usePageMeta'

/** 404 page, rendered inside the public or admin layout. */
function NotFound({ backTo = '/', backLabel = 'Back to home' }) {
  usePageMeta({ title: 'Page not found', noindex: true })

  return (
    <section aria-labelledby="not-found-title">
      <Container className="py-16 md:py-24">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">
          404
        </p>
        <h1
          id="not-found-title"
          className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl"
        >
          Page not found.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <ButtonLink to={backTo} className="mt-8">
          {backLabel}
        </ButtonLink>
      </Container>
    </section>
  )
}

export default NotFound
