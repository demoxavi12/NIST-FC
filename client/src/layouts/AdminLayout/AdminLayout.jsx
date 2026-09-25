import { Outlet } from 'react-router'
import SkipLink from '../../components/common/SkipLink'
import AdminHeader from '../../components/layout/AdminHeader'
import AdminSidebar from '../../components/layout/AdminSidebar'
import useMenuState from '../../hooks/useMenuState'

// Tailwind `lg` breakpoint: the sidebar becomes a permanent column.
const DESKTOP_SIDEBAR_QUERY = '(min-width: 64rem)'

/**
 * Admin shell: top bar, sidebar and main content (docs/UI_DESIGN.md §47).
 * Unprotected until authentication is added in Phase 3.
 */
function AdminLayout() {
  const menu = useMenuState(DESKTOP_SIDEBAR_QUERY)

  return (
    <div className="flex min-h-svh flex-col bg-surface-muted">
      <SkipLink />
      <AdminHeader menu={menu} />
      <div className="flex flex-1">
        <AdminSidebar isOpen={menu.isOpen} onNavigate={menu.close} />
        <main
          id="main-content"
          tabIndex={-1}
          inert={menu.isOpen}
          className="min-w-0 flex-1 p-4 focus:outline-none md:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
