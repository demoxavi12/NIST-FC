import { Outlet, ScrollRestoration } from 'react-router'

/** Top-level route: restores scroll position on navigation for every page. */
function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}

export default RootLayout
