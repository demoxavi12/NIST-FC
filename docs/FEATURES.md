# NIST FC — Feature Specification

## 1. Purpose

This document defines the features included in the NIST FC website.

NIST FC is a digital home and historical archive for the NIST University men's football team.

The V1 product focuses on:

- Players
- Memories
- Team history
- Founders
- Administration
- Image management

The application should remain simple, fast, visually strong, and easy for future NIST FC administrators to maintain.

---

# 2. V1 Feature Overview

```text
NIST FC
│
├── Public Website
│   ├── Home
│   ├── Players
│   ├── Player Profile
│   ├── Search & Filters
│   ├── Memories
│   ├── Memory Detail
│   ├── Timeline
│   ├── Founders
│   └── About
│
├── Admin Panel
│   ├── Authentication
│   ├── Dashboard
│   ├── Player Management
│   ├── Memory Management
│   ├── Timeline Management
│   └── Founder Management
│
└── Infrastructure
    ├── MongoDB
    ├── Express API
    ├── Cloudinary
    └── Authentication
```

---

# 3. Public Website

## 3.1 Home Page

The homepage introduces NIST FC and provides entry points to the major sections of the website.

### Features

- NIST FC branding
- Hero section
- Team introduction
- Featured/current players
- Latest memories
- Timeline/history preview
- Founders preview
- Navigation
- Footer
- Social links if required

### Dynamic Content

Content such as players, memories, and timeline events should come from the backend rather than being hardcoded into the frontend.

---

# 4. Player System

The player system is one of the primary features of the website.

The archive will contain both current and former NIST FC players.

## 4.1 Player Status

Every player has a status:

```text
Current
Former
```

When a player leaves the team, the administrator changes:

```text
Current → Former
```

Former players are not deleted simply because they are no longer active.

This preserves the historical archive.

---

## 4.2 Player Information

The initial player profile contains only:

```text
Name
Photo
Position
Batch
Branch
Bio
Status
```

Example:

```text
Name: Arjun Kumar
Photo: Player photograph
Position: Right Winger
Batch: 2023
Branch: CSE
Bio: Short player biography
Status: Current
```

No player statistics are included in V1.

---

## 4.3 Player Directory

Visitors can browse all players.

The directory is divided into:

```text
Current Players
Former Players
```

### Features

- Player card grid
- Search
- Position filter
- Batch filter
- Branch filter
- Current/former filter
- Responsive layout

---

## 4.4 Player Cards

Each player is represented by a football-inspired visual card.

The card displays:

```text
Photo
Name
Position
Batch
Branch
```

The design may take inspiration from football game cards but must have its own NIST FC visual identity.

---

## 4.5 Player Profile

Clicking a player card opens the player's profile.

The profile contains:

```text
Photo
Name
Position
Batch
Branch
Bio
```

If the player is associated with memories, those memories may also be displayed on the profile.

---

# 5. Player Search

Visitors can search players by name.

Example:

```text
Search: Arjun

→ Arjun Kumar
```

Search should support partial matches where practical.

---

# 6. Player Filters

Visitors can filter players by:

### Status

```text
All
Current
Former
```

### Position

```text
All
Goalkeeper
Defender
Midfielder
Forward
```

The exact position values can be expanded if required.

### Batch

Example:

```text
All
2022
2023
2024
2025
...
```

### Branch

Example:

```text
All
CSE
ECE
EEE
...
```

---

# 7. Memory System

Memories form the visual archive of NIST FC.

The system will use a **single chronological memory/photo gallery** rather than separate permanent album categories.

Memories may represent:

- Matches
- Tournaments
- Training
- Team gatherings
- Celebrations
- Trips
- Farewells
- Important team moments
- Historical photographs

---

# 8. Memory Gallery

The public Memories section displays team memories in chronological order.

### Default ordering

The newest memory/event appears first.

Example:

```text
2026
Latest Event

2025
Event

2024
Event

2023
Event

2022
First Event
```

Visitors can then explore older memories through the historical sequence.

---

# 9. Memory Detail

