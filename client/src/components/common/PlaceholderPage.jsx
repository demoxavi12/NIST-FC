import usePageMeta from '../../hooks/usePageMeta'
import Container from './Container'

const TONES = {
  light: {
    section: 'bg-surface',
    eyebrow: 'text-accent',
    muted: 'text-ink-muted',
    border: 'border-border',
  },
  dark: {
    section: 'surface-dark',
    eyebrow: 'text-on-dark-muted',
    muted: 'text-on-dark-muted',
    border: 'border-on-dark-border',
  },
}

function RouteDetails({ route, params, className, borderClass }) {
  const rows = [['Route', route], ...Object.entries(params)]

  return (
    <dl className={`grid max-w-xl text-sm ${className}`}>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className={`flex gap-4 border-t py-3 last:border-b ${borderClass}`}
        >
          <dt className="w-16 shrink-0 font-semibold capitalize">{label}</dt>
          <dd className="min-w-0 break-all">
            <code className="font-mono">{value}</code>
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Temporary Phase 1 page that identifies its route. Every placeholder is
 * replaced by the real page in the phase named by `phase`.
 *
 * `documentTitle` defaults to `title`; pass `null` for the site default title.
 */
function PlaceholderPage({
  title,
  documentTitle = title,
  route,
  description,
  phase,
  params = {},
  tone = 'light',
  variant = 'public',
}) {
  usePageMeta({
    title: documentTitle ?? undefined,
    noindex: variant === 'admin',
  })

  const eyebrow = phase ? `Placeholder · ${phase}` : 'Placeholder'

  if (variant === 'admin') {
    return (
      <div>
        <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p>
        )}
        <RouteDetails
          route={route}
          params={params}
          className="mt-6"
          borderClass="border-border"
        />
      </div>
    )
  }

  const styles = TONES[tone]

  return (
    <section className={styles.section} aria-labelledby="page-title">
      <Container className="py-16 md:py-24">
        <p
          className={`text-xs font-semibold tracking-widest uppercase ${styles.eyebrow}`}
        >
          {eyebrow}
        </p>
        <h1
          id="page-title"
          className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl"
        >
          {title}
        </h1>
        {description && (
          <p className={`mt-4 max-w-2xl text-lg ${styles.muted}`}>
            {description}
          </p>
        )}
        <RouteDetails
          route={route}
          params={params}
          className="mt-10"
          borderClass={styles.border}
        />
      </Container>
    </section>
  )
}

export default PlaceholderPage
