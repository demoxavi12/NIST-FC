# NIST FC — Claude Code Instructions

## 1. Project

This repository contains the official website and historical digital archive of **NIST FC**, the men's football team of NIST University.

NIST FC is both:

- A current football team website
- A long-term historical archive of the team

The website must preserve the history of current and former players, memories, important events, and founders.

---

# 2. Core Development Principle

## AI writes the code. We own the decisions.

Claude Code is responsible for:

- Writing code
- Refactoring code
- Creating components
- Implementing APIs
- Writing tests
- Debugging
- Improving implementation quality

The human developer remains responsible for:

- Product decisions
- Architecture decisions
- Feature scope
- Security decisions
- Data model changes
- Major dependency changes
- Final approval

Do not silently make major product or architecture decisions.

---

# 3. Documentation Is the Source of Truth

Before implementing a feature, read the relevant documentation.

The current architecture documents are:

```text
docs/
├── PROJECT_SPEC.md
├── FEATURES.md
├── SITE_MAP.md
├── DATABASE.md
├── API.md
├── AUTH.md
└── UI_DESIGN.md
```

These documents define the intended V1 architecture.

If code conflicts with the documentation:

1. Identify the conflict.
2. Do not silently change the architecture.
3. Ask for clarification or propose the smallest correction.

---

# 4. Product Scope

NIST FC V1 includes:

### Public

- Home
- Players
- Player Profile
- Memories
- Memory Detail
- Timeline
- Founders
- About

### Admin

- Login
- Dashboard
- Players
- Memories
- Timeline
- Founders

### Infrastructure

- MongoDB
- Express
- React
- Node.js
- Cloudinary
- JWT
- bcrypt

---

# 5. V1 Out of Scope

Do not implement these unless explicitly requested:

```text
Player statistics
Goals
Assists
Appearances
Match results
Fixtures
Live scores
Seasons
Tournament database
Awards
Captains
Coaches
Comments
Likes
Chat
Notifications
Social networking
AI chatbot
Player self-registration
Google Form integration
Player submission workflow
Mobile application
Fantasy football
Advanced analytics
```

Do not add speculative features.

---

# 6. Technology Stack

## Frontend

```text
React
React Compiler (babel-plugin-react-compiler via @rolldown/plugin-babel)
Vite
JavaScript
Tailwind CSS
React Router
Axios
Lucide React
Inter (Google Fonts)
```

The React Compiler is intentionally kept. It is configured in `client/vite.config.js`. Do not remove it without approval.

The frontend calls the API through the relative base path `/api`. In development, the Vite dev server proxies `/api` to the Express backend, and the proxy is configured only in `client/vite.config.js`. Do not hard-code backend hosts such as `http://localhost:5000` in frontend code. See `docs/API.md` §2.

## Backend

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcrypt
Multer
Cloudinary
```

The project uses JavaScript rather than TypeScript unless explicitly changed later.

---

# 7. Repository Structure

Current high-level structure:

```text
NIST-FC/
├── client/
├── server/
├── docs/
├── CLAUDE.md
├── README.md
└── .gitignore
```

Do not create unnecessary top-level directories.

---

# 8. Frontend Architecture

The intended frontend structure is approximately:

```text
client/
└── src/
    ├── assets/
    ├── components/
    │   ├── common/
    │   ├── layout/
    │   ├── player/
    │   ├── memory/
    │   ├── timeline/
    │   └── founder/
    ├── pages/
    │   ├── public/
    │   │   ├── Home/
    │   │   ├── Players/
    │   │   ├── PlayerProfile/
    │   │   ├── Memories/
    │   │   ├── MemoryDetail/
    │   │   ├── Timeline/
    │   │   ├── Founders/
    │   │   └── About/
    │   └── admin/
    │       ├── Login/
    │       ├── Dashboard/
    │       ├── Players/
    │       ├── Memories/
    │       ├── Timeline/
    │       └── Founders/
    ├── layouts/
    │   ├── PublicLayout/
    │   └── AdminLayout/
    ├── services/
    ├── hooks/
    ├── context/
    ├── utils/
    ├── constants/
    ├── routes/
    ├── App.jsx
    └── main.jsx
