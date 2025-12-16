# Copilot Instructions for FahamPesa Web App

## Architecture
- Next.js App Router (`src/app`) with client-heavy routes; many API route handlers live under `src/app/api/**` (Firebase/Firestore-backed business logic).
- Global providers mounted in `src/app/layout.tsx`: `AuthProvider`, `StaffProvider`, `AdminAccessProvider`, `OnboardingProvider`, plus `ErrorHandler` and `ChatwootWidget` (ensure they stay mounted).
- Firebase client SDK initialized in `src/lib/firebase.ts`; Firebase Admin bootstrap in `src/lib/firebase-admin-server.ts` (requires env secrets). Auth role helpers live in `src/lib/adminUtils.ts` and are consumed by contexts/services.
- UI primitives follow shadcn/radix patterns in `src/components/ui/*`; domain components live in feature folders under `src/components/**` and pages under `src/app/**`.

## Styling & UI
- TailwindCSS (config in `tailwind.config.js`) with CSS variables for theme tokens. Fonts are registered in `layout.tsx` and referenced via custom font-family keys (`font-archivo`, `font-dm-sans`, etc.). Keep new styles tailwind-first; respect the extended palette and radius vars.
- Animations often use `framer-motion` (see landing page) and shadcn’s motion-friendly classes. Prefer existing utility patterns over bespoke CSS.
- For modals/drawers, existing shadcn dialog/popover components are in `src/components/ui`, but some features use custom `createPortal` overlays (e.g., `DownloadModal`). Match the chosen pattern per feature.

## State & Data
- Auth: `AuthContext` (`src/contexts/AuthContext.tsx`) manages Firebase auth, Firestore role lookups, and role flags (`isSuperAdmin`, `isAdmin`). When adding auth-dependent logic, fetch roles via `getUserRole` and gate features accordingly.
- Staff/Admin gating: `StaffContext` and `AdminAccessContext` provide branch/user scoping; check these before new data fetches in admin/staff areas.
- Firestore access helpers and services live in `src/lib/*-service.ts` and `src/lib/*-types.ts`. Reuse these instead of reimplementing queries.

## Environment & Secrets
- Firebase Admin requires env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, etc.). Code warns/falls back if missing; expect server features to fail silently without them.
- Client Firebase config is embedded in `src/lib/firebase.ts` (no .env). If rotating keys, update that file.

## Routing & Pages
- Pages and dashboards live under `src/app/{dashboard,admin,super-admin,...}`. API routes under `src/app/api/**` typically delegate to lib services; keep new routes colocated with feature folders.
- Landing page (`src/app/page.tsx`) uses `framer-motion` sections and modals; follow its animation/tailwind patterns when extending marketing UI.

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build` (note: `next.config.ts` ignores TS/ESLint errors during build)
- Lint: `npm run lint`

## Testing & Quality
- No automated tests present. Preserve existing null/undefined guards and role checks when editing services/routes.
- `next.config.ts` ignores type/eslint errors in build; still fix issues locally to avoid runtime crashes.

## Integration Notes
- External services: Firebase Auth/Firestore, Firebase Admin, Chatwoot widget, ImageKit (`src/lib/imagekit.ts`), analytics/realtime services under `src/lib/*service.ts`.
- When adding downloads/assets, place static files under `public/` and reference via absolute paths (e.g., `/FahamPesa.zip`).

## Patterns to Follow
- Prefer `use client` where components interact with browser APIs or Firebase client SDK.
- Keep data-fetching logic in lib service layers; UI components should consume these helpers and contexts rather than hitting Firebase directly.
- Reuse shadcn `ui` components for inputs/forms; maintain accessibility labels and keyboard handling found in existing components.

## Common Pitfalls
- Missing Firebase Admin env vars will break server-side user listing/management; guard for `adminAuth` null as existing helpers do.
- Tailwind class collisions: honor container widths/padding defined in `tailwind.config.js`.
- Keep provider order in `layout.tsx`—Auth/Staff/AdminAccess/Onboarding are nested and expected by downstream hooks.
