# NIST FC — API Specification

## 1. API Overview

The NIST FC backend provides a REST API for:

- Public website content
- Admin authentication
- Player management
- Memory management
- Timeline management
- Founder management
- Cloudinary image uploads

Backend stack:

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcrypt
Cloudinary
Multer
```

The API follows a RESTful architecture.

---

# 2. Base URL

All API endpoints are prefixed with:

```text
/api
```

### Frontend base path

The frontend always calls the API using the relative base path:

```text
/api
```

in both development and production. Frontend components must not hard-code a backend host such as `http://localhost:5000`.

### Development

The Express server listens locally on `PORT` (default `5000`):

```text
http://localhost:5000/api
```

The Vite dev server proxies `/api` requests to this backend. The proxy target is configured only in `client/vite.config.js`. Browser requests therefore stay same-origin during development.

### Production

The frontend continues to use `/api`. The deployment must route `/api` to the backend, for example through a hosting rewrite/proxy.

The exact backend host depends on the deployment provider, which has not been selected yet.

---

# 3. API Architecture

The backend follows:

```text
Request
   ↓
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

For example:

```text
GET /api/players
        ↓
playerRoutes
        ↓
playerController
        ↓
playerService
        ↓
Player model
        ↓
MongoDB
```

Controllers should remain thin.

Business logic should not be placed directly inside route definitions.

---

# 4. Response Format

API responses should use a consistent JSON structure.

## Successful Response

Every successful response with a body uses:

```json
{
  "success": true,
  "data": {},
  "message": "Request successful"
}
```

`data` is always present. When there is nothing to return (for example logout or reorder), it is `null`.

For lists, `data` is an array and a `pagination` object is added:

```json
{
  "success": true,
  "data": [],
  "pagination": {},
  "message": "Players retrieved successfully"
}
```

---

# 5. Error Response

Every error response uses:

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": null
}
```

`error` is always present. It is `null` unless there is safe, structured detail the client needs.

For validation errors, `error` contains field-level messages:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "name": "Name is required",
    "position": "Position is required"
  }
}
```

Production responses must not expose:

- Password hashes
- JWT secrets
- Cloudinary credentials
- MongoDB credentials
- Internal stack traces

---

# 6. HTTP Status Codes

The API should use standard HTTP status codes.

| Status | Meaning                                   |
| -----: | ----------------------------------------- |
|  `200` | Successful request, including deletions   |
|  `201` | Resource created                          |
|  `400` | Bad request / validation error            |
|  `401` | Authentication required/failed            |
|  `403` | Insufficient permissions                  |
|  `404` | Resource not found                        |
|  `409` | Conflict                                  |
|  `413` | Payload too large (request body limit)    |
|  `422` | Unprocessable entity when appropriate     |
|  `429` | Too many requests (rate limit, Phase 3)   |
|  `500` | Internal server error                     |
|  `502` | Image upload failed (Cloudinary)          |

DELETE endpoints return `200` with the standard response body (see §4), not `204`:

```json
{
  "success": true,
  "data": null,
  "message": "Resource deleted successfully"
}
```

---

# 7. Authentication

Admin routes require authentication.

Public routes do not.

Authentication flow:

```text
Admin
  ↓
POST /api/auth/login
  ↓
Credentials verified
  ↓
JWT generated
  ↓
Authenticated admin
  ↓
Protected API requests
```

---

# 8. Authentication Strategy

JWT-based authentication will be used.

The preferred implementation is an **HTTP-only cookie** containing the authentication token.

The frontend should not store authentication tokens in `localStorage`.

Authentication cookies should use appropriate security settings, including:

```text
httpOnly
secure (production)
sameSite
```

Exact cookie configuration depends on frontend/backend deployment domains.

---

# 9. Authentication Endpoints

## POST `/api/auth/login`

Authenticates an administrator.

### Request

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

### Success

```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "...",
      "name": "Admin Name",
      "email": "admin@example.com",
      "role": "admin"
    }
  },
  "message": "Login successful"
}
```

The JWT is issued through the authentication cookie.

---

## POST `/api/auth/logout`

Logs out the current administrator.

Authentication required.

### Success

```json
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

The authentication cookie is cleared.

---

## GET `/api/auth/me`

Returns the currently authenticated administrator.

Authentication required.

### Response