```

Do not create all folders prematurely.

Create folders when they are actually required by implementation.

---

# 9. Backend Architecture

The intended backend structure is:

```text
server/
└── src/
    ├── config/
    │   ├── db.js
    │   └── cloudinary.js
    ├── models/
    │   ├── Player.js
    │   ├── Memory.js
    │   ├── TimelineEvent.js
    │   ├── Founder.js
    │   └── Admin.js
    ├── controllers/
    │   ├── playerController.js
    │   ├── memoryController.js
    │   ├── timelineController.js
    │   ├── founderController.js
    │   └── authController.js
    ├── routes/
    │   ├── playerRoutes.js
    │   ├── memoryRoutes.js
    │   ├── timelineRoutes.js
    │   ├── founderRoutes.js
    │   └── authRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── errorMiddleware.js
    │   └── uploadMiddleware.js
    ├── services/
    │   └── cloudinaryService.js
    ├── validators/
    ├── utils/
    ├── app.js
    └── server.js
```

The backend should generally follow:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Model
  ↓
MongoDB
```

Do not place large amounts of business logic inside routes.

---

# 10. Database Rules

V1 collections:

```text
admins
players
memories
timelineEvents
founders
```

Do not introduce new collections without a product requirement.

Images are stored in Cloudinary.

MongoDB stores:

```text
url
publicId
```

Do not store raw image binaries in MongoDB.

---

# 11. Player Rules

Player fields:

```text
name
slug
photo
position
batch
branch
bio
status
```

Status:

```text
current
former
```

A player leaving NIST FC should normally become:

```text
current → former
```

Do not delete former players simply because they leave the team.

The historical archive is an important product requirement.

---

# 12. Memory Rules

A memory contains:

```text
title
slug
description
date
location
coverImage
photos[]
players[]
tags[]
published
```

Memories are displayed:

```text
Latest → Oldest
```

Ordering is strictly by `date` descending. V1 has no manual memory-ordering field, and admins cannot reorder memories.

There is no separate Photo collection in V1.

A memory contains its complete gallery.

---

# 13. Player ↔ Memory Relationship

A memory can reference multiple players.

A player can appear in multiple memories.

Relationship:

```text
Player ←→ Memory
```

Use MongoDB ObjectId references.

Do not duplicate complete player documents inside memories.

---

# 14. Timeline Rules

Timeline events contain:

```text
title
date
year
description
image
category
memory
order
published
```

Timeline order is manually controlled by:

```text
order
```

Timeline events may optionally reference one memory.

Deleting a timeline event must not automatically delete its memory.

---

# 15. Founder Rules

Founder fields:

```text
name
slug
photo
role
batch
branch
bio
quote
displayOrder
published
```

Founders use:

```text
displayOrder
```

for manual ordering.

---

# 16. Authentication Rules

Admin authentication uses:

```text
JWT
bcrypt
HTTP-only cookies
```

Never store passwords directly.

Never store JWT tokens in localStorage.

Never expose:

```text
JWT_SECRET
MONGODB_URI
CLOUDINARY_API_SECRET
passwordHash
```

to the frontend.

There is no public administrator registration.

---

# 17. API Rules

Use RESTful endpoints.

Examples:

```text
GET    /api/players
GET    /api/players/:slug
POST   /api/players
PATCH  /api/players/:id
DELETE /api/players/:id
```

Use:

```text
GET
POST
PATCH
DELETE
```

appropriately.

Do not create unnecessary endpoints.

Follow `docs/API.md`.

---

# 18. API Response Consistency

Successful responses should generally use:

```json
{
  "success": true,
  "data": {},
  "message": "..."
}
```

`data` is always present. It is `null` when there is nothing to return. List responses also include `pagination`.

DELETE endpoints return HTTP `200` with `data: null` and a message such as `"Resource deleted successfully"`. `204` is not used.

Errors should generally use:

```json
{
  "success": false,
  "message": "...",
  "error": null
}
```

`error` is always present. It is `null` unless there is safe structured detail, such as field-level validation messages. See `docs/API.md` §4–5.

Do not create inconsistent response formats between resources without a reason.

---

# 19. Security Rules

Always:

- Validate server-side input.
- Authenticate protected routes.
- Authorize admin operations.
- Hash passwords.
- Protect secrets.
- Restrict CORS.
- Validate uploads.
- Limit upload sizes.
- Rate-limit authentication.
- Avoid exposing stack traces in production.
- Sanitize MongoDB query inputs.
- Treat user-generated content as untrusted.

