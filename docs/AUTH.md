# NIST FC — Authentication & Security Architecture

## 1. Overview

NIST FC has a public website and a protected administrator area.

Public visitors can:

- View players
- View player profiles
- Browse memories
- View timeline events
- View founders
- Read about NIST FC

Administrators can:

- Manage players
- Manage memories
- Manage timeline events
- Manage founders
- Upload images
- Manage published/unpublished content

Only authenticated administrators may access administrative operations.

---

# 2. Authentication Architecture

The authentication system uses:

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcrypt
HTTP-only cookies
```

Authentication flow:

```text
┌─────────────┐
│ Admin Login │
└──────┬──────┘
       │
       ▼
POST /api/auth/login
       │
       ▼
Validate credentials
       │
       ▼
Find admin in MongoDB
       │
       ▼
Compare password with bcrypt
       │
       ▼
Generate JWT
       │
       ▼
HTTP-only Cookie
       │
       ▼
Authenticated Admin
```

---

# 3. Admin Account

Administrators are stored in the `admins` collection.

Schema:

```text id="7y7e8v"
Admin
├── _id
├── name
├── email
├── passwordHash
├── role
├── createdAt
└── updatedAt
```

Passwords are never stored directly.

Only:

```text id="1qz2cc"
passwordHash
```

is stored.

---

# 4. Password Hashing

Passwords must be hashed using:

```text id="0gv5q5"
bcrypt
```

The backend must never store:

```text id="x0x4e5"
password
```

in MongoDB.

Example stored value:

```text id="v8f1e9"
passwordHash:
$2b$12$...
```

The plaintext password exists only during the login request and must never be logged.

---

# 5. Password Requirements

Admin passwords must satisfy reasonable security requirements.

Minimum:

```text id="15imxx"
8 characters
```

Recommended:

- At least 8 characters
- Uppercase character
- Lowercase character
- Number
- Special character

The backend should validate password strength during administrator creation/password changes.

---

# 6. JWT Authentication

JWT is used to represent an authenticated administrator session.

The JWT payload should contain only the information required to identify and authorize the admin.

Example:

```json id="u9l6t5"
{
  "sub": "admin-mongodb-id",
  "role": "admin"
}
```

Do not store sensitive information in the JWT.

The JWT must not contain:

- Password
- Password hash
- Cloudinary credentials
- MongoDB credentials
- Personal secrets

---

# 7. JWT Secret

The JWT signing secret must be stored in an environment variable.

Example:

```text id="4wwnqg"
JWT_SECRET=...
```

It must never be:

- Hard-coded
- Committed to Git
- Included in frontend code
- Included in API responses

---

# 8. JWT Expiration

The JWT must have an expiration time.

Example environment variable:

```text id="3p8gl5"
JWT_EXPIRES_IN=1d
```

The exact production duration can be adjusted later.

A reasonable V1 implementation may use:

```text id="a6s9bh"
1 day
```

without implementing refresh tokens.

If long-lived sessions are required later, refresh-token authentication can be added as a separate feature.

---

# 9. Authentication Cookie

The JWT should be stored in an:

```text id="5t8e1a"
HTTP-only cookie
```

Example cookie:

```text id="xg7n2s"
nist_fc_token
```

The frontend JavaScript must not be able to directly read the JWT.

This reduces the risk of token theft through client-side scripts.

---

# 10. Cookie Security

The authentication cookie should use:

```text id="w2r2n4"
httpOnly: true
secure: true       // production
sameSite: "lax"
```

During local development:

```text id="8e9zgd"
secure: false
```

may be required when using plain HTTP localhost.

Production should always use HTTPS.

---

# 11. Cookie Configuration

The cookie configuration should be controlled by environment/configuration where necessary.

Example:

```text id="xqkqvy"
COOKIE_NAME=nist_fc_token
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

The backend is responsible for setting and clearing the cookie.

---

# 12. Login Endpoint

Endpoint:

```text id="9i8v6w"
POST /api/auth/login
```

Request:

```json id="5grn3p"
{
  "email": "admin@example.com",
  "password": "AdminPassword123!"
}
```

Flow:

```text id="k6x5i1"
Receive credentials
      ↓
Validate input
      ↓
Normalize email
      ↓
Find admin
      ↓
Compare bcrypt password
      ↓
Generate JWT
      ↓
Set HTTP-only cookie
      ↓
Return safe admin information
```