```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "...",
      "name": "Admin Name",
      "email": "admin@example.com",
      "role": "admin"
    }
  },
  "message": "Authenticated admin retrieved successfully"
}
```

---

# 10. Public Player API

Public player endpoints do not require authentication.

Players have no `published` flag, so every player is public: current and former players are both part of the archive.

---

## GET `/api/players`

Returns a page of players.

### Query Parameters

| Parameter  | Values                                                        | Default |
| ---------- | ------------------------------------------------------------- | ------- |
| `search`   | Text, max 100 characters. Case-insensitive partial name match | —       |
| `status`   | `current` or `former`                                         | all     |
| `position` | `Goalkeeper`, `Defender`, `Midfielder` or `Forward`           | all     |
| `batch`    | Exact batch range, `YYYY-YYYY` (e.g. `2023-2027`)             | all     |
| `branch`   | Exact branch, max 50 characters                               | all     |
| `page`     | Whole number, at least 1                                      | `1`     |
| `limit`    | Whole number from 1 to 48                                     | `12`    |
| `sort`     | `name`, `-name`, `batch` or `-batch`                          | `name`  |

Invalid values return `400 Validation failed` with field messages in `error`. Unknown parameters are ignored.

Example:

```text
/api/players?status=current&position=Midfielder
```

Example:

```text
/api/players?search=Rahul&batch=2023-2027
```

### Response

`filters` lists the batch and branch values that exist (batches newest first, branches alphabetically), for filter dropdowns.

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Rahul Das",
      "slug": "rahul-das",
      "photo": { "url": "https://res.cloudinary.com/...", "publicId": "nist-fc/players/..." },
      "position": "Midfielder",
      "batch": "2023-2027",
      "branch": "CSE",
      "bio": "",
      "status": "current",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 25,
    "pages": 3
  },
  "filters": {
    "batches": ["2024-2028", "2023-2027"],
    "branches": ["CSE", "ECE"]
  },
  "message": "Players retrieved successfully"
}
```

---

## GET `/api/players/:slug`

Returns a single player using the player's slug.

Example:

```text
/api/players/rahul-das
```

### Response

```json
{
  "success": true,
  "data": {
    "player": {},
    "memories": []
  },
  "message": "Player retrieved successfully"
}
```

`memories` lists up to 12 published memories that include the player, latest first, as memory summaries (see `GET /api/memories`). `GET /api/memories?player=<id>` lists all of them.

Unknown slugs return `404 Player not found`.

---

# 11. Admin Player API

All endpoints in this section require authentication.

---

## GET `/api/admin/players/:id`

Returns one player by ID, for the admin edit form.

Authentication required.

```json
{
  "success": true,
  "data": {
    "player": {}
  },
  "message": "Player retrieved successfully"
}
```

The admin player list uses the public `GET /api/players`.

---

## POST `/api/players`

Creates a player.

### Request

`multipart/form-data`:

| Field      | Required | Rules                                                                 |
| ---------- | -------- | --------------------------------------------------------------------- |
| `name`     | Yes      | 1–100 characters                                                      |
| `position` | Yes      | `Goalkeeper`, `Defender`, `Midfielder` or `Forward`                   |
| `batch`    | Yes      | `YYYY-YYYY`, second year after the first (e.g. `2023-2027`)           |
| `branch`   | Yes      | 1–50 characters                                                       |
| `bio`      | No       | Plain text, max 1000 characters                                       |
| `status`   | No       | `current` (default) or `former`                                       |
| `photo`    | Yes      | One JPEG, PNG or WEBP file, at most `MAX_IMAGE_SIZE_MB` (default 5 MB) |

The server generates the `slug` from the name (`rahul-das`, then `rahul-das-2`, …). It stays the same if the name is later changed, so shared profile links keep working.

The photo is uploaded to Cloudinary (folder `nist-fc/players`, random public ID, stored at most 1600×1600). MongoDB stores only `{ url, publicId }`. If saving the player fails, the uploaded photo is deleted.

### Success

HTTP `201`:

```json
{
  "success": true,
  "data": {
    "player": {}
  },
  "message": "Player created successfully"
}
```

### Errors

| Status | Cause                                                                 |
| -----: | --------------------------------------------------------------------- |
|  `400` | Invalid fields, missing photo (`error.photo`), or unsupported file type |
|  `401` | Not authenticated                                                     |
|  `413` | Photo larger than `MAX_IMAGE_SIZE_MB`                                 |
|  `502` | Cloudinary rejected or failed the upload (`Image upload failed`)      |

---

## PATCH `/api/players/:id`

Updates a player.

Authentication required.

Possible fields:

```text
name
position
batch
branch
bio
status
photo
```

Only supplied fields are changed. At least one field or a new photo is required.

Send `multipart/form-data` when replacing the photo, or JSON otherwise (for example `{ "status": "former" }` to archive a player).

A new photo replaces the old one: the old image is deleted from Cloudinary only after the player is saved.

Errors are the same as for `POST`, plus `404 Player not found`.

---

## DELETE `/api/players/:id`

Permanently deletes a player.

Authentication required.

This is an exceptional administrative operation.

Normal player departure should use:

```text
status = "former"
```

rather than deletion.

The backend removes the player from any memories that reference them, deletes the player, then deletes the photo from Cloudinary. A failed image deletion is logged and does not fail the request.

### Success

HTTP `200`:

```json
{
  "success": true,
  "data": null,
  "message": "Player deleted successfully"
}
```

---

# 12. Public Memory API

Public memory endpoints only return published memories. Drafts (`published = false`) are hidden from every public surface: lists, detail pages, previous/next navigation and player profiles.

---

## GET `/api/memories`

Returns published memories, 12 per page by default.

Order is strictly by `date`, latest first. Memories on the same day are ordered by ID (newest first), so the list and previous/next navigation always agree.

### Query Parameters

| Parameter | Rules                                              |
| --------- | -------------------------------------------------- |
| `page`    | Whole number ≥ 1 (default 1)                       |
| `limit`   | 1–48 (default 12)                                  |
| `tag`     | Optional; exact tag match (trimmed, lower-cased)   |
| `player`  | Optional; a player ID — memories that include them |

Example:

```text
/api/memories?page=1&limit=12
/api/memories?tag=tournament
/api/memories?player=PLAYER_ID
```

### Response

Each item is a summary (no gallery or players):

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Inter-College Final",
      "slug": "inter-college-final",
      "date": "2025-12-12T00:00:00.000Z",
      "location": "NIST Ground",
      "excerpt": "First 200 characters of the description…",
      "coverImage": { "url": "https://res.cloudinary.com/...", "publicId": "nist-fc/memories/<memoryId>/..." },
      "photoCount": 24
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 20,
    "pages": 2
  },
  "message": "Memories retrieved successfully"
}
```

