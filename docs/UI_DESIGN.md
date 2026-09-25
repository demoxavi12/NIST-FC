# NIST FC — UI Design System

## 1. Purpose

This document defines the visual identity, user interface principles, layout system, responsive behavior, components, and page-level design direction for the NIST FC website.

The goal is to create a website that feels:

- Professional
- Athletic
- Modern
- Premium
- Strong
- Historical
- Emotional without being overly dramatic
- Easy to navigate
- Visually driven by football photography

The website should feel like the **official digital home and historical archive of NIST FC**, not a generic college project.

---

# 2. Design Philosophy

NIST FC is both:

1. A football team.
2. A historical archive.

The UI should therefore balance:

```text
Football Energy
        +
Institutional Identity
        +
Historical Storytelling
        +
Modern Web Design
```

The design should communicate:

- Team identity
- Unity
- Competition
- Pride
- History
- Progress
- Belonging

Avoid making the site look like:

- A generic sports template
- A college notice board
- A social-media clone
- A dashboard-heavy SaaS product
- An overly flashy gaming website

---

# 3. Visual Direction

The visual direction should be:

```text
Modern football club website
+
University identity
+
Editorial archive
```

The interface should use strong photography, clean typography, generous spacing, subtle motion, and clear hierarchy.

The design should feel premium without requiring excessive visual effects.

---

# 4. Color System

The exact NIST University brand colors should be verified from official NIST branding/assets before final production.

Until the official palette is confirmed, the UI should use a restrained football-inspired neutral palette.

### Core colors

```text
Primary
#0B0F14

Secondary
#161C24

Surface
#FFFFFF

Muted Surface
#F4F5F7

Primary Text
#111827

Secondary Text
#667085

Border
#E5E7EB

Accent
NIST brand accent — to be finalized from official branding
```

The accent color should be used for:

- Buttons
- Active navigation
- Links
- Important highlights
- Timeline markers
- Interactive states

Do not use many competing accent colors.

---

# 5. Dark and Light Usage

The public website should primarily use a **light editorial interface** with strategically placed dark sections.

Recommended pattern:

```text
Hero
Dark

Content sections
Light

Selected feature sections
Dark

Gallery
Light / image-driven

Timeline
Light or subtle neutral

Footer
Dark
```

This creates visual rhythm.

The website should not be entirely dark.

---

# 6. Typography

Typography should be modern, highly readable, and suitable for a sports/editorial website.

Recommended font strategy:

### Headings

Use a strong modern sans-serif.

Possible choices:

```text
Inter
Manrope
Space Grotesk
Plus Jakarta Sans
```

### Body

Use:

```text
Inter
```

or another highly readable sans-serif.

The final font should be loaded efficiently and used consistently.

Avoid using more than two font families.

---

# 7. Typography Hierarchy

### Display Heading

Used for:

- Hero
- Major section introductions

Characteristics:

```text
Large
Bold
Strong line height
Tight letter spacing
```

Example:

```text
THE HOME
OF NIST FC
```

---

### H1

Used for page titles.

Example:

```text
Our Players
```

---

### H2

Used for major sections.

Example:

```text
The Journey
```

---

### H3

Used for cards and subsections.

Example:

```text
University Tournament 2025
```

---

### Body

Readable line length with comfortable spacing.

Avoid long text blocks.

---

# 8. Spacing System

Use a consistent spacing scale.

Recommended base:

```text
4px
8px
12px
16px
24px
32px
48px
64px
80px
96px
120px
```

Large sections should have generous vertical spacing.

Avoid cramped layouts.

---

# 9. Container System

Desktop content should use a centered max-width container.

Recommended:

```text
max-width: 1280px
```

with responsive horizontal padding.

Example:

```text
Desktop:
padding: 32px

Tablet:
padding: 24px

Mobile:
padding: 16px
```

Full-width visual sections may break outside the container when appropriate.

---

# 10. Border Radius

Use moderate corner rounding.

Recommended:

```text
Small:
8px

Medium:
12px

Large:
16px
```

Cards should not have excessively rounded corners.

