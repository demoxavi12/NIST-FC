import { createBrowserRouter } from 'react-router'
import RouteError from '../components/common/RouteError'
import AdminLayout from '../layouts/AdminLayout/AdminLayout'
import PublicLayout from '../layouts/PublicLayout/PublicLayout'
import RootLayout from '../layouts/RootLayout/RootLayout'
import NotFound from '../pages/NotFound/NotFound'

import About from '../pages/public/About/About'
import Founders from '../pages/public/Founders/Founders'
import Home from '../pages/public/Home/Home'
import Memories from '../pages/public/Memories/Memories'
import MemoryDetail from '../pages/public/MemoryDetail/MemoryDetail'
import PlayerProfile from '../pages/public/PlayerProfile/PlayerProfile'
import Players from '../pages/public/Players/Players'
import Timeline from '../pages/public/Timeline/Timeline'

import Dashboard from '../pages/admin/Dashboard/Dashboard'
import AdminFounderForm from '../pages/admin/Founders/AdminFounderForm'
import AdminFounders from '../pages/admin/Founders/AdminFounders'
import Login from '../pages/admin/Login/Login'
import AdminMemories from '../pages/admin/Memories/AdminMemories'
import AdminMemoryForm from '../pages/admin/Memories/AdminMemoryForm'
import AdminPlayerForm from '../pages/admin/Players/AdminPlayerForm'
import AdminPlayers from '../pages/admin/Players/AdminPlayers'
import AdminTimeline from '../pages/admin/Timeline/AdminTimeline'
import AdminTimelineForm from '../pages/admin/Timeline/AdminTimelineForm'

/**
 * Complete V1 route table (docs/SITE_MAP.md §19).
 *
 * Admin routes are unprotected until authentication is added in Phase 3.
 * Form pages serve both `new` and `:id/edit`; the `key` gives each route its
 * own component instance so form state never carries over between them.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'players', element: <Players /> },
          { path: 'players/:slug', element: <PlayerProfile /> },
          { path: 'memories', element: <Memories /> },
          { path: 'memories/:slug', element: <MemoryDetail /> },
          { path: 'timeline', element: <Timeline /> },
          { path: 'founders', element: <Founders /> },
          { path: 'about', element: <About /> },
          { path: '*', element: <NotFound /> },
        ],
      },
      { path: 'admin/login', element: <Login /> },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Dashboard /> },

          { path: 'players', element: <AdminPlayers /> },
          { path: 'players/new', element: <AdminPlayerForm key="new" /> },
          { path: 'players/:id/edit', element: <AdminPlayerForm key="edit" /> },

          { path: 'memories', element: <AdminMemories /> },
          { path: 'memories/new', element: <AdminMemoryForm key="new" /> },
          { path: 'memories/:id/edit', element: <AdminMemoryForm key="edit" /> },

          { path: 'timeline', element: <AdminTimeline /> },
          { path: 'timeline/new', element: <AdminTimelineForm key="new" /> },
          { path: 'timeline/:id/edit', element: <AdminTimelineForm key="edit" /> },

          { path: 'founders', element: <AdminFounders /> },
          { path: 'founders/new', element: <AdminFounderForm key="new" /> },
          { path: 'founders/:id/edit', element: <AdminFounderForm key="edit" /> },

          {
            path: '*',
            element: <NotFound backTo="/admin" backLabel="Back to dashboard" />,
          },
        ],
      },
    ],
  },
])
