# API Integration Guide (Frontend)

Authoritative reference for consuming the portfolio backend (`app/api/**`). The
API is a set of Next.js 14 App Router route handlers backed by Prisma +
MongoDB. All endpoints accept/return **JSON**.

> Generated alongside the backend standardization pass. If a route's behavior
> changes, update this doc.

---

## 1. Base URL & environment

| Var | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base origin used by the server to absolutize relative `/api/*` paths (client uses same-origin relative paths, no CORS). **Public**. | `http://localhost:3000` |
| `DATABASE_URL` | MongoDB connection string (Prisma). Server-only. | — |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Direct image uploads from the authoring UI. | — |

All endpoints live under `<base>/api/...`.

---

## 2. Fetching — `fetchJSON` ([lib/request-util.ts](../lib/request-util.ts))

The app reads through a tiny helper:

```ts
// Client: same-origin relative fetch (no CORS). Server: absolutized (slashes trimmed).
export async function fetchJSON<T>(url: string): Promise<T> {
  // Client: same-origin relative (no CORS). Server: absolutized with
  // NEXT_PUBLIC_API_URL (trailing slashes trimmed).
  // Client: same-origin relative fetch (no CORS on any domain).
  // Server: absolutized with NEXT_PUBLIC_API_URL (trailing slashes trimmed).
  // Client: same-origin relative (no CORS). Server: absolutized (slashes trimmed).
  // Client: same-origin relative fetch (no CORS). Server: absolutized (slashes trimmed).
  // Client: same-origin relative fetch (no CORS). Server: absolutized (slashes trimmed).
  // Client: same-origin relative fetch (no CORS). Server: absolutized (slashes trimmed).
  // Client: same-origin relative fetch (no CORS). Server: absolutized (slashes trimmed).
  const response = await fetch(fullUrl, { method: "GET", cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  return response.json();
}
```

Key facts:
- Client requests stay same-origin relative (`/api/...`) — no CORS on any domain.
- Server requests are absolutized with `NEXT_PUBLIC_API_URL` (trailing `/` trimmed, so no `//api` 404s).

Key facts:
- Client requests stay same-origin relative (`/api/...`) — no CORS on any domain.
- Server requests are absolutized with `NEXT_PUBLIC_API_URL` (trailing `/` trimmed, so no `//api` 404s).

Key facts:
- Client requests stay same-origin relative (`/api/...`) — no CORS issues on any domain.
- Server requests are absolutized with `NEXT_PUBLIC_API_URL` (trailing slashes trimmed, so no `//api` 404s).

Key facts:
- Client requests stay same-origin relative (`/api/...`) — no CORS on any domain.
- Server requests are absolutized with `NEXT_PUBLIC_API_URL` (trailing `/` trimmed).

Key facts:
- Client requests stay same-origin relative (`/api/...`) — no CORS on any domain.
- Server requests are absolutized with `NEXT_PUBLIC_API_URL` (trailing `/` trimmed, so no `//api` 404s).

Key facts:
- Client requests stay same-origin relative — no CORS on any domain.
- Server requests are absolutized with `NEXT_PUBLIC_API_URL` (trailing `/` trimmed).

Key facts:
- Client requests are same-origin relative (`/api/...`) — no CORS issues on any domain.
- Server requests are absolutized with `NEXT_PUBLIC_API_URL` (trailing `/` trimmed, so no `//api` 404s).
- Always `cache: 'no-store'` — every call hits the API fresh (no caching).
- On any non-2xx it **throws** `Error("HTTP Error: <status>")` (it does not read the error body).
- It only does GET. Mutations use `fetch(...)` directly (see the admin forms) or TanStack Query.

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

