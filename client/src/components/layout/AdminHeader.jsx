import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Link } from 'react-router'
import { ADMIN_SIDEBAR_ID } from '../../constants/navigation'
import { SITE_NAME } from '../../constants/site'
import useAuth from '../../hooks/useAuth'

/**
 * Admin top bar. Shows the signed-in admin from `md`; below `lg` it also
 * toggles the sidebar panel.
 */
function AdminHeader({ menu }) {
  const { isOpen, toggle, close, toggleRef } = menu
  const { admin } = useAuth()

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

      <div className="flex items-center gap-6">
        {admin && (
          <p className="hidden min-w-0 truncate text-sm text-on-dark-muted md:block">
            Signed in as <span className="font-semibold text-on-dark">{admin.name}</span>
          </p>
        )}
        <Link
          to="/"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-on-dark-muted hover:text-on-dark"
        >
          View site
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </header>
  )
}

export default AdminHeader
