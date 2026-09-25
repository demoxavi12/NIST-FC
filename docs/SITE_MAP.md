# NIST FC — Site Map

## 1. Public Routes

/

├── /players
│ └── /players/:slug
│
├── /memories
│ └── /memories/:slug
│
├── /timeline
│
├── /founders
│
└── /about

## 2. Admin Routes

/admin/login

/admin
├── /admin/players
│ ├── /admin/players/new
│ └── /admin/players/:id/edit
│
├── /admin/memories
│ ├── /admin/memories/new
│ └── /admin/memories/:id/edit
│
├── /admin/timeline
│ ├── /admin/timeline/new
│ └── /admin/timeline/:id/edit
│
└── /admin/founders
├── /admin/founders/new
└── /admin/founders/:id/edit

## 3. Public Navigation

### Navbar

- NIST FC
- Home
- Team
- Memories
- Timeline
- Founders
- About

### Team

`Team` → `/players`

## 4. Home Page

Route:

`/`

Sections:

1. Hero
2. About NIST FC
3. Current Players
4. Latest Memories
5. Our Journey / Timeline Preview
6. Founders
7. Footer

## 5. Players

Route:

`/players`

Features:

- Player search
- Current / Former filter
- Position filter
- Batch filter
- Branch filter
- Player card grid

Each player card links to:

`/players/:slug`

## 6. Player Profile

Route:

`/players/:slug`

Displays:

- Player photo
- Name
- Position
- Batch
- Branch
- Bio
- Current / Former status
- Memories involving the player

## 7. Memories

Route:

`/memories`

Purpose:

A chronological visual archive of NIST FC.

Order:

`Latest → Oldest`

Features:

- Memory cards
- Cover photos
- Title
- Date
- Short description
- Chronological browsing

Each memory links to:

`/memories/:slug`

## 8. Memory Detail

Route:

`/memories/:slug`

Displays:

- Memory title
- Date
- Location
- Description
- Photo gallery
- Players involved
- Previous Memory
- Next Memory

Navigation allows visitors to explore the history chronologically.

## 9. Timeline

Route:

`/timeline`

Displays:

- Chronological NIST FC events
- Event date/year
- Event title
- Description
- Image
- Category
- Associated memory, when available

Timeline events can link to their associated memory.

Admins can manually reorder timeline events.

## 10. Founders

Route:

`/founders`

Displays:

- Founder photo
- Name
- Role
- Batch
- Branch
- Bio
- Quote

Admins can manage founder information and display order.

## 11. About

Route:

`/about`

Sections:

- NIST FC story
- Vision
- Football culture
- Relationship with NIST University
- Social media links

## 12. Admin Login

Route:

`/admin/login`

Purpose:

Authenticate authorized NIST FC administrators.

## 13. Admin Dashboard

Route:

`/admin`

Dashboard should provide a quick overview of:

- Total current players
- Total former players
- Total memories
- Total timeline events
- Total founders

And provide navigation to content management sections.

## 14. Admin Player Management

Routes:

`/admin/players`

`/admin/players/new`

`/admin/players/:id/edit`

Admins can:

- Add players
- Edit players
- Upload/change player photos
- Change player status
- Edit player information
- Remove players when necessary

Important archival rule:

A player who leaves NIST FC should normally be changed from:

`Current → Former`

rather than being removed from the archive.

## 15. Admin Memory Management

Routes:

`/admin/memories`

`/admin/memories/new`

`/admin/memories/:id/edit`

Admins can:

- Create memories
- Edit memories
- Upload cover images
- Upload gallery photos
- Associate players
- Add dates
- Add locations
- Add descriptions
- Add tags
- Delete memories when necessary

## 16. Admin Timeline Management

Routes:

`/admin/timeline`

`/admin/timeline/new`

`/admin/timeline/:id/edit`

Admins can:

- Create timeline events
- Edit timeline events
- Add event dates/years
- Add descriptions
- Upload images
- Assign categories
- Connect events to memories
- Manually reorder events

## 17. Admin Founder Management

Routes:

`/admin/founders`

`/admin/founders/new`

`/admin/founders/:id/edit`

Admins can:

- Add founders
- Edit founder information
- Upload founder photos
- Change display order
- Remove founder records when necessary

## 18. Navigation Relationships

### Player → Memories

A player profile can display memories associated with that player.

### Memory → Players

A memory can display the players who participated in or are associated with that memory.

### Timeline → Memory

A timeline event may optionally link to an associated memory.

### Memory → Timeline

A memory may be reached through its related timeline event.

## 19. V1 Route Scope

### Public

- `/`
- `/players`
- `/players/:slug`
- `/memories`
- `/memories/:slug`
- `/timeline`
- `/founders`
- `/about`

### Admin

- `/admin/login`
- `/admin`
- `/admin/players`
- `/admin/players/new`
- `/admin/players/:id/edit`
- `/admin/memories`
- `/admin/memories/new`
- `/admin/memories/:id/edit`
- `/admin/timeline`
- `/admin/timeline/new`
- `/admin/timeline/:id/edit`
- `/admin/founders`
- `/admin/founders/new`
- `/admin/founders/:id/edit`

## 20. V1 Routing Principles

- Public and admin areas use the same React application.
- Admin routes are protected by authentication.
- Public routes do not require authentication.
- Player URLs use slugs for readable/shareable URLs.
- Memory URLs use slugs for readable/shareable URLs.
- Individual photos do not have separate URLs.
- A memory contains its complete photo gallery.
- Timeline and Memories are separate content types but can be connected.
- Current and former players remain part of the same player archive.
- No statistics, matches, results, or tournament routes are included in V1.