Read `docs/AUTH.md` before implementing authentication.

---

# 20. Frontend Design Rules

Read:

```text
docs/UI_DESIGN.md
```

before implementing public UI.

The V1 accent colour `#1D4ED8` is a **temporary placeholder, not official NIST branding**. Define it once as a design token and never hard-code it in components. V1 uses Inter only, loaded from Google Fonts. See `docs/UI_DESIGN.md` §4 and §6.

The website should feel:

```text
Professional
Athletic
Modern
Premium
Historical
Editorial
```

Avoid:

```text
Excessive gradients
Excessive glassmorphism
Neon colors
Heavy shadows
Excessive animations
Generic sports templates
SaaS-style visual design
```

---

# 21. UI Component Rules

Prefer reusable components.

Examples:

```text
PlayerCard
MemoryCard
FounderCard
TimelineEvent
SectionHeading
Button
Modal
ImageGallery
Lightbox
LoadingState
ErrorState
EmptyState
```

Do not create duplicate components with almost identical behavior.

Before creating a new component, check whether an existing component can be reused.

---

# 22. Tailwind Rules

Use the current Tailwind CSS/Vite setup.

Do not follow outdated Tailwind configuration tutorials.

Prefer reusable classes/components over excessive one-off styling.

Do not introduce another CSS framework.

---

# 23. Responsive Design

Every public page must work on:

```text
Mobile
Tablet
Desktop
```

Do not build desktop first and postpone mobile until the end.

Mobile navigation must be intentionally designed rather than simply shrinking the desktop layout.

---

# 24. Accessibility

Use:

- Semantic HTML
- Proper heading hierarchy
- Accessible labels
- Keyboard navigation
- Visible focus states
- Alt text
- Sufficient contrast
- Accessible buttons

Do not use color alone to communicate important states.

Respect:

```text
prefers-reduced-motion
```

---

# 25. Images

Use Cloudinary for application images.

Use appropriate:

- Dimensions
- Transformations
- Compression
- Responsive image sizes
- Lazy loading

Do not load full-resolution gallery images when thumbnails are sufficient.

---

# 26. Environment Variables

Secrets belong in `.env`.

Never commit real secrets.

`.env.example` may contain variable names without values. `.gitignore` ignores `.env` and `.env.*` but explicitly allows `.env.example`.

The complete V1 list is below. It is kept identical in `docs/API.md` §38 and `docs/AUTH.md` §46. All of these are backend variables (`server/.env`). The frontend needs none in V1.

```text
# Server
NODE_ENV=
PORT=

# Database
MONGODB_URI=

# Authentication
JWT_SECRET=
JWT_EXPIRES_IN=
COOKIE_NAME=
COOKIE_SECURE=
COOKIE_SAME_SITE=

# CORS / deployment
CLIENT_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Upload limits
MAX_IMAGE_SIZE_MB=
MAX_MEMORY_IMAGES=

# Initial admin seed (used only by the admin seed script)
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

`NODE_ENV` must be either `development` or `production`.

Do not introduce new environment variables without updating all three documents.

---

# 27. Dependency Rules

Do not install a package simply because it is convenient.

Before adding a dependency:

1. Check whether the existing stack can solve the problem.
2. Check whether an existing installed package already provides the functionality.
3. Consider bundle size and maintenance.
4. Explain why the dependency is necessary.

Never install multiple libraries that solve the same problem without approval.

---

# 28. Architecture Change Rules

Claude Code must not silently change:

- Database schema
- Authentication architecture
- API contract
- Route structure
- Technology stack
- Major UI architecture
- Cloudinary strategy
- Deployment architecture

If a change appears necessary:

1. Stop.
2. Explain the problem.
3. Propose the change.
4. Wait for approval.

---

# 29. Scope Control

When asked to implement one feature:

Only modify files required for that feature.

Do not:

- Refactor unrelated code
- Rename unrelated files
- Change unrelated dependencies
- Rewrite working components
- Change architecture unnecessarily

Keep changes focused.

---

# 30. Development Workflow

Every meaningful feature follows:

```text
PLAN
  ↓
SPECIFY
  ↓
IMPLEMENT
  ↓
RUN
  ↓
TEST
  ↓
REVIEW
  ↓
FIX
  ↓
