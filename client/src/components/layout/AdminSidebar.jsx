import { NavLink } from 'react-router'
import {
  ADMIN_CONTENT_LINKS,
  ADMIN_DASHBOARD_LINK,
  ADMIN_SIDEBAR_ID,
} from '../../constants/navigation'

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
 * Admin navigation (docs/UI_DESIGN.md §47–§48). A fixed column from `lg`;
 * below that it is a full-height panel opened from the top bar.
 * Logout is added with authentication in Phase 3.
 */
function AdminSidebar({ isOpen, onNavigate }) {
  return (
    <aside
      id={ADMIN_SIDEBAR_ID}
      className={`${
        isOpen ? 'fixed inset-x-0 top-14 bottom-0 z-30 block overflow-y-auto' : 'hidden'
      } border-r border-border bg-surface lg:sticky lg:top-14 lg:block lg:h-[calc(100svh-3.5rem)] lg:w-60 lg:shrink-0`}
    >
      <nav aria-label="Admin" className="flex flex-col gap-6 p-4">
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
    </aside>
  )
}

export default AdminSidebar