---

# 13. Failed Login

If credentials are invalid:

```text id="y7j6dd"
401 Unauthorized
```

Response:

```json id="x0gq3d"
{
  "success": false,
  "message": "Invalid email or password"
}
```

The API should not reveal whether:

- The email exists
- The password was incorrect
- The account does not exist

Use a generic authentication error.

---

# 14. Login Rate Limiting

Login must be rate-limited.

Example strategy:

```text id="az2x8m"
Multiple failed attempts
        ↓
Rate limit
        ↓
Temporary request restriction
```

This reduces brute-force attacks.

The exact rate-limit values can be configured during implementation.

---

# 15. Logout

Endpoint:

```text id="u3n8x8"
POST /api/auth/logout
```

The backend clears the authentication cookie.

Example:

```text id="3zn0tv"
Set-Cookie:
nist_fc_token=;
```

Response:

```json id="z7u9pl"
{
  "success": true,
  "message": "Logout successful"
}
```

---

# 16. Current Admin

Endpoint:

```text id="x3e0vw"
GET /api/auth/me
```

Purpose:

Allows the frontend to determine whether the current session is authenticated.

Response:

```json id="qk5p6k"
{
  "success": true,
  "data": {
    "admin": {
      "id": "...",
      "name": "Admin Name",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

Never return:

```text id="kg4g3s"
passwordHash
```

---

# 17. Authentication Middleware

Protected routes use authentication middleware.

Example:

```text id="2lqvxn"
authMiddleware
```

Flow:

```text id="g9o0x5"
Request
   ↓
Read JWT cookie
   ↓
Verify JWT
   ↓
Extract admin ID + role
   ↓
Validate admin
   ↓
Attach admin to request
   ↓
Continue
```

The authenticated administrator can be attached to:

```js id="17tq5c"
req.admin;
```

---

# 18. Missing Authentication

If a protected endpoint is accessed without valid authentication:

```text id="tpxe2x"
401 Unauthorized
```

Response:

```json id="2jy3b4"
{
  "success": false,
  "message": "Authentication required"
}
```

---

# 19. Invalid/Expired Token

If the JWT is:

- Invalid
- Expired
- Tampered with
- Malformed

the API must reject the request.

Response:

```json id="j6u2n3"
{
  "success": false,
  "message": "Authentication required"
}
```

The frontend should redirect the administrator to:

```text id="c6g6g5"
/admin/login
```

---

# 20. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

NIST FC uses role-based authorization.

---

# 21. Roles

V1 supports:

```text id="qzq4qj"
admin
```

The schema also supports:

```text id="yrt0dj"
superAdmin
```

for future expansion.

---

# 22. Admin Permissions

An `admin` can:

```text id="5h2u5a"
View dashboard
Create players
Edit players
Archive players
Delete players
Create memories
Edit memories
Delete memories
Create timeline events
Edit timeline events
Reorder timeline events
Delete timeline events
Create founders
Edit founders
Reorder founders
Delete founders
Upload images
Delete images
```

All operations remain protected by authentication.

---

# 23. Super Admin

Super Admin functionality is reserved for future use.

Potential Super Admin capabilities:

```text id="d4l8zq"
Create admins
Remove admins
Change admin roles
Manage system settings
Perform sensitive administrative actions
```

V1 does not require a dedicated Super Admin management interface.

---

# 24. Authorization Middleware

The backend may use middleware such as:

```text id="r0c2l7"
requireAuth
requireRole
```

Example:

```text id="f5e9xa"
requireAuth
    ↓
requireRole("superAdmin")
    ↓
Controller
```

Normal admin routes only require authentication.

---

# 25. Admin Route Protection

All admin content-management API endpoints require authentication.

Protected examples:

```text id="h0h1o2"
POST   /api/players
PATCH  /api/players/:id
DELETE /api/players/:id

POST   /api/memories
PATCH  /api/memories/:id
DELETE /api/memories/:id

POST   /api/timeline
PATCH  /api/timeline/:id
DELETE /api/timeline/:id

POST   /api/founders
PATCH  /api/founders/:id
DELETE /api/founders/:id

POST   /api/uploads/image
POST   /api/uploads/images
DELETE /api/uploads/image

GET    /api/dashboard
```

---

# 26. Public API Access

The following APIs do not require authentication:

```text id="zj8g1s"
GET /api/home