COMMIT
```

Do not skip testing.

---

# 31. Before Coding

Before implementing a feature:

1. Read the relevant documentation.
2. Inspect the existing repository.
3. Identify existing components/services/models.
4. Plan the smallest implementation.
5. Identify files that will change.
6. Implement only after the plan is clear.

Do not immediately start generating large amounts of code.

---

# 32. After Coding

After implementation:

1. Run the relevant development server.
2. Check for compilation errors.
3. Check linting.
4. Test the feature manually.
5. Test important edge cases.
6. Review the changed files.
7. Check for accidental unrelated modifications.
8. Fix issues.
9. Only then commit.

---

# 33. Testing

At minimum, verify:

### Frontend

- Page loads
- Routes work
- API states work
- Loading states work
- Empty states work
- Error states work
- Mobile layout works

### Backend

- Valid requests work
- Invalid requests fail correctly
- Authentication works
- Protected endpoints reject unauthorized requests
- Database operations work
- Image upload works
- Error handling works

---

# 34. Git Rules

Use Git frequently.

Prefer focused commits.

Examples:

```text
chore: initialize project
docs: define database design
feat: implement player API
feat: add player directory
feat: implement admin authentication
fix: handle memory upload error
refactor: simplify player service
```

Do not create huge commits containing unrelated changes.

---

# 35. Branching

For meaningful features, use a feature branch.

Example:

```text
main
  │
  ├── feature/player-api
  ├── feature/admin-auth
  ├── feature/memory-gallery
  └── feature/timeline
```

Merge completed, tested features into `main`.

---

# 36. Commit Rules

Before committing:

```bash
git status
```

Review changed files.

Do not commit:

```text
.env
node_modules/
dist/
secrets
credentials
temporary files
debug dumps
```

---

# 37. Debugging Rules

When debugging:

1. Reproduce the problem.
2. Read the complete error.
3. Identify the root cause.
4. Inspect relevant code.
5. Make the smallest appropriate fix.
6. Test the fix.
7. Check for regressions.

Do not blindly modify multiple files until the error disappears.

---

# 38. Error Handling

Errors should be handled deliberately.

Do not use:

```text
try/catch
```

everywhere without meaningful handling.

Use centralized backend error middleware.

Frontend errors should produce useful UI states.

---

# 39. Logging Rules

Development logging is acceptable when useful.

Do not leave unnecessary debugging logs in production code.

Never log:

```text
Passwords
JWTs
JWT secrets
Cloudinary secrets
MongoDB credentials
```

---

# 40. Performance Rules

Prefer:

- Lazy loading
- Pagination
- Optimized images
- Efficient MongoDB queries
- Reusable components
- Minimal dependencies

Avoid:

- Unnecessary API calls
- Loading all memories at once
- Loading full-resolution gallery images immediately
- Excessive React state
- Premature optimization

---

# 41. SEO

Public pages should have:

- Meaningful titles
- Meta descriptions
- Semantic headings
- Clean URLs
- Image alt text
- Open Graph metadata where appropriate

Public URLs should use slugs where defined.

---

# 42. Data Fetching

Use the API as the source of truth.

Do not hard-code production player/memory/timeline data into React components.

Static UI content may be stored in frontend constants where appropriate.

Dynamic content belongs in MongoDB and is accessed through the API.

---

# 43. Admin UI Rules

The admin interface should prioritize:

```text
Speed
Clarity
Reliability
```

over visual decoration.

Admin pages should provide:

- Search
- Filters
- Clear actions
- Forms
- Confirmation dialogs
- Loading states
- Error states
- Success feedback

---

# 44. Destructive Actions

Destructive actions require confirmation.

Examples:

```text
Delete Player
Delete Memory
Delete Timeline Event
Delete Founder
Delete Image
```

Archiving a player as `former` should be visually distinguished from permanent deletion.

---

# 45. Historical Archive Principle

NIST FC is a historical archive.

When making content decisions, preserve historical information wherever possible.

Especially:

- Former players
- Memories
- Timeline events
- Founder information

Do not optimize the site only for the current team.

---

# 46. No Fake Data in Production

Placeholder data may be used during development.

Before production:

- Remove fake players.
- Remove fake memories.
- Remove fake founders.
- Remove fake timeline events.
- Remove placeholder credentials.

Do not present invented history as real NIST FC history.

---

# 47. Content Integrity

Do not invent:

- Player information
- Founder information
- Team history
- Tournament achievements
- Dates
- Locations
- Quotes
- Statistics

If required information is missing, leave it empty/optional or ask the developer for the correct information.

---

# 48. AI-Assisted Development Rules

Claude Code should behave as an implementation agent, not as the product owner.

Claude may:

- Suggest improvements
- Identify bugs
- Suggest refactoring
- Explain tradeoffs
- Identify security concerns

Claude must not silently:

- Expand scope
- Redesign the database
- Change routes
- Replace libraries
- Rewrite architecture
- Add speculative features

---

# 49. When Requirements Are Ambiguous

If a requirement can materially change:

- Database structure
- API design
- Authentication
- User experience
- Data relationships
- Security

stop and ask for clarification.

For minor implementation details, choose the simplest approach consistent with the existing architecture.

---

# 50. Documentation Updates

If implementation intentionally changes an architectural decision:

Update the relevant documentation.

Examples:

```text
Database change
→ docs/DATABASE.md