Opening a memory displays:

```text
Title
Date
Location
Description
Cover Photo
Photo Gallery
Players Involved
Tags
```

Example:

```text
NIST Football Championship 2025

December 12, 2025
NIST University

Description...

[Photo]
[Photo]
[Photo]

Players:
Arjun
Rahul
Aman
```

---

# 10. Memory Photo Gallery

A memory can contain multiple photographs.

Requirements:

- Multiple image upload
- Image preview
- Responsive gallery
- Full-size image viewing
- Optimized image delivery
- Ability to associate players with the memory

Cloudinary will handle image storage, optimization, and delivery.

---

# 11. Player ↔ Memory Relationship

Administrators can associate players with memories.

Example:

```text
Memory:
Championship 2025

Players:
├── Arjun
├── Rahul
├── Aman
└── Sourav
```

This allows a player's profile to show memories involving that player.

The relationship should work in both directions:

```text
Player
  ↓
Memories involving player
```

and:

```text
Memory
  ↓
Players involved
```

---

# 12. Timeline

The timeline represents the history and development of NIST FC.

It is a chronological record of important events rather than a statistics system.

Example:

```text
2022
Team Founded
     │
2023
Major Event
     │
2024
Tournament
     │
2025
Championship
     │
2026
Latest Event
```

---

# 13. Timeline Events

Each timeline event can contain:

```text
Title
Date / Year
Description
Image
Category
Associated Memory
```

A timeline event may have an associated photo/memory collection.

This connects the team's history with its visual archive.

---

# 14. Timeline Ordering

Administrators can manually control the order of timeline events.

The system should allow administrators to:

- Add events
- Edit events
- Delete events
- Change event order
- Set event dates
- Associate memories
- Upload event images

The public timeline should respect the administrator-defined ordering.

New events should appear in chronological position by default, while still allowing administrators to manually adjust the order.

---

# 15. Memories and Timeline Relationship

The memory system and timeline system are connected but are not the same thing.

Example:

```text
Timeline Event
│
├── Title
├── Date
├── Description
│
└── Associated Memory
      │
      ├── Photo
      ├── Photo
      ├── Photo
      └── Photo
```

This allows the website to present NIST FC's history as a journey through real photographs and memories.

---

# 16. Historical Journey

The public website should allow visitors to explore the team's history from the latest events toward the earliest events.

The latest memories appear first.

Visitors can select a memory/event and then continue exploring the chronological history of NIST FC.

The experience should feel like exploring the team's journey rather than browsing an unrelated collection of photographs.

---

# 17. Founders

The website contains a dedicated founders/co-founders section.

Each founder contains:

```text
Name
Photo
Role
Batch
Branch
Bio
Quote
```

The section is intended to preserve information about the people responsible for establishing NIST FC.

---

# 18. Admin Authentication

The admin panel must be protected.

Administrators log in using:

```text
Email
Password
```

Successful authentication provides access to the admin dashboard.

Unauthenticated users must not be able to access protected admin functionality or admin APIs.

---

# 19. Admin Dashboard

The dashboard provides an overview of the website.

Potential statistics:

```text
Players
Memories
Timeline Events
Founders
```

The dashboard should also provide quick actions:

```text
Add Player
Add Memory
Add Timeline Event
Add Founder
```

---

# 20. Admin — Player Management

Administrators can:

- View players
- Add players
- Edit players
- Delete players
- Change player status
- Upload player photographs

### Add/Edit Player

```text
Name *
Photo *
Position *
Batch *
Branch *
Bio
Status *
```

A player can be changed from:

```text
Current → Former
```

without deleting the player's record.

---

# 21. Admin — Memory Management

Administrators can:

- View memories
- Create memories
- Edit memories
- Delete memories
- Upload cover photographs
- Upload multiple photographs
- Associate players
- Add tags
- Publish/unpublish memories
- Change memory order if required

### Add/Edit Memory

```text
Title *
Description
Date
Location
Cover Image
Photos
Players
Tags
Published
```

---

# 22. Admin — Timeline Management