GET /api/players
GET /api/players/:slug

GET /api/memories
GET /api/memories/:slug

GET /api/timeline
GET /api/timeline/:id

GET /api/founders
GET /api/founders/:slug

GET /api/health

POST /api/auth/login
```

Only published public content should be returned by public endpoints.

---

# 27. Unpublished Content

Administrators can create content without publishing it.

Example:

```text id="7kq0m4"
published = false
```

Public endpoints must not expose unpublished records.

Admin endpoints may expose them to authenticated administrators.

---

# 28. Player Archival Security

Changing:

```text id="b8s5j0"
status = "current"
```

to:

```text id="x1p5vx"
status = "former"
```

is a normal administrative operation.

A former player remains visible in the historical archive.

The system must not automatically delete:

- Player profile
- Player image
- Player-memory relationships

when status changes.

---

# 29. Permanent Deletion

Permanent deletion is different from archival.

### Archive

```text id="5l4u6j"
status = former
```

### Delete

```text id="4ct5o7"
MongoDB document removed
```

Permanent deletion should only occur through an authenticated admin action.

Before deletion, the backend must consider:

- Related memory references
- Cloudinary image
- Other references to the player

---

# 30. Player Deletion Policy

If a player is permanently deleted, their references inside memories must be handled safely.

Recommended V1 behavior:

```text id="4b1qfv"
Player deletion
      ↓
Remove player ObjectId from Memory.players arrays
      ↓
Delete player Cloudinary image
      ↓
Delete player document
```

This prevents broken references.

The exact operation should be handled transactionally where practical.

---

# 31. Memory Deletion Policy

When a memory is deleted:

```text id="0txb4g"
Delete memory
      ↓
Delete associated Cloudinary images
      ↓
Remove memory references from timeline events
```

Deleting a memory must not delete players.

Timeline events referencing the memory should have:

```text id="6l5vnm"
memory = null
```

after cleanup.

---

# 32. Timeline Deletion Policy

When a timeline event is deleted:

```text id="m0k3ax"
Delete timeline event
      ↓
Memory remains
```

The associated memory must not be deleted automatically.

---

# 33. Founder Deletion Policy

When a founder is deleted:

```text id="y40z5b"
Delete founder
      ↓
Delete associated Cloudinary image
```

No other V1 content should depend on the founder record.

---

# 34. Image Upload Security

Only authenticated administrators may upload images.

The backend must validate:

- MIME type
- File extension
- File size
- Number of uploaded files

Allowed formats:

```text id="k8s6m1"
JPEG
PNG
WEBP
```

The server must reject unsupported files.

---

# 35. Image Upload Limits

Reasonable limits should be implemented.

Recommended starting values:

### Single image

```text id="8g0v4f"
Maximum: 5 MB
```

### Memory gallery

```text id="1az8or"
Maximum: 20 images per upload request
```

The limits should be configurable.

Example:

```text id="7xw8wq"
MAX_IMAGE_SIZE_MB=5
MAX_MEMORY_IMAGES=20
```

---

# 36. Cloudinary Security

Cloudinary credentials must remain server-side.

Environment variables:

```text id="0k4uxd"
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

These values must never appear in:

- React source
- Browser JavaScript
- API responses
- Git repository
- Logs

---

# 37. MongoDB Security

MongoDB credentials must remain server-side.

Environment variable:

```text id="q2r5v0"
MONGODB_URI=
```

The MongoDB connection string must never be exposed to the frontend.

---

# 38. CORS Security

The backend must restrict CORS to the trusted frontend.

Development:

```text id="8g8r5u"
http://localhost:5173
```

Production:

```text id="g0p2yb"
https://<production-frontend-domain>
```

The backend should not use unrestricted CORS for authenticated requests.

---

# 39. CSRF Considerations

Because authentication uses cookies, CSRF protection must be considered.

The initial V1 implementation should use:

```text id="s5w6e0"
SameSite=Lax
```

and strict CORS configuration.

If deployment architecture requires cross-site cookies, an explicit CSRF protection mechanism must be added before production use.

---

# 40. XSS Protection

User-generated content such as:

- Player bio
- Memory description
- Founder bio
- Founder quote
- Timeline description

must be treated as untrusted input.

The application should render these values as text by default.

Raw HTML should not be accepted in V1.

Avoid using:

```text id="0l8bqz"
dangerouslySetInnerHTML
```

for normal content.

---

# 41. Input Validation

All incoming data must be validated server-side.

Never rely only on frontend validation.

Example:

```text id="o0y7tw"
Frontend validation
        +
Backend validation
```

Backend validation is authoritative.

---

# 42. NoSQL Injection Protection

MongoDB queries must not directly trust user-provided query objects.

The backend should sanitize query inputs.

For example, user-provided values must not be allowed to inject MongoDB operators such as:

```text id="gxyv4v"
$ne
$gt
$regex
$where
```

without explicit backend handling.

---

# 43. Rate Limiting

Rate limiting should be applied to sensitive endpoints.

Especially:

```text id="t1s4jd"
POST /api/auth/login
POST /api/uploads/image
POST /api/uploads/images
```

This protects against:

- Brute-force login attempts
- Upload abuse
- Excessive API requests

---

# 44. Logging

The backend may log useful operational information such as:

```text id="y0xw8v"
Request method
Request path
Response status
Request duration
Server errors
Authentication failures
```

Do NOT log:

```text id="uw8p1r"
Passwords
JWT tokens
JWT secrets
Cloudinary API secrets
MongoDB credentials
```

---

# 45. Production Error Handling

Production API responses must not expose:

```text id="i6e1o2"
Stack traces
File paths
Database credentials
Environment variables
Internal secrets
```

Instead:

```json id="v3v4zj"
{
  "success": false,
  "message": "Internal server error"
}
```

Detailed errors may be logged server-side.

---

# 46. Environment Variables

Required security-related variables:

```text id="a3s5n7"
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=

CLIENT_URL=

COOKIE_NAME=
COOKIE_SECURE=
COOKIE_SAME_SITE=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Example:

```text id="l9p5yk"
JWT_SECRET=change-this-in-production
```

The actual production secret must be long, random, and unique.

---

# 47. `.env` Rules

`.env` must never be committed.

`.gitignore` must contain:

```text id="j1u4aq"
.env
.env.*
```

A safe template may be committed:

```text id="6x8m1q"
.env.example
```

Example:

```text id="3x0q2z"
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

No real secrets should be placed inside `.env.example`.

---

# 48. Frontend Authentication Behavior

The React frontend should treat authentication as a session rather than storing the JWT itself.

On admin application startup:

```text id="z4xq1h"
Open Admin App
      ↓
GET /api/auth/me
      ↓
Authenticated?
   ┌──┴──┐
  Yes    No
   ↓      ↓
Dashboard Login
```

---

# 49. Protected Admin Routes

Frontend routes under:

```text id="5j3p1e"
/admin
```

must be protected.

Examples:

```text id="w7g9x4"
/admin
/admin/players
/admin/memories
/admin/timeline
/admin/founders
```

Unauthenticated users should be redirected to:

```text id="d0r2ym"
/admin/login
```

Frontend route protection is for user experience.

The backend remains the authoritative security layer.

---

# 50. Authentication State

The frontend may maintain:

```text id="s5q8y3"
{
  admin,
  isAuthenticated,
  loading
}
```

A React authentication context/provider may be used.

Example:

```text id="x4q8p7"
AuthContext
```

The authentication state should be refreshed through:

```text id="m8v2q6"
GET /api/auth/me
```

rather than reading the JWT directly.

---

# 51. Session Expiration

When the JWT expires:

```text id="3k5s7v"
API request
    ↓
401
    ↓
Frontend detects expired session
    ↓
Clear local auth state
    ↓
Redirect to /admin/login
```

The frontend should not repeatedly retry an expired authentication request.

---

# 52. Logout Behavior

When the administrator logs out:

```text id="n4r5c1"
POST /api/auth/logout
        ↓
Cookie cleared
        ↓
Frontend auth state cleared
        ↓
Redirect to /admin/login
```

---

# 53. Multiple Administrators

V1 supports multiple administrator accounts.

Example:

```text id="v5x7h8"
Admin 1
Admin 2
Admin 3
```

Each administrator has an independent account.

All administrators can manage the same NIST FC content.

---

# 54. Admin Creation

V1 does not require a public admin-registration page.

Administrator accounts should be created securely by:

- Initial database seeding
- A controlled administrative process
- Future Super Admin functionality

There must be no public endpoint such as:

```text id="q6y7r4"
/api/auth/register
```

for arbitrary users.

---

# 55. Initial Admin Seeding

The project may provide a secure seed script for the first administrator.

Example concept:

```text id="0p3f9z"
npm run seed:admin
```

The seed script should:

1. Read credentials from environment variables.
2. Hash the password with bcrypt.
3. Create the administrator.
4. Refuse to create a duplicate account.
5. Never print the password.

Example environment variables:

```text id="i8x3o4"
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

These values must never be committed.

---

# 56. Authentication API Summary

```text id="ypzv2w"
POST /api/auth/login
    Public
    ↓
    Authenticate administrator
    ↓
    Set HTTP-only JWT cookie


POST /api/auth/logout
    Authenticated
    ↓
    Clear authentication cookie


GET /api/auth/me
    Authenticated
    ↓
    Return current administrator
```

---

# 57. Security Architecture

Final security flow:

```text id="d0e2v6"
                 ┌─────────────────┐
                 │ React Admin App │
                 └────────┬────────┘
                          │
                          │ credentials
                          ▼
                 ┌─────────────────┐
                 │ Express API     │
                 └────────┬────────┘
                          │
                    Validate input
                          │
                          ▼
                 ┌─────────────────┐
                 │ MongoDB Admin   │
                 └────────┬────────┘
                          │
                    bcrypt compare
                          │
                          ▼
                 ┌─────────────────┐
                 │ Generate JWT    │
                 └────────┬────────┘
                          │
                          ▼
                 HTTP-only Cookie
                          │
                          ▼
                 Authenticated API
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Players      Memories     Timeline
                                      │
                                      ▼
                                   Founders
```

---

# 58. Security Principles

NIST FC authentication follows these principles:

1. Never store plaintext passwords.
2. Never expose password hashes.
3. Never store JWTs in localStorage.
4. Use HTTP-only cookies.
5. Keep secrets server-side.
6. Validate all backend input.
7. Authenticate every protected endpoint.
8. Authorize administrative operations.
9. Restrict CORS.
10. Rate-limit sensitive endpoints.
11. Validate uploaded files.
12. Protect Cloudinary credentials.
13. Protect MongoDB credentials.
14. Do not expose stack traces in production.
15. Keep authentication state server-validated.
16. Do not provide public administrator registration.
17. Preserve historical player records.
18. Treat frontend route protection as UX, not security.
19. Keep backend authorization authoritative.
20. Avoid unnecessary authentication complexity in V1.

---

# 59. V1 Authentication Definition of Done

Authentication is complete when:

- [ ] Admin model exists.
- [ ] Admin passwords are bcrypt hashed.
- [ ] Admin login works.
- [ ] Invalid credentials are rejected.
- [ ] Login endpoint is rate-limited.
- [ ] JWT is generated.
- [ ] JWT is stored in an HTTP-only cookie.
- [ ] Cookie security settings are configured.
- [ ] `/api/auth/me` works.
- [ ] Logout clears the cookie.
- [ ] Protected API routes reject unauthenticated requests.
- [ ] Admin role is validated.
- [ ] Frontend admin routes are protected.
- [ ] Expired sessions redirect to login.
- [ ] No public admin registration exists.
- [ ] Cloudinary secrets remain server-side.
- [ ] MongoDB credentials remain server-side.
- [ ] JWT secret remains server-side.
- [ ] `.env` is ignored by Git.
- [ ] `.env.example` contains no secrets.
- [ ] Production errors do not expose sensitive information.
- [ ] CORS is restricted.
- [ ] Upload validation is implemented.
- [ ] No sensitive credentials are logged.

---

# 60. Out of Scope

The following authentication features are intentionally excluded from V1:

```text
Password reset by email
Email verification
Two-factor authentication
OAuth login
Google login
GitHub login
Magic links
Refresh-token rotation
Public registration
Admin invitation system
Advanced permission management
Audit log
Device/session management
```

These may be introduced in a future version if required.

---

# 61. Final Status

**AUTH.md — FINALIZED**

This document defines the authentication and security architecture for NIST FC V1.

Claude Code must follow this document when implementing:

- Admin authentication
- JWT sessions
- Admin authorization
- Protected routes
- Password handling
- Image upload security
- Environment secrets
- Frontend authentication state
- API security

Any significant change to the authentication architecture must be reviewed before implementation.