V1 has no public memory search.

---

## GET `/api/memories/:slug`

Returns a single published memory.

Example:

```text
/api/memories/university-tournament-2025
```

### Response

```json
{
  "success": true,
  "data": {
    "memory": {
      "id": "...",
      "title": "...",
      "slug": "...",
      "description": "...",
      "date": "2025-12-12T00:00:00.000Z",
      "location": "...",
      "coverImage": { "url": "...", "publicId": "..." },
      "photos": [{ "url": "...", "publicId": "..." }],
      "players": [
        { "id": "...", "name": "...", "slug": "...", "photo": {}, "position": "...", "status": "former" }
      ],
      "tags": ["tournament"],
      "published": true,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "previous": { "title": "...", "slug": "...", "date": "...", "coverImage": {} },
    "next": null
  },
  "message": "Memory retrieved successfully"
}
```

`previous` is the next **older** published memory and `next` the next **newer** one; either is `null` at the ends of the archive. `players` contains only the fields needed for display (never whole player documents), sorted by name.

Unknown slugs and unpublished memories return `404 Memory not found`.

---

# 13. Admin Memory API

All endpoints require authentication.

---

## GET `/api/admin/memories`

Returns memories for administration, including drafts, latest first.

| Parameter   | Rules                                            |
| ----------- | ------------------------------------------------ |
| `page`      | Whole number ≥ 1 (default 1)                     |
| `limit`     | 1–48 (default 20)                                |
| `search`    | Optional; case-insensitive title search          |
| `published` | Optional; `true` (published) or `false` (drafts) |

Items are summaries as in `GET /api/memories`, plus `published` and `updatedAt`.

---

## GET `/api/admin/memories/:id`

Returns one memory by ID (published or draft) in the same shape as the public detail `memory`, for the edit form.

