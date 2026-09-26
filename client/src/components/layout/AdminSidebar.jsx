import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import {
  ADMIN_CONTENT_LINKS,
  ADMIN_DASHBOARD_LINK,
  ADMIN_SIDEBAR_ID,
} from '../../constants/navigation'
import useAuth from '../../hooks/useAuth'

const linkClass = ({ isActive }) =>
  `flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm font-semibold transition-colors ${
    isActive ? 'bg-secondary text-on-dark' : 'text-ink hover:bg-surface-muted'
  }`

function SidebarLink({ link, onNavigate }) {
  const Icon = link.icon
  return (
    <NavLink to={link.to} end={link.end} onClick={onNavigate} className={linkClass}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {link.label}
    </NavLink>
  )
}

/**
 * Ends the session. On success the route guard redirects to /admin/login.
 * If the request fails (network/5xx) the admin stays signed in — the session
 * cookie may still be valid — and an error is shown.
 */
function LogoutButton() {
  const { logout } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogout() {
    setPending(true)
    setError(null)
    try {
      await logout()
    } catch {
      setError("Couldn't log out. Please try again.")
      setPending(false)
    }
  }

  return (
    <div className="border-t border-border p-4">
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-60"
      >
        <LogOut aria-hidden="true" className="size-4 shrink-0" />
        {pending ? 'Logging out…' : 'Log out'}
      </button>
      {error && (
        <p role="alert" className="mt-2 px-3 text-sm font-medium text-ink">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Admin navigation (docs/UI_DESIGN.md §47–§48). A fixed column from `lg`;
 * below that it is a full-height panel opened from the top bar.
 * Logout is pinned to the bottom.
 */
function AdminSidebar({ isOpen, onNavigate }) {
  return (
    <aside
      id={ADMIN_SIDEBAR_ID}
      className={`${
        isOpen ? 'fixed inset-x-0 top-14 bottom-0 z-30 flex overflow-y-auto' : 'hidden'
      } flex-col border-r border-border bg-surface lg:sticky lg:top-14 lg:flex lg:h-[calc(100svh-3.5rem)] lg:w-60 lg:shrink-0`}
    >
      <nav aria-label="Admin" className="flex flex-1 flex-col gap-6 p-4">
        <SidebarLink link={ADMIN_DASHBOARD_LINK} onNavigate={onNavigate} />

        <div>
          <p
            id="admin-nav-content"
            className="px-3 text-xs font-semibold tracking-widest text-ink-muted uppercase"
          >
            Content
          </p>
          <ul aria-labelledby="admin-nav-content" className="mt-2 flex flex-col gap-1">
            {ADMIN_CONTENT_LINKS.map((link) => (
              <li key={link.to}>
                <SidebarLink link={link} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <LogoutButton />
    </aside>
  )
}

export default AdminSidebar