API change
→ docs/API.md

Authentication change
→ docs/AUTH.md

UI change
→ docs/UI_DESIGN.md

Feature scope change
→ docs/FEATURES.md
```

Documentation and implementation should remain synchronized.

---

# 51. Do Not Overengineer

NIST FC V1 is a real project but does not require enterprise-level complexity.

Prefer:

```text
Simple
Clear
Maintainable
Reliable
```

over:

```text
Over-engineered
Highly abstract
Dependency-heavy
Prematurely scalable
```

Build only what the product currently needs.

---

# 52. V1 Architecture

The intended architecture is:

```text
                  ┌─────────────────┐
                  │     Visitor     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ React + Vite    │
                  │ Tailwind        │
                  └────────┬────────┘
                           │
                         Axios
                           │
                           ▼
                  ┌─────────────────┐
                  │ Express API     │
                  │ Node.js         │
                  └───────┬─────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        MongoDB       Cloudinary    JWT/Auth
```

---

# 53. Deployment Direction

Expected deployment architecture:

```text
Frontend
   ↓
Vercel

Backend
   ↓
Node/Express hosting provider

Database
   ↓
MongoDB Atlas

Images
   ↓
Cloudinary
```

The exact backend hosting provider can be selected later.

Do not hard-code deployment assumptions into application code.

---

# 54. Feature Implementation Order

Unless explicitly changed, implementation should generally proceed in this order:

### Phase 1 — Foundation

```text
Project setup
Tailwind
Routing
Shared layout
Design tokens
API client
Environment configuration
```

### Phase 2 — Backend Foundation

```text
Express setup
MongoDB connection
Models
Error handling
Validation
Cloudinary
```

### Phase 3 — Authentication

```text
Admin model
bcrypt
JWT
HTTP-only cookie
Auth middleware
Login
Logout
Protected routes
```

### Phase 4 — Players

```text
Player API
Player admin CRUD
Player directory
Search
Filters
Player profile
```

### Phase 5 — Memories

```text
Memory API
Cloudinary gallery
Admin memory management
Memory listing
Memory detail
Lightbox
Player relationships
Previous/next navigation
```

### Phase 6 — Timeline

```text
Timeline API
Admin management
Manual ordering
Timeline UI
Memory relationships
```

### Phase 7 — Founders

```text
Founder API
Admin management
Founder UI
Manual ordering
```

### Phase 8 — Homepage/About

```text
Homepage
About page
Footer
Social links
```

### Phase 9 — Polish

```text
Responsive refinement
Accessibility
SEO
Performance
Error states
Loading states
Final testing
```

---

# 55. Definition of Done

A feature is not considered complete merely because the code exists.

A feature is complete when:

```text
Code works
+
UI works
+
API works
+
Validation works
+
Errors are handled
+
Responsive behavior works
+
Relevant tests pass
+
No unrelated regressions
+
Documentation remains accurate
```

---

# 56. Final Rule

Before making significant changes, ask:

> Does this change help build the NIST FC product defined by the documentation?

If the answer is no, do not make the change.

Build the smallest clean solution that satisfies the approved requirements.

---

# 57. Final Status

**CLAUDE.md — FINALIZED**

This file is the permanent operating guide for Claude Code inside the NIST FC repository.

Claude Code must read and follow this document before implementing or modifying the project.