```json
{
  "success": true,
  "data": {
    "memory": {}
  },
  "message": "Memory retrieved successfully"
}
```

Unknown IDs return `404 Memory not found`.

---

## POST `/api/memories`

Creates a memory.

### Request

`multipart/form-data`:

| Field         | Required | Rules                                                                  |
| ------------- | -------- | ---------------------------------------------------------------------- |
| `title`       | Yes      | 1–150 characters                                                       |
| `date`        | Yes      | Calendar day `YYYY-MM-DD`                                              |
| `description` | No       | Plain text, max 5000 characters                                        |
| `location`    | No       | Max 150 characters                                                     |
| `players`     | No       | JSON array of player IDs, max 100 (current and former players)         |
| `tags`        | No       | JSON array, max 20; each trimmed, lower-cased, 1–30 characters, unique |
| `published`   | No       | `true` or `false` (default `false`: new memories are drafts)           |
| `coverImage`  | Yes      | One JPEG, PNG or WEBP file, at most `MAX_IMAGE_SIZE_MB`                |
| `photos`      | No       | Up to `MAX_MEMORY_IMAGES` gallery files per request (default 20)       |

Array fields are sent as JSON strings because the request is multipart (for example `players=["64b…","64c…"]`). Duplicate players and tags are removed.

The server generates the `slug` from the title (`inter-college-final`, then `inter-college-final-2`, …). It never changes afterwards, even if the title does.

The date is a calendar day stored as `00:00 UTC` and displayed without any time-zone shift.

Images are uploaded to Cloudinary in the memory's own folder `nist-fc/memories/<memoryId>/` with random public IDs, stored at most 1600×1600. Uploads are all-or-nothing: if any image or the save fails, every image uploaded by the request is deleted.

### Success

HTTP `201` with `data.memory` (the full memory) and the message `Memory created successfully`.

### Errors

| Status | Cause                                                                                                                                                  |
| -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
|  `400` | Invalid fields, missing cover (`error.coverImage`), unknown players (`error.players`), more than 100 photos (`error.photos`), or unsupported file type |
|  `401` | Not authenticated                                                                                                                                      |
|  `413` | An image larger than `MAX_IMAGE_SIZE_MB`, or more than `MAX_MEMORY_IMAGES` photos in one request                                                       |
|  `502` | Cloudinary rejected or failed an upload (`Image upload failed`)                                                                                        |

---

## PATCH `/api/memories/:id`

Updates a memory. Published memories remain fully editable.

Possible fields:

```text
title
description
date
location
players
tags
published
coverImage
photos
removePhotos
expectedUpdatedAt
```

Only supplied fields are changed. At least one field, photo or cover image is required.

- `players` and `tags` replace the whole list.
- `coverImage` replaces the cover. The cover is separate from the gallery and does not need to appear in it.
- `photos` are **appended** to the gallery, in upload order. V1 has no gallery reordering.
- `removePhotos` is a JSON array of gallery `publicId`s to remove; each must belong to this memory.
- A memory holds at most **100** gallery photos; the gallery may be empty.
- `expectedUpdatedAt` is the `updatedAt` the client last loaded. If the memory has changed since, the request fails with `409 This memory was changed by someone else. Reload and try again.` and any images it uploaded are deleted. Concurrent saves are also detected by the document version (optimistic concurrency) and return `409`.

Send `multipart/form-data` when uploading images, or JSON otherwise (for example `{ "published": true }`).

Replaced covers and removed photos are deleted from Cloudinary only after the memory is saved; a failed deletion is logged and does not fail the request.

The admin form uploads galleries in batches of 3 photos per request, sending `expectedUpdatedAt` with each request and `published` with the last one, so a memory is never published with half its gallery. If a batch fails, the memory is kept and the remaining photos can be retried.

Errors are the same as for `POST`, plus `404 Memory not found` and `409` (stale edit).

---

## DELETE `/api/memories/:id`

Permanently deletes a memory. To hide a memory instead, unpublish it.

Authentication required.

The backend deletes the memory document first, then its cover and gallery images from Cloudinary, then the folder `nist-fc/memories/<memoryId>`. Failed image or folder deletions are logged and do not fail the request.

### Success

HTTP `200`:

```json
{
  "success": true,
  "data": null,
  "message": "Memory deleted successfully"
}
```

---

# 14. Memory Photo Management

