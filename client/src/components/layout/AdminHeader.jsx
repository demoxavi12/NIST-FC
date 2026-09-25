import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Link } from 'react-router'
import { ADMIN_SIDEBAR_ID } from '../../constants/navigation'
import { SITE_NAME } from '../../constants/site'

/** Admin top bar. Below `lg` it also toggles the sidebar panel. */
function AdminHeader({ menu }) {
  const { isOpen, toggle, close, toggleRef } = menu

  return (
    <header className="surface-dark sticky top-0 z-40 flex h-14 items-center justify-between gap-4 px-4 md:px-6">
      <div className="flex items-center gap-2">
        <button
          ref={toggleRef}
          type="button"
          onClick={toggle}
          aria-label="Admin navigation"
          aria-expanded={isOpen}
          aria-controls={ADMIN_SIDEBAR_ID}
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm hover:bg-secondary lg:hidden"
        >
          {isOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
        <Link
          to="/admin"
          onClick={close}
          className="text-base font-extrabold tracking-tight uppercase"
        >
          {SITE_NAME}
          <span className="ml-2 text-xs font-semibold tracking-widest text-on-dark-muted">
            Admin
          </span>
        </Link>
      </div>

      <Link
        to="/"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-on-dark-muted hover:text-on-dark"
      >
        View site
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </header>
  )
}

export default AdminHeader