Administrators can:

- View timeline events
- Create events
- Edit events
- Delete events
- Upload event images
- Associate memories
- Change event order
- Publish/unpublish events

Administrators have manual control over the final presentation order.

---

# 23. Admin — Founder Management

Administrators can:

- View founders
- Add founders
- Edit founders
- Delete founders
- Upload founder photographs
- Change founder display order

---

# 24. Cloudinary Image Management

Cloudinary will be used for image storage and delivery.

The initial implementation will use the Cloudinary Free Plan.

Images may include:

```text
Player Photos
Memory Photos
Founder Photos
Timeline Images
Team Photos
```

MongoDB stores image references/URLs rather than raw image files.

### Architecture

```text
Admin
  ↓
Admin Panel
  ↓
Backend
  ↓
Cloudinary
  ↓
Image URL
  ↓
MongoDB
  ↓
Public Website
```

The application should avoid exposing Cloudinary secrets in frontend code.

---

# 25. Responsive Design

The public website must support:

```text
Desktop
Laptop
Tablet
Mobile
```

The following are especially important on mobile:

- Player cards
- Player profiles
- Memory galleries
- Timeline
- Navigation

The admin panel should also be usable on smaller screens, although desktop is the primary administration environment.

---

# 26. Loading and Error States

Data-driven features must provide appropriate states.

### Loading

```text
Loading players...
Loading memories...
Loading timeline...
```

### Empty

```text
No players found.
No memories found.
```

### Error

```text
Something went wrong.
Please try again.
```

Images should also have appropriate loading/fallback behavior.

---

# 27. SEO

Basic SEO should be implemented for public pages.

Requirements include:

- Page titles
- Meta descriptions
- Semantic HTML
- Proper heading hierarchy
- Clean URLs

Example:

```text
/players/arjun-kumar
```

rather than:

```text
/player?id=123
```

---

# 28. Security

The application should implement:

- Admin authentication
- Password hashing
- Protected admin frontend routes
- Protected admin API endpoints
- Input validation
- Secure environment variables
- Proper error handling
- No secrets in frontend source code
- No secrets committed to Git

---

# 29. V1 Out of Scope

The following are intentionally excluded from V1:

```text
Player statistics
Goals
Assists
Match statistics
Live scores
Player ratings
Chat
Social networking
Notifications
Mobile application
AI chatbot
Fantasy football
Advanced analytics
```

---

# 30. Future Features

Possible future versions may include:

```text
Match Archive
Season Pages
Tournament Archive
Match Results
Captains
Coaches
Awards
Trophies
Player Statistics
Player Submission System
Google Form Integration
Advanced Search
```

These should not be implemented in V1.

---

# 31. Definition of Done

NIST FC V1 is considered complete when:

## Public Website

- [ ] Home works
- [ ] Players page works
- [ ] Current players work
- [ ] Former players work
- [ ] Player profiles work
- [ ] Player search works
- [ ] Player filters work
- [ ] Memories page works
- [ ] Memory detail works
- [ ] Memory photo galleries work
- [ ] Player-memory relationships work
- [ ] Timeline works
- [ ] Timeline ordering works
- [ ] Founders section works
- [ ] About page works
- [ ] Responsive design works

## Admin Panel

- [ ] Admin login works
- [ ] Dashboard works
- [ ] Player management works
- [ ] Memory management works
- [ ] Timeline management works
- [ ] Founder management works
- [ ] Image uploads work
- [ ] Admin authentication protects private functionality

## Infrastructure

- [ ] MongoDB is connected
- [ ] Express API is working
- [ ] Cloudinary is connected
- [ ] Image URLs are stored correctly
- [ ] Environment variables are configured
- [ ] Basic SEO is implemented
- [ ] Error states are handled
- [ ] Production deployment works

---

# 32. Core V1 Principle

NIST FC should prioritize **preserving the people and history of the team** over adding unnecessary football statistics or social features.

The website should remain useful even years after the current players have graduated.

The goal is to create a digital archive that future NIST FC players can continue to build upon.