A memory contains:

```text
1 cover image (required, stored separately)
+
0–100 gallery images (in upload order)
```

The backend stores:

```text
url
publicId
```

for every image.

The frontend should never directly modify MongoDB image references.

Image changes go through `POST`/`PATCH` on `/api/memories` (upload `coverImage`/`photos`, remove with `removePhotos`).

---

# 15. Public Timeline API

---

## GET `/api/timeline`

Returns published timeline events.

Events are ordered using the manually configured:

```text
order
```

field.

### Response

```json
{
  "success": true,
  "data": [],
  "message": "Timeline retrieved successfully"
}
```

---

## GET `/api/timeline/:id`

Returns one timeline event.

### Response

```json
{
  "success": true,
  "data": {
    "event": {},
    "memory": null
  },
  "message": "Timeline event retrieved successfully"
}
```

---

# 16. Admin Timeline API

All endpoints require authentication.

---

## GET `/api/admin/timeline`

Returns all timeline events, including unpublished events.

---

## POST `/api/timeline`

Creates a timeline event.

### Request

```text
title
date
year
description
category
memory
order
published
image
```

---

## PATCH `/api/timeline/:id`

Updates a timeline event.

---

## DELETE `/api/timeline/:id`

Deletes a timeline event.

Deleting a timeline event must not automatically delete its associated memory.

### Success

HTTP `200`:

```json
{
  "success": true,
  "data": null,
  "message": "Resource deleted successfully"
}
```

---

# 17. Timeline Reordering

The admin interface must support manual timeline ordering.

Recommended endpoint:

```text
PATCH /api/timeline/reorder
```

### Request

```json
{
  "items": [
    {
      "id": "event-id-1",
      "order": 1
    },
    {
      "id": "event-id-2",
      "order": 2
    },
    {
      "id": "event-id-3",
      "order": 3
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": null,
  "message": "Timeline reordered successfully"
}
```

---

# 18. Public Founder API

---

## GET `/api/founders`

Returns published founders.

Default ordering:

```text
displayOrder ascending
```

### Response

```json
{
  "success": true,
  "data": [],
  "message": "Founders retrieved successfully"
}
```

---

## GET `/api/founders/:slug`

Returns a published founder by slug.

This endpoint is part of the V1 API, but V1 has no public founder detail page. The frontend shows all founder information on the `/founders` page, which uses `GET /api/founders`. See `SITE_MAP.md` §10.

---

# 19. Admin Founder API

All endpoints require authentication.

---

## GET `/api/admin/founders`

Returns all founders, including unpublished records.

---

## POST `/api/founders`

Creates a founder.

Possible fields:

```text
name
role
batch
branch
bio
quote
displayOrder
published
photo
```

---

## PATCH `/api/founders/:id`

Updates a founder.

---

## DELETE `/api/founders/:id`

Deletes a founder.

Associated Cloudinary images should be cleaned up appropriately.

### Success

HTTP `200`:

```json
{
  "success": true,
  "data": null,
  "message": "Resource deleted successfully"
}
```

---

# 20. Founder Reordering

Recommended endpoint:

```text
PATCH /api/founders/reorder
```

### Request

```json
{
  "items": [
    {
      "id": "founder-id-1",
      "displayOrder": 1
    },
    {
      "id": "founder-id-2",
      "displayOrder": 2
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": null,
  "message": "Founders reordered successfully"
}
```

---

# 21. Image Upload API

Image uploads are handled by the backend.

The backend communicates with Cloudinary.

The frontend should not contain Cloudinary API secrets.

---

In V1, images are uploaded with the resource they belong to (`POST`/`PATCH` on players and memories), never through standalone upload endpoints. The standalone endpoints in §22–§23 and `/api/uploads` in §28 are not implemented in V1.

## Upload Flow

```text
Admin
  ↓
Frontend
  ↓
Backend
  ↓
Multer
  ↓
Cloudinary
  ↓
Cloudinary URL + publicId
  ↓
MongoDB
```

---

# 22. Image Upload Endpoint

Recommended endpoint:

```text
POST /api/uploads/image
```

Authentication required.

Request:

```text
multipart/form-data
```

Field:

```text
image
```

### Response

```json
{
  "success": true,
  "data": {
    "image": {
      "url": "https://res.cloudinary.com/...",
      "publicId": "nist-fc/players/example"
    }
  },
  "message": "Image uploaded successfully"
}
```