Avoid a highly "soft SaaS" appearance.

---

# 11. Shadows

Use shadows sparingly.

Preferred:

- Subtle elevation
- Soft card separation
- Minimal floating UI

Avoid:

- Heavy shadows
- Glowing effects
- Excessive neumorphism

---

# 12. Buttons

Buttons should have strong visual hierarchy.

### Primary Button

Used for major actions.

Examples:

```text
Explore Team
Explore Memories
View Journey
```

Characteristics:

- Solid accent/background
- Strong contrast
- Medium radius
- Clear hover state

---

### Secondary Button

Used for supporting actions.

Examples:

```text
View All Players
Explore Timeline
```

Can use:

- Outline
- Subtle background
- Dark/light contrast

---

### Text Button

Used for low-priority navigation.

Example:

```text
View Profile →
```

---

# 13. Button Behavior

Buttons should provide:

- Hover state
- Focus state
- Active state
- Disabled state when appropriate

Animations should be subtle.

Avoid exaggerated button animations.

---

# 14. Navigation

The public navbar should contain:

```text
NIST FC
Home
Team
Memories
Timeline
Founders
About
```

Desktop:

```text
Logo                      Navigation
NIST FC     Home Team Memories Timeline Founders About
```

The navbar should remain visually simple.

---

# 15. Navbar Behavior

Desktop:

- Horizontal navigation
- Logo on left
- Navigation on right
- Optional sticky behavior

Mobile:

```text
NIST FC                       ☰
```

Opening the menu should reveal navigation vertically.

The mobile menu must be easy to close.

---

# 16. Active Navigation

The current page should have a clear active state.

Examples:

```text
Home
Team ← active
Memories
Timeline
Founders
About
```

Active states should use:

- Accent color
- Underline
- Background
- Or another subtle visual indicator

Do not use multiple indicators simultaneously.

---

# 17. Hero Section

The homepage hero is the strongest visual section.

Purpose:

Immediately communicate:

> This is NIST FC.

Recommended composition:

```text
┌───────────────────────────────────────────┐
│                                           │
│       FULL-WIDTH TEAM / ACTION IMAGE      │
│                                           │
│       NIST FC                             │
│       THE HOME OF NIST FOOTBALL           │
│                                           │
│       [ Explore Team ]                    │
│                                           │
└───────────────────────────────────────────┘
```

Use a strong football image.

The hero should have:

- High-quality image
- Dark overlay where necessary
- Strong heading
- Short supporting text
- One primary CTA
- Optional secondary CTA

---

# 18. Hero Content

Suggested structure:

```text
NIST FC

The football team of NIST University.

Built through passion, competition,
teamwork, and generations of players.

[ Explore Team ]
[ Our Journey ]
```

The final copy can be refined later.

---

# 19. Home — About Section

The homepage should introduce NIST FC briefly.

Structure:

```text
About NIST FC

Short description

                    Supporting image
```

Keep the content concise.

A longer story belongs on `/about`.

---

# 20. Home — Current Players

Show a curated selection of current players.

Example:

```text
OUR TEAM

[ Player ] [ Player ] [ Player ] [ Player ]

              View All Players →
```

Desktop:

```text
4–5 cards
```

Tablet:

```text
2–3 cards
```

Mobile:

```text
1–2 cards
```

The exact number can be adjusted based on visual testing.

---

# 21. Player Card

Player cards should feel like football roster cards.

Each card contains:

```text
Photo
Name
Position
Batch
```

Example:

```text
┌──────────────────┐
│                  │
│      PHOTO       │
│                  │
├──────────────────┤
│ Rahul Das        │
│ Midfielder       │
│ Batch 2025       │
└──────────────────┘
```

The card should link to:

```text
/players/:slug
```

---

# 22. Player Card Image

Player photography should dominate the card.

Use:

- Consistent aspect ratio
- `object-fit: cover`
- Strong image quality
- Subtle hover movement

Avoid inconsistent image dimensions.

---

# 23. Player Profile

Player profile should feel like an individual football profile rather than a generic database page.

Structure:

