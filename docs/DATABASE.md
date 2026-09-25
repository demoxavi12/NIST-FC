# NIST FC — Database Design

## 1. Database Overview

NIST FC uses **MongoDB** as its primary database and **Mongoose** as the ODM.

### Database

```text
MongoDB Atlas
    ↓
MongoDB Database
    ↓
nist-fc
```

The database stores:

- Player information
- Memory/event information
- Timeline events
- Founder information
- Administrator accounts
- Relationships between players, memories, and timeline events

Images are **not stored directly in MongoDB**.

All images are stored in **Cloudinary**. MongoDB stores only the image URL and Cloudinary public ID.

---

# 2. V1 Collections

The V1 database contains five collections:

```text
admins
players
memories
timelineEvents
founders
```

### Collection responsibilities

| Collection       | Purpose                                |
| ---------------- | -------------------------------------- |
| `admins`         | Administrator authentication and roles |
| `players`        | Current and former NIST FC players     |
| `memories`       | Historical photos/events and galleries |
| `timelineEvents` | Important events in NIST FC history    |
| `founders`       | NIST FC founders/co-founders           |

No additional collections are required for V1.

The following are intentionally **not separate collections**:

- Photos
- Albums
- Matches
- Seasons
- Statistics
- Results
- Player submissions
- Google Form submissions

These may be introduced in future versions if required.

---

# 3. Common Database Conventions

## 3.1 Primary IDs

MongoDB's default `ObjectId` is used for document IDs.

Example:

```text
_id: ObjectId("...")
```

Relationships between documents use MongoDB `ObjectId` references.

---

## 3.2 Timestamps

All major collections use:

```text
createdAt
updatedAt
```

Mongoose timestamps should automatically generate these fields.

---

## 3.3 String Formatting

Names, titles, descriptions, and other user-facing text are stored as strings.

Leading/trailing whitespace should be removed during validation.

---

## 3.4 Slugs

Publicly accessible players and memories use unique URL-friendly slugs.

Example:

```text
name: "Rahul Das"
slug: "rahul-das"
```

Example URL:

```text
/players/rahul-das
```

Memory example:

```text
title: "Inter University Tournament 2025"
slug: "inter-university-tournament-2025"
```

Example URL:

```text
/memories/inter-university-tournament-2025
```

Slugs must be unique within their respective collections.

---

# 4. Players Collection

Collection:

```text
players
```

Purpose:

Stores all NIST FC players, including both current and former players.

The player archive is intended to preserve the team's history.

---

## 4.1 Player Schema

```text
Player
├── _id
├── name
├── slug
├── photo
│   ├── url
│   └── publicId
├── position
├── batch
├── branch
├── bio
├── status
├── createdAt
└── updatedAt
```

---

## 4.2 Player Fields

| Field            | Type     | Required | Description                    |
| ---------------- | -------- | -------: | ------------------------------ |
| `_id`            | ObjectId |      Yes | MongoDB document ID            |
| `name`           | String   |      Yes | Player's name                  |
| `slug`           | String   |      Yes | Unique URL-friendly identifier |
| `photo`          | Object   |      Yes | Cloudinary image reference     |
| `photo.url`      | String   |      Yes | Public Cloudinary image URL    |
| `photo.publicId` | String   |      Yes | Cloudinary public ID           |
| `position`       | String   |      Yes | Player's football position     |
| `batch`          | Number   |      Yes | Academic batch year            |
| `branch`         | String   |      Yes | Academic branch                |
| `bio`            | String   |       No | Short player biography         |
| `status`         | String   |      Yes | `current` or `former`          |
| `createdAt`      | Date     |      Yes | Creation timestamp             |
| `updatedAt`      | Date     |      Yes | Last modification timestamp    |

---

## 4.3 Player Position

The position is stored as a string.

Example values:

```text
Goalkeeper
Defender
Midfielder
Forward
```

The exact set can be expanded later if NIST FC requires more specific positions.

---

## 4.4 Player Batch

Batch is stored as a simple year.

Example:

```text
2023
2024
2025
```

No separate `Batch` collection is required.

---

## 4.5 Player Status

Allowed values:

```text
current
former
```

### Current

The player is currently part of NIST FC.

### Former

The player was previously part of NIST FC but is no longer a current player.

---

## 4.6 Player Archival Rule

A player leaving the team should normally **not be deleted**.

Instead:

```text
current → former
```

This preserves the historical archive.

Example:

```text
Before:
status = "current"

After leaving:
status = "former"
```

The player's memories and historical relationships remain intact.

---

## 4.7 Player Photo

Player photos are stored in Cloudinary.

MongoDB stores:

```js
{
  url: String,
  publicId: String
}
```

Example:

```text
photo:
{
  url: "https://res.cloudinary.com/...",
  publicId: "nist-fc/players/rahul-das"
}
```

---

# 5. Memories Collection

Collection:

```text
memories
```

Purpose:

Stores the chronological visual history of NIST FC.

A memory represents an important event, occasion, tournament, trip, celebration, gathering, or other historical team moment.

---

# 5.1 Memory Schema

```text
Memory
├── _id
├── title
├── slug
├── description
├── date
├── location
├── coverImage
│   ├── url
│   └── publicId
├── photos[]
│   ├── url
│   └── publicId
├── players[]
├── tags[]
├── published
├── createdAt
└── updatedAt
```

---

# 5.2 Memory Fields

| Field         | Type       | Required | Description                    |
| ------------- | ---------- | -------: | ------------------------------ |
| `_id`         | ObjectId   |      Yes | MongoDB document ID            |
| `title`       | String     |      Yes | Memory/event title             |
| `slug`        | String     |      Yes | Unique URL-friendly identifier |
| `description` | String     |       No | Description of the memory      |
| `date`        | Date       |      Yes | Date of the event              |
| `location`    | String     |       No | Event location                 |
| `coverImage`  | Object     |      Yes | Main/thumbnail image           |
| `photos`      | Array      |      Yes | Gallery images                 |
| `players`     | [ObjectId] |       No | Referenced players             |
| `tags`        | [String]   |       No | Optional descriptive tags      |
| `published`   | Boolean    |      Yes | Public visibility state        |
| `createdAt`   | Date       |      Yes | Creation timestamp             |
| `updatedAt`   | Date       |      Yes | Last modification timestamp    |

---

# 5.3 Memory Images

Each memory image uses:

```js
{
  url: String,
  publicId: String
}
```

The `coverImage` is the primary image shown on memory cards.

The `photos` array contains the complete gallery.

Example:

```js
coverImage: {
  url: "https://res.cloudinary.com/...",
  publicId: "nist-fc/memories/tournament-2025/cover"
}
```

---

# 5.4 Memory Gallery

There is **no separate Photo collection** in V1.

All photos belonging to one memory are stored inside the memory document.

Example:

```js
photos: [
  {
    url: "https://res.cloudinary.com/...",
    publicId: "nist-fc/memories/tournament-2025/photo-1",
  },
  {
    url: "https://res.cloudinary.com/...",
    publicId: "nist-fc/memories/tournament-2025/photo-2",
  },
];
```

This keeps the V1 architecture simple.

---

# 5.5 Memory → Players Relationship

A memory can contain multiple players.

Example:

```js
players: [
  ObjectId("player-id-1"),
  ObjectId("player-id-2"),
  ObjectId("player-id-3"),
];
```

Relationship:

```text
Player ←→ Memory
```

This is a many-to-many relationship.

It allows:

### Player profile

```text
Player
  ↓
Memories involving this player
```

### Memory page

```text
Memory
  ↓
Players involved in this memory
```

---

# 5.6 Memory Ordering

Public memories are displayed chronologically:

```text
Latest → Oldest
```

The primary ordering field is:

```text
date
```

Typical query:

```text
sort by date descending
```

V1 does not require a separate manual memory ordering field.

---

# 5.7 Memory Publishing

Memories have:

```text
published: true / false
```

This allows administrators to create or edit memories without immediately displaying them publicly.

Only:

```text
published = true
```

memories should appear in public pages.

---

# 6. Timeline Events Collection

Collection:

```text
timelineEvents
```

Purpose:

Stores major historical events and milestones in NIST FC's journey.

Timeline events are separate from memories.

A timeline event may optionally link to a memory.

---

# 6.1 Timeline Event Schema

```text
TimelineEvent
├── _id
├── title
├── date
├── year
├── description
├── image
│   ├── url
│   └── publicId
├── category
├── memory
├── order
├── published
├── createdAt
└── updatedAt
```

---

# 6.2 Timeline Event Fields

