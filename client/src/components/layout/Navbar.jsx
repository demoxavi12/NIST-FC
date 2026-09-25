import { Menu, X } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { PUBLIC_NAV_LINKS } from '../../constants/navigation'
import { SITE_NAME } from '../../constants/site'
import Container from '../common/Container'

const MOBILE_MENU_ID = 'mobile-menu'

// Single active indicator: an accent underline (docs/UI_DESIGN.md §16).
const desktopLinkClass = ({ isActive }) =>
  `relative inline-flex h-16 items-center px-3 text-sm font-semibold text-ink transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:transition-colors ${
    isActive ? 'after:bg-accent' : 'after:bg-transparent hover:after:bg-border'
  }`

const mobileLinkClass = ({ isActive }) =>
  `flex min-h-12 items-center border-l-2 pl-4 text-lg font-semibold text-ink ${
    isActive ? 'border-accent' : 'border-transparent hover:border-border'
  }`

/**
 * Public site header. Horizontal navigation from `md`; below that a toggle
 * opens a full-height menu panel. Menu state is owned by PublicLayout so the
 * page behind can be made inert while the menu is open.
 */
function Navbar({ menu }) {
  const { isOpen, toggle, close, toggleRef } = menu

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <Container className="flex h-16 items-center justify-between">
        <Link
          to="/"
          onClick={close}
          className="text-lg font-extrabold tracking-tight text-ink uppercase"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center lg:gap-2">
            {PUBLIC_NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className={desktopLinkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          onClick={toggle}
          aria-label="Main menu"
          aria-expanded={isOpen}
          aria-controls={MOBILE_MENU_ID}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-sm text-ink hover:bg-surface-muted md:hidden"
        >
          {isOpen ? (
            <X aria-hidden="true" className="size-6" />
          ) : (
            <Menu aria-hidden="true" className="size-6" />
          )}
        </button>
      </Container>

      <nav
        id={MOBILE_MENU_ID}
        aria-label="Main"
        hidden={!isOpen}
        className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-border bg-surface md:hidden"
      >
        <Container as="ul" className="flex flex-col gap-1 py-6">
          {PUBLIC_NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                onClick={close}
                className={mobileLinkClass}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </Container>
      </nav>
    </header>
  )
}

export default Navbar