```text
┌────────────────────────────────────────────┐
│                                            │
│             PLAYER PHOTO                   │
│                                            │
│  Rahul Das                                 │
│  Midfielder                                │
│  Batch 2025 • CSE                          │
│                                            │
│  Biography                                 │
│                                            │
└────────────────────────────────────────────┘

Memories involving Rahul
[ Memory ] [ Memory ] [ Memory ]
```

---

# 24. Player Profile Hierarchy

Priority:

1. Photo
2. Name
3. Position
4. Batch / Branch
5. Bio
6. Memories

The player name should be the strongest text element.

---

# 25. Current / Former Status

Status should be visible but subtle.

Example:

```text
CURRENT
```

or:

```text
FORMER
```

Avoid making former players appear less important.

Former players are part of the team's history.

---

# 26. Players Page

Route:

```text
/players
```

Page structure:

```text
Page Header

Search

Filters

Player Grid
```

Example:

```text
OUR PLAYERS

Meet the players who represent NIST FC.

[ Search players... ]

[ Status ] [ Position ] [ Batch ] [ Branch ]

[ Card ] [ Card ] [ Card ] [ Card ]
[ Card ] [ Card ] [ Card ] [ Card ]
```

---

# 27. Player Filters

Filters:

```text
Status
Position
Batch
Branch
```

Filters should be easy to clear.

Include:

```text
Clear Filters
```

when filters are active.

---

# 28. Search

Player search should be simple.

Search field:

```text
Search players...
```

Search should work primarily by player name.

Search should provide immediate visual feedback.

---

# 29. Empty Player Results

If no player matches:

```text
No players found.

Try changing your search or filters.
```

Do not show a blank page.

---

# 30. Memories Page

The memories page is one of the most important sections of the site.

It should feel like a visual historical archive.

Page title:

```text
MEMORIES

Moments that shaped NIST FC.
```

---

# 31. Memory Layout

Use a responsive editorial grid.

Desktop:

```text
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│             │ │             │ │             │
│   Image     │ │   Image     │ │   Image     │
│             │ │             │ │             │
│ Title       │ │ Title       │ │ Title       │
│ Date        │ │ Date        │ │ Date        │
└─────────────┘ └─────────────┘ └─────────────┘
```

The grid can vary slightly in size to create editorial rhythm, but consistency should remain more important than decoration.

---

# 32. Memory Card

Memory card should show:

- Cover image
- Title
- Date
- Optional location
- Short description

Example:

```text
University Tournament 2025
March 2025
Bhubaneswar
```

The entire card should be clickable.

---

# 33. Memory Detail

Route:

```text
/memories/:slug
```

This should be an immersive archive page.

Structure:

```text
Title
Date
Location
Description

Large Gallery

Players Involved

Previous Memory ←          → Next Memory
```

---

# 34. Memory Gallery

The gallery is the visual centerpiece.

Use:

- Responsive image grid
- Consistent spacing
- High-quality thumbnails
- Click-to-expand/lightbox behavior

Opening an image should allow the user to view it larger.

A lightbox is allowed in V1.

---

# 35. Gallery Navigation

Users should be able to:

- Open an image
- Navigate next/previous image
- Close the lightbox

Keyboard support should be included where practical:

```text
← Previous
→ Next
Esc Close
```

---

# 36. Memory Chronological Navigation

At the bottom of a memory:

```text
← Previous Memory

                Next Memory →
```

This allows visitors to move through NIST FC history without returning to the main gallery.

The navigation must follow chronological order.

---

# 37. Memory Players

A memory should show associated players.

Example:

```text
PLAYERS IN THIS MEMORY

[ Rahul Das ]
[ Arjun Singh ]
[ ... ]
```

Each player should link to their profile.

---

# 38. Timeline

The timeline should visually communicate the history of NIST FC.

Page heading:

```text
OUR JOURNEY

From the beginning to today.
```

---

# 39. Timeline Layout

Desktop:

```text
            2023
             ●
             │
      Founding of NIST FC
             │
             │
            2024
             ●
             │
      First Major Tournament
             │
             │
            2025
             ●
             │
      University Achievement
```

