import { Outlet } from 'react-router'
import SkipLink from '../../components/common/SkipLink'
import Footer from '../../components/layout/Footer'
import Navbar from '../../components/layout/Navbar'
import useMenuState from '../../hooks/useMenuState'

// Tailwind `md` breakpoint: desktop navigation replaces the mobile menu.
const DESKTOP_NAV_QUERY = '(min-width: 48rem)'

function PublicLayout() {
  const menu = useMenuState(DESKTOP_NAV_QUERY)

  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <Navbar menu={menu} />
      {/* While the mobile menu is open, the page behind it is not interactive. */}
      <main
        id="main-content"
        tabIndex={-1}
        inert={menu.isOpen}
        className="flex-1 focus:outline-none"
      >
        <Outlet />
      </main>
      <Footer inert={menu.isOpen} />
    </div>
  )
}

export default PublicLayout