### Blogs — `Blog`
| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/blogs` | `Blog[]` (ordered `createdAt desc`) |

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

### Resources — `Resource`
| Method | Path | Query / Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/resources` | query: `categoryId`, `tags` (comma list, `hasEvery`), `type` | `Resource[]` (incl. `category`, ordered `publishedAt desc`) |
| POST | `/api/resources` | `{ title, description, content, coverImage, type, categoryId, tags, author, publishedAt, link?, readTimeMinutes? }` | `201` |
| GET | `/api/resources/{slug}` | — | `Resource` (incl. `category`) or `404` |
| PUT | `/api/resources/{slug}` | same as POST | `200` / `404` / `409` |
| DELETE | `/api/resources/{slug}` | — | `200 { message }` |

### Resource categories — `ResourceCategory`
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/resource-categories` | — | `ResourceCategory[]` (ordered `name asc`) |
| POST | `/api/resource-categories` | `{ name, description? }` | `201` |
| GET/PUT/DELETE | `/api/resource-categories/{slug}` | PUT: `{ name, description? }` | `200`/`404`/`409` (DELETE `409` if resources still reference it) |

### Categories — `ResourceCategory` (⚠ duplicate of the above)
`/api/categories` and `/api/categories/{slug}` operate on the **same**
`ResourceCategory` model with identical behavior. The **admin UI** uses
`/api/categories`; the **public frontend** uses `/api/resource-categories`.
Prefer `/api/resource-categories` for new code; the pair should be consolidated
in the future.

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
| POST | `/api/experiences` | `{ title, company, description, startDate, technologies, endDate?, location?, image? }` | `201` |
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
**Blog** — `title` (unique), `cover`, `link`
**Resource** — `title` (unique), `slug` (unique), `description`, `content`, `coverImage`, `type`, `categoryId` → `category`, `tags[]`, `author`, `publishedAt`, `link?`, `readTimeMinutes?`
**ResourceCategory** — `name` (unique), `slug` (unique), `description?`, `resources[]`
**SkillCategory** — `name` (unique), `slug` (unique), `description?`, `icon?`, `color?`, `order`, `skills[]`
**Skill** — `name`, `slug` (unique), `proficiency` (0–100), `categoryId` → `category`, `order`
**Experience** — `title`, `slug` (unique), `company?`, `description?`, `location?`, `image?`, `startDate`, `endDate?`, `technologies[]`, `inputs[]`, plus legacy `name?`
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

## 6. Existing frontend readers — `getXxxV2` ([app/requests/requests.ts](../app/requests/requests.ts))

Server Components fetch through these (each wraps `fetchJSON` and returns a safe
empty/`null` fallback on error):

| Helper | Endpoint | Returns |
| --- | --- | --- |
| `getHomeDataV2()` | `/api/user-details` | `HomeDataType \| null` |
| `getSocialLinksV2()` | `/api/user-social-links` | `SocialLinkType[]` |
| `getAboutParagraphsV2()` | `/api/about-me` | `AboutType[]` |
| `getBlogsV2()` | `/api/blogs` | `BlogType[]` |
| `getProjectsV2()` | `/api/projects` | `ProjectType[]` |
| `getResourcesV2(categoryId?, tags?, type?)` | `/api/resources?…` | `ResourceType[]` |
| `getResourceCategoriesV2()` | `/api/resource-categories` | `ResourceCategoryType[]` |
| `getSkillCategoriesV2()` | `/api/skill-categories` | `SkillCategoryType[]` |
| `getExperiencesV2()` | `/api/experiences` | `ExperienceType[]` |

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

- **No write auth** on POST/PUT/DELETE (highest-priority follow-up).
- **No create/update endpoints** for `blogs`, `about-me`, `user-social-links` (GET-only) — add if the admin needs to manage them via API.
- **Duplicate** `/api/categories` ↔ `/api/resource-categories` — consolidate (point the admin at `/api/resource-categories`, then remove `/api/categories`).
- **No pagination** — list endpoints return all rows; add `?page`/`?limit` if data grows.
- **Project legacy fields** (`cover`/`link`/`about`/`name`) are mirrored, not yet retired — a future migration can drop them once all readers use the canonical fields.