---

# 23. Multiple Image Upload

For memory galleries:

```text
POST /api/uploads/images
```

Authentication required.

Request:

```text
multipart/form-data
```

Field:

```text
images
```

### Response

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "...",
        "publicId": "..."
      },
      {
        "url": "...",
        "publicId": "..."
      }
    ]
  },
  "message": "Images uploaded successfully"
}
```

---

# 24. Image Validation

The backend must validate uploads.

Validation should include:

- Allowed file types
- File size
- Maximum number of files
- Image dimensions where necessary

Allowed formats should include common web image formats such as:

```text
JPEG
PNG
WEBP
```

The exact limits should be configurable through environment variables.

---

# 25. Image Deletion

Recommended endpoint:

```text
DELETE /api/uploads/image
```

Authentication required.

### Request

```json
{
  "publicId": "nist-fc/players/example"
}
```

The backend deletes the corresponding Cloudinary asset.

### Success

HTTP `200`:

```json
{
  "success": true,
  "data": null,
  "message": "Resource deleted successfully"
}
```

The endpoint must never expose Cloudinary credentials to the frontend.

---

# 26. Dashboard API

Admin dashboard requires authentication.

Recommended endpoint:

```text
GET /api/dashboard
```

### Response

```json
{
  "success": true,
  "data": {
    "players": {
      "total": 50,
      "current": 20,
      "former": 30
    },
    "memories": 25,
    "timelineEvents": 15,
    "founders": 4
  },
  "message": "Dashboard data retrieved successfully"
}
```

Counts should be generated from the database rather than stored separately.

---

# 27. Public Home API

The homepage requires several pieces of content.

Rather than making many unnecessary requests, the backend may provide:

```text
GET /api/home
```

This endpoint can return:

```json
{
  "success": true,
  "data": {
    "currentPlayers": [],
    "latestMemories": [],
    "timelinePreview": [],
    "founders": []
  },
  "message": "Homepage data retrieved successfully"
}
```

The exact number of items shown can be controlled through query parameters or backend constants.

Example:

```text
/api/home?players=6&memories=6&timeline=5
```

---

# 28. API Route Summary

## Authentication

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

## Players

```text
GET    /api/players
GET    /api/players/:slug
GET    /api/admin/players/:id

POST   /api/players
PATCH  /api/players/:id
DELETE /api/players/:id
```

## Memories

```text
GET    /api/memories
GET    /api/memories/:slug

GET    /api/admin/memories
GET    /api/admin/memories/:id
POST   /api/memories
PATCH  /api/memories/:id
DELETE /api/memories/:id
```

## Timeline

```text
GET    /api/timeline
GET    /api/timeline/:id

GET    /api/admin/timeline
POST   /api/timeline
PATCH  /api/timeline/:id
DELETE /api/timeline/:id
PATCH  /api/timeline/reorder
```

## Founders

```text
GET    /api/founders
GET    /api/founders/:slug

GET    /api/admin/founders
POST   /api/founders
PATCH  /api/founders/:id
DELETE /api/founders/:id
PATCH  /api/founders/reorder
```

## Uploads

```text
POST   /api/uploads/image
POST   /api/uploads/images
DELETE /api/uploads/image
```

## Dashboard

```text
GET    /api/dashboard
```

## Homepage

```text
GET    /api/home
```

---

# 29. Public vs Protected API

| Endpoint Group  | Public | Authentication |
| --------------- | -----: | -------------: |
| Home            |    Yes |             No |
| Public Players  |    Yes |             No |
| Player Detail   |    Yes |             No |
| Public Memories |    Yes |             No |
| Memory Detail   |    Yes |             No |
| Public Timeline |    Yes |             No |
| Public Founders |    Yes |             No |
| Login           |    Yes |             No |
| Admin Dashboard |     No |            Yes |
| Admin Players   |     No |            Yes |
| Admin Memories  |     No |            Yes |
| Admin Timeline  |     No |            Yes |
| Admin Founders  |     No |            Yes |
| Uploads         |     No |            Yes |

---

# 30. Authentication Middleware

Protected routes use:

```text
authMiddleware
```

Flow:

```text
Request
   ↓
Read authentication cookie
   ↓
Verify JWT
   ↓
