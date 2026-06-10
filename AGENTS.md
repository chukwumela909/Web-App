# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

FahamPesa — a Next.js 15 (App Router, React 19) business management web app for SMEs: POS/sales, inventory, products, suppliers, debtors, expenses, reports, staff management, subscriptions/billing, and multi-tier admin. Package name is `fahampesa`.

## Commands

```bash
npm install        # install dependencies
npm run dev        # local dev server (next dev)
npm run build      # production build
npm run start      # serve production build
npm run lint       # eslint (next lint)
```

There are **no automated tests**. `TESTING_STAFF_SUBSCRIPTION.md` is a manual QA script for staff/subscription flows. When touching products, `usePlanLimits`, `useSubscriptionStatus`, or staff scoping, walk through those scenarios manually.

**Important:** `next.config.ts` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to `true`, so `npm run build` will succeed even with type/lint errors. Run `npm run lint` and fix type issues locally — the build will not catch them for you.

## Data layer (the key architectural thing)

MongoDB, via the external REST backend, is the source of truth for business data. Know which layer you're touching:

1. **External REST backend**. `src/lib/backend-api.ts` holds the `request`/`requestText` helpers and `BackendApiError`. Calls authenticate with the **Firebase ID token** (`user.getIdToken()`, sent as `Authorization: Bearer`), and responses are unwrapped from a `{ data }` / `{ error }` envelope. Base URL comes from `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`; production default is `https://fahampesa.amenviron.app/api/v1`, local default is `http://localhost:4000/api/v1`). `src/lib/backend-business-api.ts` wraps business resources (products, sales, debtors, expenses, branches, suppliers, etc.) over that client. Do not add Firestore failover paths for backend failures.

2. **Firebase** (Auth + legacy Firestore/admin support). Client SDK config is hardcoded in `src/lib/firebase.ts` (not env-driven - update that file to rotate). Firebase Admin bootstraps in `src/lib/firebase-admin-server.ts` from env secrets (`FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`) and can be null when credentials are missing; guard for a null `adminAuth` like existing helpers do.

All data access goes through `src/lib/*-service.ts` (e.g. `business-service`, `staff-service`, `subscription-service`, `analytics-service`, `audit-service`, `notification-service`, `realtime-service`, `mpesa-service`, `broadcast-service`) with `*-types.ts` companions. Reuse these services and the backend-api wrappers — do not query Firestore or call the REST API directly from components.

## App structure

- `src/app/api/**` — Next.js route handlers (admin, auth, branches, inventory, mpesa, stripe, staff, suppliers, transfers, purchase-orders, imagekit, notifications). They delegate to lib services; keep new routes colocated by feature.
- `src/app/dashboard/**` — owner-facing app (sales, products, inventory, reports, staff, subscription, etc.).
- `src/app/sales`, `src/app/staff-dashboard` — POS and staff-scoped views.
- `src/app/admin`, `src/app/super-admin/**` — multi-tier admin (users, payments, audit-logs, broadcast, system-health, alerts).
- `src/components/ui/*` — shadcn/radix primitives. `src/components/**` — feature components by domain.
- `@/*` path alias maps to `src/*`.

## Auth, roles & scoping

Provider nesting in `src/app/layout.tsx` is load-bearing — downstream hooks expect this order: `AuthProvider` → `StaffProvider` → `AdminAccessProvider` → `OnboardingProvider` (plus `ErrorHandler`, `ChatwootWidget`). Don't reorder or unmount them.

- `AuthContext` — Firebase auth + Firestore role lookups; exposes `isSuperAdmin`, `isAdmin`. Resolve roles via `getUserRole` (`src/lib/adminUtils.ts`) and gate features on them.
- `StaffContext` / `AdminAccessContext` — branch + user scoping. **Critical staff pattern:** staff act on behalf of the account owner. Compute `effectiveUserId` (owner's UID via `staff.userId`) for all data reads/writes, but stamp `createdBy` with the staff member's own UID. Subscriptions and plan limits also resolve against `effectiveUserId` so staff inherit the owner's plan. Getting this wrong causes the data-isolation and limit bugs documented in `TESTING_STAFF_SUBSCRIPTION.md`.

Firestore security rules (`firestore.rules`) default-deny everything; only the explicitly matched collections are accessible, and most user-owned writes go through APIs rather than direct client writes.

## Conventions

- `"use client"` for anything using browser APIs or the Firebase client SDK.
- Tailwind v4 (config in `tailwind.config.js`) with CSS-variable theme tokens; custom font-family keys (`font-archivo`, `font-dm-sans`, …) registered in `layout.tsx`. Keep styling tailwind-first and respect the extended palette/radius vars and container widths.
- `framer-motion` for animation (see landing page `src/app/page.tsx`). Prefer existing shadcn dialog/popover components, but some features use custom `createPortal` overlays — match the pattern already in the feature.
- Static assets live in `public/` and are referenced by absolute path (e.g. `/FahamPesa.zip`).

## External integrations

Firebase (Auth/Firestore/Admin), the external REST backend, Stripe (`src/app/api/stripe`), M-Pesa (`src/lib/mpesa-service.ts`), ImageKit (`src/lib/imagekit.ts`), Brevo email, and the Chatwoot support widget. Firebase deploy targets only Firestore rules + indexes (`firebase.json`).