| Field         | Type     | Required | Description                 |
| ------------- | -------- | -------: | --------------------------- |
| `_id`         | ObjectId |      Yes | MongoDB document ID         |
| `title`       | String   |      Yes | Event title                 |
| `date`        | Date     |       No | Exact event date if known   |
| `year`        | Number   |      Yes | Event year                  |
| `description` | String   |       No | Event description           |
| `image`       | Object   |       No | Cloudinary image            |
| `category`    | String   |      Yes | Event category              |
| `memory`      | ObjectId |       No | Optional related memory     |
| `order`       | Number   |      Yes | Manual display order        |
| `published`   | Boolean  |      Yes | Public visibility           |
| `createdAt`   | Date     |      Yes | Creation timestamp          |
| `updatedAt`   | Date     |      Yes | Last modification timestamp |

---

# 6.3 Timeline Categories

Initial V1 categories:

```text
founding
tournament
achievement
milestone
team
event
other
```

The category list may be expanded later.

---

# 6.4 Timeline Ordering

Timeline events contain:

```text
order
```

This allows administrators to manually control the displayed sequence.

This is important because some historical events may not have exact dates.

Example:

```text
order: 1
order: 2
order: 3
```

Lower values appear earlier in the configured timeline sequence.

The admin panel must allow administrators to reorder timeline events.

---

# 6.5 Timeline Event → Memory

A timeline event can optionally reference one memory:

```text
TimelineEvent.memory
        ↓
Memory._id
```

Example:

```text
Timeline Event:
"First University Tournament"

        ↓

Memory:
"University Tournament 2023"
```

A timeline event does not require a memory.

---

# 6.6 Memory → Timeline Event

A memory does not require a timeline event.

This means:

```text
Timeline Event → optional Memory
Memory → independent
```

This keeps the relationship simple for V1.

---

# 7. Founders Collection

Collection:

```text
founders
```

Purpose:

Stores information about the founders/co-founders of NIST FC.

---

# 7.1 Founder Schema

```text
Founder
├── _id
├── name
├── slug
├── photo
│   ├── url
│   └── publicId
├── role
├── batch
├── branch
├── bio
├── quote
├── displayOrder
├── published
├── createdAt
└── updatedAt
```

---

# 7.2 Founder Fields

| Field          | Type     | Required | Description                 |
| -------------- | -------- | -------: | --------------------------- |
| `_id`          | ObjectId |      Yes | MongoDB document ID         |
| `name`         | String   |      Yes | Founder name                |
| `slug`         | String   |      Yes | URL-friendly identifier     |
| `photo`        | Object   |      Yes | Cloudinary image            |
| `role`         | String   |      Yes | Founder/co-founder role     |
| `batch`        | Number   |       No | Academic batch              |
| `branch`       | String   |       No | Academic branch             |
| `bio`          | String   |       No | Founder biography           |
| `quote`        | String   |       No | Optional founder quote      |
| `displayOrder` | Number   |      Yes | Manual display order        |
| `published`    | Boolean  |      Yes | Public visibility           |
| `createdAt`    | Date     |      Yes | Creation timestamp          |
| `updatedAt`    | Date     |      Yes | Last modification timestamp |

---

# 7.3 Founder Ordering

Founders use:

```text
displayOrder
```

to control their order on the public page.

Example:

```text
displayOrder: 1
displayOrder: 2
displayOrder: 3
```

---

# 8. Admins Collection

Collection:

```text
admins
```

Purpose:

Stores authorized administrators who can manage NIST FC content.

---

# 8.1 Admin Schema

```text
Admin
├── _id
├── name
├── email
├── passwordHash
├── role
├── createdAt
└── updatedAt
```

---

# 8.2 Admin Fields

| Field          | Type     | Required | Description                 |
| -------------- | -------- | -------: | --------------------------- |
| `_id`          | ObjectId |      Yes | MongoDB document ID         |
| `name`         | String   |      Yes | Admin's name                |
| `email`        | String   |      Yes | Login email                 |
| `passwordHash` | String   |      Yes | Hashed password             |
| `role`         | String   |      Yes | Admin role                  |
| `createdAt`    | Date     |      Yes | Creation timestamp          |
| `updatedAt`    | Date     |      Yes | Last modification timestamp |

---

# 8.3 Admin Roles

V1 supports:

```text
admin
```

The schema also allows:

```text
superAdmin
```

for future use.

Initially, the project may have approximately 2–3 administrators.

All initial administrators can use:

```text
role = "admin"
```

Role-based permissions can be expanded later.

---

# 8.4 Password Security

Passwords must **never** be stored directly.

Only:

```text
passwordHash
```

is stored.

Password hashing will use:

```text
bcrypt
```

Authentication will use JWT.

The exact JWT implementation, cookie strategy, expiration, and middleware will be finalized in the API/security architecture document.

---

# 9. Cloudinary Image Storage

Cloudinary is the image storage provider for V1.

MongoDB stores image references rather than image files.

---

# 9.1 Standard Image Object

All single images use:

```js
{
  url: String,
  publicId: String
}
```

Used for:

- Player photos
- Founder photos
- Timeline images
- Memory cover images
- Memory gallery images

---

# 9.2 Cloudinary Folder Structure

Images should be organized using predictable folders:

```text
nist-fc/
├── players/
├── memories/
├── timeline/
└── founders/
```

Example:

```text
nist-fc/players/rahul-das
```

```text
nist-fc/memories/university-tournament-2025
```

```text
nist-fc/timeline/founding
```

```text
nist-fc/founders/founder-name
```

---

# 9.3 Image Deletion

When an image is replaced or a content record is permanently deleted, the corresponding Cloudinary asset should also be handled appropriately.

Image cleanup must be implemented through the backend rather than relying on the frontend.

The backend should use the stored:

```text
publicId
```

to identify Cloudinary assets.

---

# 10. Database Relationships

## 10.1 Player ↔ Memory

Many-to-many relationship.

```text
Player
  ↕
Memory
```

Implementation:

```text
Memory.players[]
        ↓
Player._id
```

A player can appear in many memories.

A memory can contain many players.

---

## 10.2 Timeline Event → Memory

Optional one-to-one reference from the timeline event side.

```text
TimelineEvent
       │
       ↓
    Memory
```

Implementation:

```text
TimelineEvent.memory
        ↓
Memory._id
```

A timeline event may have no memory.

---

## 10.3 Founders

Founders are independent historical records.

```text
Founder
```

No V1 foreign-key relationships are required.

---

## 10.4 Admins

Admins are independent authentication records.

```text
Admin
```

They manage other collections through the API but do not need document references to them.

---

# 11. Database Indexes

Indexes should be added where they provide meaningful query performance.

## Players

```text
slug       → unique
name       → indexed/searchable
status     → indexed
position   → indexed
batch      → indexed
branch     → indexed
```

---

## Memories

```text
slug       → unique
date       → indexed
players    → indexed
published  → indexed
```

---

## Timeline Events

```text
order      → indexed
year       → indexed
published  → indexed
memory     → indexed
```

---

## Founders

```text
slug          → unique
displayOrder  → indexed
published     → indexed
```

---

## Admins

```text
email → unique
```

Admin emails should be normalized to lowercase.

---

# 12. Query Requirements

The database design must support the following V1 queries efficiently.

## Players

```text
Get all current players
Get all former players
Get player by slug
Search player by name
Filter by position
Filter by batch
Filter by branch
Filter by status
Get memories involving a player
```

---

## Memories

```text
Get published memories
Get memory by slug
Get latest memories
Get older memories
Get memories involving a player
Get previous memory
Get next memory
```

---

## Timeline

```text
Get published timeline events
Get timeline ordered by admin-defined order
Get timeline event by ID
Get associated memory
```

---

## Founders

```text
Get published founders
Get founders ordered by displayOrder
Get founder by slug
```

---

# 13. Publishing Rules

The following content types support:

```text
published: Boolean
```

### Published

```text
published = true
```

The content can appear on the public website.

### Unpublished

```text
published = false
```

The content remains accessible to administrators but is hidden from the public website.

---

# 14. Deletion and Archival Rules

## Players

Normal departure:

```text
current → former
```

Do not delete the player simply because they leave the team.

This preserves:

- Player profile
- Historical identity
- Memory relationships
- Team history

Permanent player deletion should be treated as an exceptional administrative action.

---

## Memories

A memory can be permanently deleted by an authorized administrator when necessary.

Before permanent deletion, associated Cloudinary images must also be considered for cleanup.

---

## Timeline Events

Timeline events can be permanently deleted by authorized administrators when necessary.

If the event references a memory, deleting the timeline event should **not automatically delete the memory**.

The memory remains independent.

---

## Founders

Founder records can be permanently deleted by authorized administrators when necessary.

Associated Cloudinary images should be cleaned up appropriately.

---

## Admins

Administrator accounts should only be deleted or modified by an authorized administrator.

Future Super Admin functionality can provide additional protection around administrator management.

---

# 15. Data Integrity Rules