Find/validate admin
   ↓
Attach admin to request
   ↓
Controller
```

Example:

```js
req.admin;
```

should contain the authenticated administrator information.

Sensitive information such as `passwordHash` must never be attached to the frontend response.

---

# 31. Authorization Middleware

The API should support role-based authorization.

Example:

```text
requireAuth
requireRole("superAdmin")
```

These are the names used in `AUTH.md` §24. `requireAuth` protects every admin endpoint. `requireRole` restricts a route to specific roles and runs after `requireAuth`.

V1 administrators can access normal content management.

Future Super Admin functionality may restrict sensitive operations such as:

- Managing administrators
- Removing administrators
- Changing system-level settings

No separate Super Admin management API is required for V1.

---

# 32. Validation

All create/update endpoints must validate incoming data before database operations.

Recommended validation library:

```text
Joi
```

or another lightweight schema validation library.

The final implementation may choose one validation library, but Claude Code must not install multiple competing validation libraries.

Validation errors should return:

```text
400 Bad Request
```

with a structured error response.

---

# 33. Pagination

List endpoints should support pagination.

Default:

```text
page = 1
limit = 12
```

The backend should enforce a maximum limit to prevent excessively large requests.

Example:

```text
/api/players?page=2&limit=12
```

Response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 2,
    "limit": 12,
    "total": 50,
    "pages": 5
  }
}
```

---

# 34. Search

Player search should support name-based searching.

Example:

```text
GET /api/players?search=rahul
```

Search should be case-insensitive.

V1 does not require a dedicated search engine.

MongoDB queries are sufficient.

---

# 35. Filtering

Player filters:

```text
status
position
batch
branch
```

Example:

```text
/api/players?status=current&position=Defender&batch=2025
```

Memory filters may include:

```text
player
tag
```

Additional filtering can be introduced later.

---

# 36. Sorting

### Players

Default:

```text
name ascending
```

### Memories

Default:

```text
date descending
```

### Timeline

Default:

```text
order ascending
```

### Founders

Default:

```text
displayOrder ascending
```

---

# 37. Security Requirements

The API must:

- Validate all incoming data.
- Authenticate protected endpoints.
- Authorize admin operations.
- Hash passwords with bcrypt.
- Never return password hashes.
- Keep JWT secrets in environment variables.
- Keep Cloudinary credentials in environment variables.
- Keep MongoDB credentials in environment variables.
- Use HTTP-only authentication cookies.
- Restrict CORS to the frontend origin in production.
- Limit upload file size.
- Validate uploaded file types.
- Prevent unauthorized content modification.
- Prevent unauthenticated uploads.
- Return safe production error messages.

---

# 38. Environment Variables

The backend uses environment variables for secrets and configuration.

This is the complete V1 list. It is kept identical in `API.md`, `AUTH.md` §46, and `CLAUDE.md` §26.

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

