import { Flag, Images, LayoutDashboard, Milestone, Users } from 'lucide-react'

// Public navbar and footer (docs/SITE_MAP.md §3). "Team" points to /players.
export const PUBLIC_NAV_LINKS = [
  { label: 'Home', to: '/', end: true },
  { label: 'Team', to: '/players' },
  { label: 'Memories', to: '/memories' },
  { label: 'Timeline', to: '/timeline' },
  { label: 'Founders', to: '/founders' },
  { label: 'About', to: '/about' },
]

// Admin sidebar (docs/UI_DESIGN.md §48).
export const ADMIN_SIDEBAR_ID = 'admin-sidebar'

export const ADMIN_DASHBOARD_LINK = {
  label: 'Dashboard',
  to: '/admin',
  end: true,
  icon: LayoutDashboard,
}

export const ADMIN_CONTENT_LINKS = [
  { label: 'Players', to: '/admin/players', icon: Users },
  { label: 'Memories', to: '/admin/memories', icon: Images },
  { label: 'Timeline', to: '/admin/timeline', icon: Milestone },
  { label: 'Founders', to: '/admin/founders', icon: Flag },
]
