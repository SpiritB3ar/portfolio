# API Integration Guide (Frontend)

Authoritative reference for consuming the portfolio backend (`app/api/**`). The
API is a set of Next.js 16 App Router route handlers backed by Prisma +
MongoDB. All endpoints accept/return **JSON**.

> Generated alongside the backend standardization pass. If a route's behavior
> changes, update this doc.

---

## 1. Base URL & environment

| Var | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | MongoDB connection string (Prisma). Server-only. | — |
| `ADMIN_API_KEY` / `NEXT_PUBLIC_ADMIN_API_KEY` (same value) | `x-api-key` header required by root `proxy.ts` on POST/PUT/DELETE. | — |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Direct image uploads from the authoring UI. | — |

All endpoints live under `<base>/api/...`.

---

## 2. Fetching — `fetchJSON` ([lib/request-util.ts](../lib/request-util.ts))

Client components read through a tiny helper (same-origin relative
`/api/*` — no CORS on any domain, no env var needed):

```ts
export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  return response.json();
}
```

Key facts:
- Client-only. Server Components must NOT use it — they query Prisma directly via [lib/data.ts](../lib/data.ts) so pages prerender at build time.
- On any non-2xx it **throws** `Error("HTTP Error: <status>")`, preferring the `{ message }` body when present.
- It only does GET. Mutations use `fetch(...)` directly (see the admin forms) with the `x-api-key` header, or TanStack Query.

---

## 3. Standard response contract

**Success** — the raw resource (object) or list (array). Create returns `201`.

**Error** — always the same safe shape (internal/Prisma details are never leaked):

```json
{ "message": "Human-readable reason" }
```

| Status | When |
| --- | --- |
| `200 OK` | Successful GET/PUT/DELETE |
| `201 Created` | Successful POST (resource created) |
| `400 Bad Request` | Missing/invalid body (Zod validation). `message` lists the offending fields, e.g. `title: title is required; tags: Required` |
| `404 Not Found` | Single resource (by slug) does not exist |
| `409 Conflict` | Slug/name already exists, or delete blocked by a dependency |
| `500 Internal Server Error` | Unexpected server/DB error (generic message; cause is logged server-side) |

Validation, slug generation, and these helpers are centralized in
[lib/api.ts](../lib/api.ts), [lib/validators.ts](../lib/validators.ts), and
[lib/slug-util.ts](../lib/slug-util.ts).

> **Auth:** there is currently **no authentication** on write endpoints
> (POST/PUT/DELETE). Anyone who can reach the API can mutate data. Treat the
> admin surface as trusted-network only until auth is added. (Documented gap.)

---

## 4. Endpoint reference

Slugs are generated server-side from the title/name; clients never send `slug`
in the body. `publishedAt`/`startDate`/`endDate` accept ISO date strings.
`tags`/`technologies` accept either a `string[]` or a comma-separated string.

### Home / hero — `UserDetail` (singleton)
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/user-details` | — | The single `UserDetail` object, or `null` if none exists |
| POST | `/api/user-details` | `{ welcomeTitle, welcomeNote, welcomeDescription, userImage, cvFile? }` | `201` created; `400` if one already exists (use PUT) |
| PUT | `/api/user-details` | same as POST | `200` updated; `404` if none exists yet |

### Social links — `UserSocialLink`
| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/user-social-links` | `UserSocialLink[]` |

*(No create/update endpoint — read-only. Documented gap.)*

### About paragraphs — `AboutContent`
| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/about-me` | `AboutContent[]` (ordered `createdAt asc`) |

*(Read-only. Documented gap.)*

### Projects — `Project`
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/projects` | — | `Project[]` (incl. `tools`, ordered `publishedAt desc`) |
| POST | `/api/projects` | `{ title, description, content, coverImage, category, technologies, publishedAt, githubUrl?, liveUrl? }` | `201` |
| GET | `/api/projects/{slug}` | — | `Project` (incl. `tools`) or `404` |
| PUT | `/api/projects/{slug}` | same as POST | `200` / `404` / `409` |
| DELETE | `/api/projects/{slug}` | — | `200 { message }` |

> **Project field homologation:** on create/update the API writes BOTH the
> canonical fields and their legacy mirrors so old and new readers agree:
> `cover = coverImage`, `link = liveUrl ?? githubUrl`, `about = description`.
> See §5.

### Skill categories — `SkillCategory`
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/skill-categories` | — | `SkillCategory[]` (incl. `skills` ordered `order asc`, ordered `order asc`) |
| POST | `/api/skill-categories` | `{ name, description?, icon?, color?, order? }` | `201` |
| GET/PUT/DELETE | `/api/skill-categories/{slug}` | PUT: same as POST | `200`/`404`/`409`; DELETE `400` if the category still has skills |

### Skills — `Skill`
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/skills` | — | `Skill[]` (incl. `category`, ordered `order asc`) |
| POST | `/api/skills` | `{ name, proficiency (0–100), categoryId, order? }` | `201`; `404` if `categoryId` invalid |
| GET/PUT/DELETE | `/api/skills/{slug}` | PUT: same as POST | `200`/`404`/`409` |