The Cloudinary variables are required at startup in every environment, because player photos are required. `MAX_IMAGE_SIZE_MB` is optional: default 5, at most 10 (Cloudinary's free-plan image limit). `MAX_MEMORY_IMAGES` is optional: the maximum number of gallery photos accepted in **one** memory upload request (default 20, 1–50). It is not the total per memory, which is fixed at 100 photos.

All of these belong to the backend (`server/.env`).

The frontend requires no environment variables in V1 because it calls the relative `/api` base path (see §2).

`.env` must never be committed to Git.

Only `.env.example` files, containing variable names without real values, should be committed.

---

# 39. CORS

Development may allow the local frontend:

```text
http://localhost:5173
```

Production should allow only the deployed NIST FC frontend origin.

The backend must not use unrestricted:

```text
Access-Control-Allow-Origin: *
```

when authenticated cookies are being used.

---

# 40. Rate Limiting

Basic rate limiting should be applied to sensitive endpoints, especially:

```text
POST /api/auth/login
POST /api/uploads/image
POST /api/uploads/images
```

This reduces brute-force and abuse risk.

The exact rate-limit configuration can be finalized during implementation.

---

# 41. Health Check

The backend should provide:

```text
GET /api/health
```

Response:

```json
{
  "success": true,
  "data": null,
  "message": "NIST FC API is running"
}
```

This endpoint does not require authentication.

It can be used by deployment platforms and developers to verify that the backend is running.

---

# 42. 404 Handling

Unknown API routes should return:

```json
{
  "success": false,
  "message": "API route not found",
  "error": null
}
```

with:

```text
404
```

---

# 43. Global Error Handling

Express should use a centralized error middleware.

Architecture:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Error
  ↓
Global Error Middleware
  ↓
Consistent JSON Response
```

Controllers should not contain repeated error-response logic.

---

# 44. API Naming Conventions

Routes use plural resource names:

```text
/players
/memories
/timeline
/founders
```

Use HTTP methods according to the operation:

```text
GET     → retrieve
POST    → create
PATCH   → update
DELETE  → delete
```

Use IDs for admin resource modification:

```text
/players/:id
/memories/:id
/timeline/:id
/founders/:id
```

Use slugs for public player/memory pages:

```text
/players/:slug
/memories/:slug
```

---

# 45. API Versioning

V1 does not require a version prefix such as:

```text
/api/v1
```

The initial API will use:

```text
/api
```

If breaking changes become necessary in the future, versioning can be introduced.

---

# 46. API Design Principles

The NIST FC API follows these principles:

1. Keep the API simple.
2. Use RESTful resource naming.
3. Keep public and admin access separate.
4. Protect all content-management endpoints.
5. Validate all incoming data.
6. Keep controllers thin.
7. Keep business logic in services.
8. Keep database operations in models/services.
9. Never expose secrets.
10. Never store raw passwords.
11. Never expose Cloudinary credentials.
12. Use consistent response structures.
13. Use appropriate HTTP status codes.
14. Keep historical player records.
15. Avoid unnecessary endpoints.
16. Avoid unnecessary dependencies.
17. Keep the API extensible for future NIST FC features.

---

# 47. V1 API Definition of Done

The API is considered complete when:

- [ ] Express server is running.
- [ ] MongoDB connection works.
- [ ] Health endpoint works.
- [ ] Admin login works.
- [ ] Admin logout works.
- [ ] Current admin endpoint works.
- [ ] JWT authentication works.
- [ ] Protected routes reject unauthenticated requests.
- [ ] Player CRUD works.
- [ ] Player search works.
- [ ] Player filters work.
- [ ] Current/former status works.
- [ ] Memory CRUD works.
- [ ] Memory gallery uploads work.
- [ ] Player-memory relationships work.
- [ ] Timeline CRUD works.
- [ ] Timeline ordering works.
- [ ] Timeline-memory relationship works.
- [ ] Founder CRUD works.
- [ ] Founder ordering works.
- [ ] Cloudinary uploads work.
- [ ] Cloudinary image cleanup works.
- [ ] Dashboard counts work.
- [ ] Homepage endpoint works.
- [ ] Pagination works.
- [ ] Validation works.
- [ ] Error middleware works.
- [ ] CORS is configured correctly.
- [ ] Rate limiting is configured for sensitive endpoints.
- [ ] Environment variables are configured.
- [ ] No secrets are committed to Git.

---

# 48. Final V1 API Scope

The finalized V1 API consists of:

```text
Authentication
├── login
├── logout
└── current admin

Players
├── list
├── detail
├── create
├── update
└── delete

Memories
├── list
├── detail
├── admin list
├── create
├── update
└── delete

Timeline
├── list
├── detail
├── admin list
├── create
├── update
├── delete
└── reorder

Founders
├── list
├── detail
├── admin list
├── create
├── update
├── delete
└── reorder

Uploads
├── single image upload
├── multiple image upload
└── image deletion

Dashboard
└── statistics

Home
└── homepage content

Health
└── API health check
```

---

# 49. Out of Scope

The following APIs are intentionally excluded from V1:

```text
Match APIs
Season APIs
Tournament APIs
Player statistics APIs
Goals APIs
Assists APIs
Results APIs
Awards APIs
Captain APIs
Coach APIs
Player registration APIs
Google Form APIs
Player approval APIs
Comments APIs
Likes APIs
Chat APIs
Notifications APIs
Social networking APIs
AI APIs
```

These may be added in future versions after the corresponding product features are approved.

---

# 50. Final Status

**API.md — FINALIZED**

This document is the API contract for NIST FC V1.

Claude Code should implement the backend according to this document.

Any API endpoint, authentication strategy, database interaction, or dependency that significantly deviates from this specification should be reviewed before implementation.