The backend must validate all incoming data.

Important rules include:

### Players

- `name` required
- `slug` unique
- `photo.url` required
- `photo.publicId` required
- `position` required
- `batch` required
- `branch` required
- `status` must be `current` or `former`

### Memories

- `title` required
- `slug` unique
- `date` required
- `coverImage` required
- `photos` must contain valid image references
- referenced player IDs must be valid MongoDB ObjectIds

### Timeline Events

- `title` required
- `year` required
- `category` required
- `order` required
- referenced memory must be a valid ObjectId when provided

### Founders

- `name` required
- `slug` unique
- `photo` required
- `role` required
- `displayOrder` required

### Admins

- `name` required
- `email` required and unique
- `passwordHash` required
- `role` required

---

# 16. Referential Integrity

Because MongoDB does not enforce foreign keys in the same way as a relational database, the application layer must maintain relationships.

For example:

```text
Memory.players[]
```

must reference valid player IDs.

If a player is archived as:

```text
status = "former"
```

their existing memory relationships remain valid.

If a player is permanently deleted, the backend must handle their references in memories appropriately.

Permanent deletion behavior should therefore be carefully controlled by the admin system.

---

# 17. Database Model Overview

```text
┌─────────────────────┐
│       Admin         │
│                     │
│ _id                 │
│ name                │
│ email               │
│ passwordHash        │
│ role                │
└──────────┬──────────┘
           │
           │ manages
           │
     ┌─────┼───────────────┬───────────────┐
     │     │               │               │
     ▼     ▼               ▼               ▼
┌────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────┐
│ Player │ │  Memory    │ │ TimelineEvent│ │ Founder  │
└───┬────┘ └─────┬──────┘ └──────┬───────┘ └──────────┘
    │             │               │
    │             │               │
    └─────────────┘               │
       many-to-many               │
                                  │
                                  ▼
                               Memory
```

---

# 18. Final V1 Schema Summary

## Admin

```text
Admin
├── _id
├── name
├── email
├── passwordHash
├── role
├── createdAt
└── updatedAt
```

## Player

```text
Player
├── _id
├── name
├── slug
├── photo
├── position
├── batch
├── branch
├── bio
├── status
├── createdAt
└── updatedAt
```

## Memory

```text
Memory
├── _id
├── title
├── slug
├── description
├── date
├── location
├── coverImage
├── photos[]
├── players[]
├── tags[]
├── published
├── createdAt
└── updatedAt
```

## Timeline Event

```text
TimelineEvent
├── _id
├── title
├── date
├── year
├── description
├── image
├── category
├── memory
├── order
├── published
├── createdAt
└── updatedAt
```

## Founder

```text
Founder
├── _id
├── name
├── slug
├── photo
├── role
├── batch
├── branch
├── bio
├── quote
├── displayOrder
├── published
├── createdAt
└── updatedAt
```

---

# 19. Final V1 Collections

The finalized V1 database consists of exactly:

```text
admins
players
memories
timelineEvents
founders
```

No additional collection should be introduced during implementation unless a new product requirement requires it.

Any proposed database schema change must be reviewed before implementation.

---

# 20. Out of Scope

The following are intentionally excluded from the V1 database:

```text
Player statistics
Goals
Assists
Appearances
Match results
Fixtures
Live scores
Seasons
Tournament records
Awards
Captains
Coaches
Comments
Likes
Chat
Notifications
Social networking
Google Form submissions
Player self-registration
Player approval queue
AI-generated content
```

These may be considered for future versions.

---

# 21. Future Database Extensions

Potential V2/V3 collections include:

```text
matches
seasons
tournaments
playerStats
awards
submissions
coaches
captains
```

These should only be introduced when the corresponding product features are approved.

---

# 22. Database Design Principles

The NIST FC database follows these principles:

1. Keep V1 simple.
2. Preserve historical player records.
3. Store images in Cloudinary, not MongoDB.
4. Use ObjectId references for relationships.
5. Avoid unnecessary collections.
6. Keep Memories and Timeline as separate concepts.
7. Keep player information minimal.
8. Validate all data through the backend.
9. Protect administrator data.
10. Do not introduce new collections without a product requirement.
11. Prefer archival over deletion for historical football records.
12. Keep the schema extensible for future NIST FC features.

---

# 23. Final Status

**DATABASE.md — FINALIZED**

The database architecture is considered approved for V1 implementation.

The next architecture document should define the backend API and authentication contract before backend implementation begins.