### Experiences — `Experience`
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/experiences` | — | `Experience[]` (ordered `startDate desc`) |
| POST | `/api/experiences` | `{ title, company, description, startDate, technologies, endDate?, location?, image?, clientImage? }` | `201` |
| GET/PUT/DELETE | `/api/experiences/{slug}` | PUT: same as POST | `200`/`404`/`409` |

### Educations — `Education`
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/educations` | — | `Education[]` (ordered `startDate desc`) |
| POST | `/api/educations` | `{ institution, degree, field, startDate, endDate?, order? }` | `201` |
| GET/PUT/DELETE | `/api/educations/{slug}` | PUT: same as POST | `200`/`404`/`409` |

---

## 5. Data models

Field tables abbreviated from [prisma/schema.prisma](../prisma/schema.prisma).
All models have `id`, `createdAt`, `updatedAt`.

**UserDetail** — `welcomeTitle`, `welcomeNote`, `welcomeDescription`, `userImage`, `cvFile?`
**UserSocialLink** — `name`, `link`, `icon`
**AboutContent** — `paragraph`
**SkillCategory** — `name` (unique), `slug` (unique), `description?`, `icon?`, `color?`, `order`, `skills[]`
**Skill** — `name`, `slug` (unique), `proficiency` (0–100), `categoryId` → `category`, `order`
**Experience** — `title`, `slug` (unique), `company?`, `description?`, `location?`, `image?`, `clientImage?`, `startDate`, `endDate?`, `technologies[]`, `inputs[]`, plus legacy `name?`
**Education** — `institution`, `degree`, `field`, `slug` (unique), `startDate`, `endDate?`, `order`

**Project** — canonical vs legacy fields (the API keeps them in sync — see §4):

| Canonical | Legacy (mirrored) | Notes |
| --- | --- | --- |
| `coverImage` | `cover` | image URL |
| `liveUrl` / `githubUrl` | `link` | `link = liveUrl ?? githubUrl` |
| `description` | `about` | summary |
| `content` | — | long body |
| `category`, `technologies[]`, `publishedAt`, `slug` (unique) | — | |
| `tools[]` (M2M via `toolIDs`/`projectIDs`) | — | included on GET |

The frontend `ProjectType` ([app/components/types/types.ts](../app/components/types/types.ts))
reads the legacy fields (`cover`, `link`, `about`) with fallbacks to the new
ones — both are now populated.

---

## 6. Server-side readers — `lib/data.ts`

Server Components query Prisma directly (no HTTP self-fetch, so pages
prerender with real content at build time):

| Helper | Prisma query | Returns |
| --- | --- | --- |
| `getHomeData()` | `userDetail.findFirst()` | `UserDetail \| null` |
| `getSocialLinks()` | `userSocialLink.findMany()` | `UserSocialLink[]` |
| `getAboutParagraphs()` | `aboutContent.findMany()` | `AboutContent[]` |
| `getProjects()` | `project.findMany({ include: { tools: true } })` | `Project[]` |
| `getSkillCategories()` | `skillCategory.findMany({ include: { skills: true } })` | `SkillCategory[]` |
| `getExperiences()` | `experience.findMany({ include: { inputs: true } })` | `Experience[]` |
| `getEducations()` | `education.findMany()` | `Education[]` |

---

## 7. Examples

```bash
# List projects
curl http://localhost:3000/api/projects

# Create a project (201)
curl -X POST http://localhost:3000/api/projects -H 'Content-Type: application/json' -d '{
  "title": "Portfolio Revamp",
  "description": "Cinematic redesign",
  "content": "Full case study…",
  "coverImage": "https://res.cloudinary.com/.../cover.jpg",
  "category": "Web",
  "technologies": ["Next.js", "Tailwind"],
  "publishedAt": "2026-01-01"
}'

# Invalid body → 400 { "message": "title: title is required; …" }
curl -X POST http://localhost:3000/api/projects -H 'Content-Type: application/json' -d '{}'

# Missing resource → 404 { "message": "Project not found" }
curl http://localhost:3000/api/projects/does-not-exist
```

---

## 8. Known gaps / TODO

- **Write auth depends on env**: root `proxy.ts` rejects mutations without a matching `x-api-key`, so `ADMIN_API_KEY` must be set in every environment (Vercel included) or the admin panel gets 401s.
- **No pagination** — list endpoints return all rows; add `?page`/`?limit` if data grows.
- **Project legacy fields** (`cover`/`link`/`about`/`name`) are mirrored, not yet retired — a future migration can drop them once all readers use the canonical fields.