The visual timeline can use a central line on desktop.

Mobile should simplify to:

```text
● 2023
│
├── Founding of NIST FC
│
● 2024
│
├── First Major Tournament
```

---

# 40. Timeline Event

Each event can contain:

- Year/date
- Title
- Description
- Category
- Image
- Associated memory link

Example:

```text
2025

University Tournament

A major moment in the team's journey.

[ View Memory ]
```

---

# 41. Timeline Interaction

Timeline events may link to an associated memory.

If no memory exists:

Do not show a broken or disabled-looking link.

Simply display the event.

---

# 42. Founders Page

The founders page should have a respectful historical/editorial feel.

Heading:

```text
THE FOUNDERS

The people who helped begin the journey.
```

Founder cards should include:

- Photo
- Name
- Role
- Batch
- Branch
- Short bio
- Quote where available

---

# 43. Founder Card

Example:

```text
┌─────────────────────┐
│                     │
│       PHOTO         │
│                     │
├─────────────────────┤
│ Founder Name        │
│ Co-Founder          │
│ Batch 2023 • CSE    │
│                     │
│ Short biography...  │
└─────────────────────┘
```

---

# 44. About Page

The About page should tell the larger story of NIST FC.

Sections:

```text
NIST FC Story

Our Vision

Football Culture

NIST University

Social Links
```

The page should use a combination of:

- Text
- Photography
- Large section headings
- Supporting visual elements

Avoid turning it into a wall of text.

---

# 45. Footer

Footer should contain:

```text
NIST FC

Official football team of NIST University.

Navigation
Home
Team
Memories
Timeline
Founders
About

Social Links

© NIST FC
```

The footer should use a dark background.

---

# 46. Admin UI

The admin interface should be visually separate from the public website.

It should prioritize:

- Clarity
- Efficiency
- Fast content management
- Tables/forms
- Clear actions
- Error prevention

It does not need the same highly visual design as the public site.

---

# 47. Admin Layout

Recommended:

```text
┌──────────────────────────────────────────┐
│ Top Bar                                  │
├──────────────┬───────────────────────────┤
│              │                           │
│ Sidebar      │ Main Content              │
│              │                           │
│ Dashboard    │                           │
│ Players      │                           │
│ Memories     │                           │
│ Timeline     │                           │
│ Founders     │                           │
│              │                           │
└──────────────┴───────────────────────────┘
```

---

# 48. Admin Sidebar

Navigation:

```text
Dashboard

Content
├── Players
├── Memories
├── Timeline
└── Founders

Logout
```

Keep navigation compact.

---

# 49. Admin Dashboard

Dashboard should display:

```text
Current Players
Former Players
Memories
Timeline Events
Founders
```

Use simple statistic cards.

Example:

```text
┌──────────┐ ┌──────────┐ ┌──────────┐
│ 20       │ │ 30       │ │ 25       │
│ Current  │ │ Former   │ │ Memories │
└──────────┘ └──────────┘ └──────────┘
```

---

# 50. Admin Player Management

Player list should provide:

- Search
- Filters
- Player name
- Position
- Batch
- Status
- Edit
- Delete/archive

Primary action:

```text
+ Add Player
```

---

# 51. Admin Player Form

Fields:

```text
Name
Photo
Position
Batch
Branch
Bio
Status
```

Required fields should be clearly indicated.

The form should provide:

```text
Save Player
Cancel
```

---

# 52. Admin Memory Management

Memory management should show:

- Cover image
- Title
- Date
- Published state
- Number of photos
- Edit
- Delete

Primary action:

```text
+ Add Memory
```

---

# 53. Admin Memory Form

Fields:

```text
Title
Description
Date
Location
Cover Image
Gallery Images
Players
Tags
Published
```

The gallery uploader should support multiple images.

Uploaded images should have previews.

---

# 54. Admin Timeline Management

Timeline management should show:

- Event title
- Year
- Category
- Associated memory
- Published state
- Display order

Primary action:

```text
+ Add Event
```

Admins should be able to drag and reorder events.

---

# 55. Admin Founder Management

Founder management should show:

- Photo
- Name
- Role
- Batch
- Display order
- Published state
- Edit
- Delete

Admins should be able to reorder founders.

---

# 56. Forms

Forms should:

- Use clear labels
- Show validation errors near the relevant field
- Preserve entered data when possible
- Show upload progress
- Prevent accidental duplicate submissions
- Disable submit while saving
- Show success feedback
- Show meaningful error messages

---

# 57. Loading States

Every asynchronous page should have a loading state.

Examples:

```text
Loading players...
Loading memories...
Loading timeline...
```

Prefer skeleton loaders for content-heavy pages.

Avoid unnecessary full-screen spinners.

---

# 58. Error States

Every data-driven page should handle errors.

Example:

```text
Unable to load players.

Please try again.
[ Retry ]
```

Do not leave users staring at an empty page.

---

# 59. Empty States

Empty states should explain what happened.

Examples:

```text
No memories have been published yet.
```

Admin:

```text
No players added yet.

[ Add Player ]
```

---

# 60. Responsive Design

The website must be responsive from the beginning.

Breakpoints should follow the chosen CSS framework rather than introducing unnecessary custom breakpoints.

General behavior:

### Mobile

```text
Single-column layouts
Collapsed navigation
Large touch targets
Simplified timeline
Stacked forms
```

### Tablet

```text
2-column grids
Expanded navigation where space allows
```

### Desktop

```text
Multi-column grids
Large hero
Full navigation
Central timeline
```

---

# 61. Mobile Navigation

Mobile navigation must:

- Be easy to open
- Be easy to close
- Prevent accidental background interaction when open
- Have sufficiently large touch targets
- Preserve current-page indication

---

# 62. Accessibility

Accessibility is required for V1.

The UI should include:

- Semantic HTML
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation
- Visible focus states
- Accessible buttons
- Accessible form labels
- Sufficient color contrast
- Meaningful link text

Do not rely on color alone to communicate state.

---

# 63. Image Accessibility

All important images should have useful `alt` text.

Examples:

```text
"Rahul Das — NIST FC midfielder"
```

Decorative images may use empty alt text where appropriate.

---

# 64. Motion Design

Animations should enhance the experience without becoming distracting.

Use subtle:

- Fade
- Slide
- Scale
- Image zoom
- Hover transitions

Recommended duration:

```text
150ms – 400ms
```

Avoid long animations.

---

# 65. Scroll Animations

Scroll-based reveal animations may be used for:

- Section entrances
- Timeline events
- Memory cards
- Founder cards

But the content must remain fully usable without animation.

Respect:

```text
prefers-reduced-motion
```

---

# 66. Hover Behavior

Cards may have subtle hover interactions.

Example:

```text
Image
  ↓
Slight scale
  +
Overlay
  +
Arrow
```

Avoid excessive movement.

---

# 67. Icons

Use a consistent icon library.

Recommended:

```text
Lucide React
```

Icons should support the interface rather than replace important text.

---

# 68. Photography

Photography is one of the most important visual assets of NIST FC.

Prioritize:

- Team photographs
- Match/action photographs
- Tournament photographs
- Celebration photographs
- Historical photographs
- Founder photographs

Images should feel authentic.

Avoid excessive stock photography.

---

# 69. Image Treatment

Images may use:

- Dark overlays
- Subtle gradients
- Cropping
- Consistent aspect ratios

Do not heavily filter or artificially stylize historical photographs.

Historical images should retain their authenticity.

---

# 70. Content Density

The public website should prioritize visual storytelling.

Use:

```text
Large image
Short text
Clear heading
Strong spacing
```

rather than:

```text
Small image
Huge paragraph
Dense information
```

---

# 71. Page Transitions

Page transitions are optional.

If implemented, they should be:

- Fast
- Subtle
- Non-blocking

The website should never delay navigation for animation.

---

# 72. SEO-Friendly UI

Public pages should provide:

- Meaningful page titles
- Meta descriptions
- Semantic headings
- Descriptive image alt text
- Clean URLs
- Open Graph metadata where appropriate

Examples:

```text
/players/rahul-das
/memories/university-tournament-2025
```

are preferred over opaque IDs for public pages.

---

# 73. Public vs Admin Design

The two areas have different priorities.

### Public

```text
Visual
Emotional
Editorial
Story-driven
Photography-focused
```

### Admin

```text
Functional
Efficient
Information-dense
Form-focused
```

Do not force the public visual style onto the admin dashboard.

---

# 74. Component Design Principles

Components should be reusable.

Examples:

```text
Button
Container
SectionHeading
Navbar
Footer
PlayerCard
MemoryCard
TimelineEvent
FounderCard
ImageGallery
Lightbox
SearchBar
FilterBar
Pagination
EmptyState
LoadingState
ErrorState
Modal
```

Admin components:

```text
AdminSidebar
AdminHeader
DataTable
FormField
ImageUploader
ConfirmDialog
StatusBadge
```

---

# 75. Component Consistency

The same component should be reused rather than creating slightly different versions of the same UI.

For example:

Use:

```text
PlayerCard
```

instead of:

```text
HomePlayerCard
PlayersPagePlayerCard
MemoryPlayerCard
```

unless their visual requirements genuinely differ.

---

# 76. Design Tokens

Colors, spacing, typography, radii, shadows, and transitions should be centralized.

Example conceptual tokens:

```text
colors
spacing
fontSizes
fontWeights
radii
shadows
transitions
```

Avoid scattering hard-coded design values throughout components.

---

# 77. Tailwind CSS

Tailwind CSS will be used for styling.

The project should use the current official Tailwind/Vite integration rather than outdated configuration patterns.

Reusable design values should be centralized where practical.

Avoid excessive one-off utility combinations when a reusable component would be clearer.

---

# 78. Frontend Technology

The UI will use:

```text
React
Vite
Tailwind CSS
React Router
Axios
Lucide React
```

Additional dependencies should only be added when they solve a clear V1 requirement.

Do not install large UI frameworks unnecessarily.

---

# 79. Admin Table Behavior

Admin tables should support:

- Search
- Filtering where appropriate
- Sorting where useful
- Pagination
- Edit actions
- Delete actions
- Status display

On mobile, tables may transform into stacked cards rather than forcing horizontal scrolling wherever practical.

---

# 80. Confirmation Dialogs

Destructive operations require confirmation.

Examples:

```text
Delete Player?

This will permanently remove the player
and their associated image.

[Cancel] [Delete]
```

For archival:

```text
Mark Player as Former?

The player will remain in the historical archive.
```

Archival and permanent deletion must be visually distinct.

---

# 81. Toast Notifications

Use subtle toast notifications for actions such as:

```text
Player created successfully.
Memory updated successfully.
Timeline reordered successfully.
Image uploaded successfully.
```

Errors should also provide useful feedback.

Do not overuse notifications.

---

# 82. Form Unsaved Changes

For large forms such as memory creation/editing, the UI should avoid accidental loss of work.

Where practical, warn users before leaving a form with unsaved changes.

---

# 83. Player Status UI

Current:

```text
CURRENT
```

Former:

```text
FORMER
```

The design should not visually diminish former players.

Both statuses should remain readable and respectful.

---

# 84. Timeline Visual Identity

The timeline should feel like a historical journey rather than a database table.

Use:

- Strong year typography
- Timeline markers
- Connecting line
- Event imagery
- Short descriptions
- Memory links

Avoid overly complicated interactive timelines.

---

# 85. Memories Visual Identity

The memories section should feel more photographic and immersive than the rest of the website.

Use:

- Large imagery
- Editorial grid
- Strong crop consistency
- Spacious layout
- Lightbox
- Chronological navigation

---

# 86. Founders Visual Identity

The founders section should feel more historical and editorial.

Use:

- Portrait photography
- Strong names
- Short biographies
- Quotes
- Generous spacing

Avoid making founders look like ordinary roster players.

---

# 87. Homepage Visual Hierarchy

The homepage should generally follow:

```text
Hero
  ↓
Identity
  ↓
Current Team
  ↓
Latest Memories
  ↓
Journey
  ↓
Founders
  ↓
Footer
```

