# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 (App Router, React 19) portfolio site with server-rendered public pages, a content-management UI, multilingual content (English/Spanish), and a MongoDB-backed Prisma data layer. Surfaces: Home, About, Experience, Projects, Blogs, Resources, Skills — plus an authoring UI for each.

## Development Commands

```bash
npm run dev                 # Next dev server (default: http://localhost:3000)
npm run build               # Production build
npm start                   # Run the built app
npm run lint                # eslint . (flat config, eslint-config-next)

npx prisma generate         # Regenerate Prisma client
npx prisma db push          # Sync schema.prisma to MongoDB (no migrations — Mongo provider)
npx prisma db seed          # Run prisma/seed.ts (ts-node) — seeds resource categories + sample resources
npx prisma studio           # Prisma GUI
```

No test runner is configured — there are no Jest/Vitest/Playwright scripts in `package.json`. Don't claim tests pass when verifying changes; rely on `lint` and a manual run via `npm run dev`.

Node.js >= 24.0.0 is required (`package.json` engines).

## Environment Variables

Defined in `.env.example`:

- `DATABASE_URL` — MongoDB connection string (required by Prisma)
- `ADMIN_API_KEY` + `NEXT_PUBLIC_ADMIN_API_KEY` (same value) — root `proxy.ts` requires the `x-api-key` header on POST/PUT/DELETE; the admin UI sends it from the client. **If `ADMIN_API_KEY` is missing in Vercel, every mutation returns 401.**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — used by `next-cloudinary` for direct uploads from the authoring UI.

There is no `API_URL` (non-public) variable — earlier docs that referenced one are wrong.

## Architecture Overview

### Authoring UI — Use `/admin/*`

`/admin` is the only content-management surface in the repo. It uses shadcn-style primitives imported from `@/components/ui/*` (Card, Badge, etc.), `AdminSidebar` + `AdminHeader` layout, TanStack Query for fetching, and form components in `app/admin/components/*Form.tsx`. The admin dashboard at `app/admin/page.tsx` is the entry point.

The legacy `app/dashboard/*` surface (CRUDTable, DataGrid, AG Grid, `DashBoardSidebar`) was removed; `app/components/dashboard/DataTable.tsx` and `DatePicker.tsx` remain because `/admin` reuses them. When adding a new content type, mirror the `/admin` pattern.

### Data Flow

```
Server Component page  ──►  lib/data.ts   (direct Prisma, prerendered at build)
                                   │
                                   ▼
                             lib/db.ts (Prisma singleton)
                                   │
                                   ▼
                                 MongoDB
```

Public pages query Prisma directly through `lib/data.ts` so they prerender with real content at build time (no HTTP self-fetch). Client-side reads/mutations go through TanStack Query (`@tanstack/react-query`) against same-origin `/api/*` via `lib/request-util.ts#fetchJSON` (client-only, relative URLs). Mutations require the `x-api-key` header, enforced by root `proxy.ts` (GETs stay public).

**Prisma client singleton** (`lib/db.ts`): exported as default `db`. Always import from `lib/db.ts` rather than instantiating `new PrismaClient()` — the singleton pattern under `globalThis.prisma` prevents connection-pool exhaustion in dev with hot reload.

### Provider Nesting (`app/layout.tsx`)

```
ThemeProvider → TanstackProvider → LanguageProvider → ClientLayout → MainLayout → children
```

Locale is resolved server-side in `app/layout.tsx`: cookie `NEXT_LOCALE` → `accept-language` header → `'en'` default, then passed as `initialLang` to `LanguageProvider`. Theme is applied via an inline blocking `<script>` in `<head>` to avoid FOUC; `ThemeProvider` then takes over.

### Internationalization

Custom (not `next-intl`). Two locales: `'en'` | `'es'`. Strings live in `app/lib/dictionary.ts`. The hook is `useLanguage()` and exposes `{ lang, t, changeLanguage }` — note `changeLanguage` (writes cookie + `router.refresh()`), not `setLang`. To add a key, extend both `en` and `es` branches of `dictionary` together; the `t` object is typed off the `en` shape.

### Slug Generation — Two Implementations

A shared helper exists in `lib/slug-util.ts`, but **most API routes redefine `generateSlug()` inline** (e.g. `app/api/resources/route.ts`). The two regexes differ — the inline version is the de-facto correct one (`/[^\w\s-]/g`, `/[\s_-]+/g`); the `lib/slug-util.ts` version has double-escaped `\\s` and is buggy. When adding a new slugged resource, copy the inline version rather than importing from `lib/slug-util.ts`, or fix `lib/slug-util.ts` first.

API routes that create slugged records (`Resource`, `ResourceCategory`, `Project`, `Experience`, `Skill`, `SkillCategory`) must check for slug collisions on `POST` and return `409` — see `app/api/resources/route.ts` for the canonical pattern.

### Prisma Schema Quirks

- MongoDB provider — `db push` only (no SQL migrations).
- `Project` ↔ `ProjectTool` is a many-to-many via shared `String[] @db.ObjectId` arrays (`toolIDs` / `projectIDs`) — Mongo-style, not a join table.
- Several legacy fields are still on the models (`Project.about`, `Project.cover`, `Project.link`, `Experience.name`) — leave them alone unless explicitly cleaning up; production data may still reference them.

### Styling

Tailwind CSS + custom configuration. Fonts loaded via `next/font/google`: `Poiret_One` (headings, `--font-poiret`) and `Open_Sans` (body, `--font-open-sans`). Dark mode is the Tailwind `dark:` class strategy, toggled by `ThemeProvider` against `localStorage['theme']`. Animations use Framer Motion. Allowed remote image hosts (`next.config.js`): `res.cloudinary.com`, `api.bearcodev.com`, `images.unsplash.com` — add to `remotePatterns` before using any new domain in `<Image>`.

### TypeScript

- `strict: true`. Path alias `@/*` → repo root (`tsconfig.json`).
- Shared types live in `app/components/types/types.ts` — update this when API responses or models change.
- `tsconfig.json` excludes `scripts/`, so anything you put there is not type-checked.

## Workflow Notes

**Adding or changing a Prisma model:**
1. Edit `prisma/schema.prisma`.
2. `npx prisma db push` (MongoDB — no migration file is generated).
3. `npx prisma generate`.
4. Update `app/components/types/types.ts` to match.
5. If the model needs seed data, update `prisma/seed.ts` (ts-node) before running `npx prisma db seed`.

**Adding a new content resource end-to-end** — follow the existing slice (e.g. Resources):
1. Model in `prisma/schema.prisma` (add `slug @unique` if user-facing).
2. `app/api/<name>/route.ts` (GET, POST) and `app/api/<name>/[slug]/route.ts` (GET, PUT, DELETE).
3. Type in `app/components/types/types.ts`.
4. Reader in `lib/data.ts` (direct Prisma query).
5. Public page in `app/<name>/page.tsx` (Server Component).
6. Admin page in `app/admin/<name>/page.tsx` + `app/admin/components/<Name>Form.tsx`.
7. Add a sidebar link in `app/admin/components/AdminSidebar.tsx`.

**API response conventions** (see `app/api/resources/route.ts`):
- Validate required fields → `400` with `{ message }`.
- Slug-collision check before create → `409 { message }`.
- Caught errors → `500 { error, message }` and `console.error` the cause.
- Success on create → `201` with the created object.
