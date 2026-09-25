import { Link } from 'react-router'
import { PUBLIC_NAV_LINKS } from '../../constants/navigation'
import { SITE_NAME, SITE_TAGLINE } from '../../constants/site'
import Container from '../common/Container'

/**
 * Dark site footer (docs/UI_DESIGN.md §45).
 * Social links are intentionally absent until the official NIST FC accounts
 * are confirmed; do not add placeholder URLs.
 */
function Footer(props) {
  const year = new Date().getFullYear()

  return (
    <footer className="surface-dark" {...props}>
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-xl font-extrabold tracking-tight uppercase">
              {SITE_NAME}
            </p>
            <p className="mt-3 max-w-sm text-sm text-on-dark-muted">
              {SITE_TAGLINE}
            </p>
          </div>

          <nav aria-labelledby="footer-nav-heading">
            <h2
              id="footer-nav-heading"
              className="text-xs font-semibold tracking-widest text-on-dark-muted uppercase"
            >
              Navigation
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
              {PUBLIC_NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex min-h-10 items-center text-sm hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-12 border-t border-on-dark-border pt-6 text-sm text-on-dark-muted">
          © {year} {SITE_NAME}
        </p>
      </Container>
    </footer>
  )
}

export default Footer