This tells the story:

```text
Who we are
     ↓
Who represents us
     ↓
What we have experienced
     ↓
How we got here
     ↓
Who started it
```

---

# 88. Public Page Consistency

Every public page should share:

- Same navbar
- Same container system
- Same typography
- Same spacing system
- Same button language
- Same footer
- Same motion principles

Individual pages may have different layouts while maintaining the same design language.

---

# 89. Admin Page Consistency

Every admin page should share:

- Same sidebar
- Same header
- Same buttons
- Same form controls
- Same tables
- Same status badges
- Same notification system
- Same confirmation dialogs

---

# 90. Performance

The UI must prioritize performance.

Images should use:

- Responsive sizing
- Lazy loading where appropriate
- Cloudinary transformations
- Proper aspect ratios
- Optimized formats

Do not load every memory image at full resolution immediately.

---

# 91. Gallery Performance

Memory galleries can contain many images.

Use:

- Lazy loading
- Responsive thumbnails
- Optimized Cloudinary URLs
- Lightbox loading for larger versions

Only load high-resolution images when necessary.

---

# 92. Accessibility + Performance Balance

Do not sacrifice accessibility for visual effects.

Do not sacrifice performance for animations.

The site should feel:

```text
Fast
Clear
Responsive
Accessible
```

---

# 93. V1 Visual Priorities

Priority order:

```text
1. Strong football identity
2. High-quality photography
3. Clear typography
4. Simple navigation
5. Strong player presentation
6. Immersive memories
7. Historical timeline
8. Founder presentation
9. Responsive behavior
10. Subtle motion
```

---

# 94. Things to Avoid

Do not use:

- Excessive gradients
- Excessive glassmorphism
- Neon colors
- Heavy shadows
- Huge amounts of animation
- Generic stock football imagery
- Overly rounded cards
- Cluttered dashboards
- Tiny typography
- Excessive text
- Auto-playing audio
- Background video unless specifically approved
- Infinite scrolling for core archive content
- Unnecessary carousels
- Dark patterns
- Decorative UI that reduces usability

---

# 95. V1 Design Definition of Done

The UI is considered complete when:

- [ ] Public navbar implemented
- [ ] Mobile navigation implemented
- [ ] Footer implemented
- [ ] Homepage implemented
- [ ] Players page implemented
- [ ] Player cards implemented
- [ ] Player profile implemented
- [ ] Player search implemented
- [ ] Player filters implemented
- [ ] Memories page implemented
- [ ] Memory cards implemented
- [ ] Memory detail implemented
- [ ] Gallery implemented
- [ ] Lightbox implemented
- [ ] Previous/Next memory navigation implemented
- [ ] Timeline implemented
- [ ] Timeline-memory links implemented
- [ ] Founders page implemented
- [ ] About page implemented
- [ ] Admin login UI implemented
- [ ] Admin dashboard implemented
- [ ] Admin player management UI implemented
- [ ] Admin memory management UI implemented
- [ ] Admin timeline management UI implemented
- [ ] Admin founder management UI implemented
- [ ] Responsive layouts implemented
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Accessibility basics implemented
- [ ] Image optimization implemented
- [ ] Consistent design tokens implemented
- [ ] Reduced-motion support implemented
- [ ] Public SEO basics implemented

---

# 96. Final Design Principle

NIST FC should feel like a website that the team can still be proud of years from now.

The interface should not chase temporary design trends.

The core experience should remain:

```text
Identity
+
People
+
Memories
+
History
+
Football
```

The design should make visitors feel that they are exploring the story of a real football team rather than browsing a software project.

---

# 97. Final Status

**UI_DESIGN.md — FINALIZED**

This document defines the visual and interaction direction for NIST FC V1.

Claude Code should use this document together with:

```text
PROJECT_SPEC.md
FEATURES.md
SITE_MAP.md
DATABASE.md
API.md
AUTH.md
```

before implementing the frontend.

Any significant change to the visual identity, navigation architecture, page structure, or core user experience should be reviewed before implementation.
