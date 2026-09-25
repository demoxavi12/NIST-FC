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
npm run build
npm run preview
```

## API

All requests go through `src/services/api.js`, which uses the relative base path `/api`.
In development, Vite proxies `/api` to the Express backend at `http://localhost:5000` (see `vite.config.js`).
The frontend needs no environment variables in V1.

## Design tokens

Colours, font, spacing, radii, shadows, container width and motion live in the `@theme` block of `src/index.css`.
The accent `#1D4ED8` is a **temporary placeholder, not official NIST branding**. Replace it there only.
