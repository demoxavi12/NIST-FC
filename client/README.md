# NIST FC — Client

React + Vite frontend for the NIST FC website and archive.
Read the root `CLAUDE.md` and the `docs/` folder before changing anything here.

## Stack

React 19 (with the React Compiler), Vite, Tailwind CSS v4 (`@tailwindcss/vite`), React Router, Axios, Lucide React.
Inter is loaded from Google Fonts.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run test     # Vitest + React Testing Library (jsdom); the API is mocked
npm run build
npm run preview
```

## API

All requests go through `src/services/api.js`, which uses the relative base path `/api`.
In development, Vite proxies `/api` to the Express backend at `http://localhost:5000` (see `vite.config.js`).
The frontend needs no environment variables in V1.

## Admin authentication

- The session is an HTTP-only cookie set by the API. The frontend never reads or stores tokens, and nothing goes in localStorage or sessionStorage.
- `AuthProvider` (`src/context/`) wraps only the admin routes. It restores the session once from `GET /api/auth/me` when the admin area is entered; public pages never check the session.
- `RequireAuth` (`src/routes/`) protects `/admin/*`:
  - While the session is being checked, it shows a loading state.
  - When signed out, it redirects to `/admin/login` and returns to the requested page after sign-in.
  - If the check fails (network or 5xx), it shows an error with Retry.
- A 401 from any protected request marks the session as expired and returns the admin to the login page. Requests that expect a 401 opt out with `{ skipSessionExpiry: true }`.
- Use `useAuth()` for `{ status, admin, login, logout, retry }`.

## Design tokens

Colours, font, spacing, radii, shadows, container width and motion live in the `@theme` block of `src/index.css`.
The accent `#1D4ED8` is a **temporary placeholder, not official NIST branding**. Replace it there only.
