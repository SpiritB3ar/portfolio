# AGENTS.md

Guía para agentes de IA (Claude Code, opencode, Cursor, etc.) que trabajen en este repositorio. Para guía de desarrollo humano ver `CLAUDE.md`.

## Qué es este proyecto

Portfolio personal Next.js 14 (App Router) con:

- Render público server-side (Home, About, Experience, Projects, Blogs, Resources).
- UI de autoría/admin (`/admin`).
- Contenido multilingüe (en/es) con i18n propio (no next-intl).
- MongoDB + Prisma, y un asistente de reclutadores (Gemini + RAG estático) montado como shell AI-first (⌘K + chat).

## Comandos

```bash
npm run dev                 # dev server (http://localhost:3000)
npm run build               # build producción
npm run lint                # next lint
npx tsc --noEmit            # typecheck (NO hay `npm run typecheck`)
npx prisma generate         # regenerar cliente Prisma
npx prisma db push          # sync schema.prisma → MongoDB (sin migraciones)
npx prisma db seed          # seed (ts-node, requiere DATABASE_URL)
```

**Sin test runner.** No hay Jest/Vitest/Playwright. No afirmes que "los tests pasan": verifica con `npx tsc --noEmit`, `npm run lint` y un smoke manual con `npm run dev`.

**Entorno:** Node >= 24 (según `package.json` engines). Instalación con `pnpm` (npm falla con error arborist); si `pnpm install` queja, usa `pnpm install --force`.

## Variables de entorno

En `.env.example`. Importantes:

- `DATABASE_URL` — MongoDB (requerida por Prisma).
- `NEXT_PUBLIC_API_URL` — base para `lib/request-util.ts#fetchJSON` solo en servidor (absolutiza `/api/*`); el cliente pide en relativo same-origin (sin CORS); es **pública**.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — uploads directos desde la UI de autoría.
- `GEMINI_API_KEY` — clave del asistente; **solo server-side**, nunca exponer al cliente.
- `ASSISTANT_MODEL` (default `gemini-3.8-flash`), `AI_PROVIDER` (`gemini`).

No existe `API_URL` (sin prefijo público) — docs que la mencionan están mal.

## Convenciones clave

### Asistente (capa `lib/ai/`)

- RAG **estático**: contexto completo de perfil (~7KB) cacheado 5 min, límite ~12k. No vectorizar.
- Modelo por defecto `gemini-3.8-flash`; provider agnóstico (`provider.ts` factory) por si llega Cloudflare después.
- Prompt en **primera persona** ("eres el dueño del portfolio"), respuestas 1-4 frases, idioma según UI.
- `renderInline` en `RecruiterChat.tsx` acepta `**bold**`, `[label](https://…)` **y rutas relativas `/…`** (con `next/link`) — el chat es la navegación.

### API routes

- `parseBody` + zod para validar; `fail`/`serverError` de `lib/api.ts`.
- Errores: `{ message }` al cliente; nunca exponer detalles internos (stack, provider errors).
- Slug: usar la versión inline de los routes (`/[^\w\s-]/g`, `/[\s_-]+/g`), NO `lib/slug-util.ts` (bugueada con `\\s` doble).
- Al crear registros con slug, check de colisión → `409`.

### Prisma / MongoDB

- Provider MongoDB: solo `db push` (no hay migraciones SQL).
- Siempre importar Prisma desde `lib/db.ts` (singleton) — nunca `new PrismaClient()` en módulos.
- `Project` ↔ `ProjectTool` es many-to-many vía arrays `String[] @db.ObjectId` (`toolIDs`/`projectIDs`), estilo Mongo.

### i18n

- Custom hook `useLanguage()` → `{ lang, t, changeLanguage }`.
- Para agregar una key: extender **ambos** `en` y `es` en `app/lib/dictionary.ts` (el tipo sale de `en`).
- Locale se resuelve server-side en `app/layout.tsx` (cookie `NEXT_LOCALE` → `accept-language` → `'en'`).

### Frontend / diseño

- Paleta fría con teal como único acento; tokens en `app/globals.css` (`--brand-*`). No agregar segundas marcas ni colores random.
- Tailwind + Framer Motion. No hay `motion/react`; se usa `framer-motion`.
- Anti-tells (reglas del rediseño): sin índices numerados (`01`, `001`), sin glow neón, sin `backdrop-blur` pesado, sin tres cards iguales, eyebrows mono contados (`≤ ceil(secciones/3)`), cero `—` en textos visibles, radius vía `--radius`.
- `prefers-reduced-motion` en toda animación.
- Imágenes remotas: solo hosts en `next.config.js` `remotePatterns` (cloudinary, api.bearcodev.com, unsplash) — agregar el host antes de usar un `<Image>` de otro dominio.
- Dark mode: estrategia `dark:` class, toggled por `ThemeProvider` contra `localStorage['theme']`.

### UI de autoría

- `app/admin/*` — única UI de autoría (Radix/shadcn-ish, TanStack Query). El dashboard legado (`app/dashboard`, CRUDTable, AG Grid) fue eliminado; en `app/components/dashboard/` solo quedan `DataTable.tsx` y `DatePicker.tsx`, compartidos por `/admin`.
- Al agregar contenido nuevo, seguir el patrón `/admin`.

## Estructura útil

```
app/
  page.tsx                  # Home (server component)
  components/
    BodyContent.tsx         # hero ask-first
    header.tsx              # header slim
    MainLayout.tsx          # layout público (monta SiteAtmosphere, RecruiterChat)
    SiteAtmosphere.tsx      # canvas fondo
    assistant/RecruiterChat.tsx
    home/                   # AboutTeaser, ContactCTA, TechMarquee
    types/types.ts          # tipos compartidos — actualizar al cambiar modelos/respuestas
  api/assistant/route.ts    # endpoint del asistente
  lib/dictionary.ts         # i18n en/es
  requests/requests.ts      # getXxxV2 (fetch a /api/* con cache: 'no-store')
lib/
  ai/                       # gemini.ts, provider.ts, profile-context.ts, rate-limit.ts
  db.ts                     # singleton Prisma
  validators.ts             # zod schemas (assistantSchema, etc.)
prisma/schema.prisma
```

## Flujo de datos (público)

```
Server Component page → app/requests/requests.ts (getXxxV2)
  → lib/request-util.ts#fetchJSON (cache: 'no-store')
  → HTTP /api/* → Prisma (lib/db.ts) → MongoDB
```

Cada load re-hittea la API (sin cache). Mutaciones del cliente van por TanStack Query (`app/providers/tanstack.provider.tsx`).

## Verificación antes de afirmar "listo"

1. `npx tsc --noEmit` limpio.
2. `npm run lint` limpio.
3. `npm run build` exitoso.
4. Smoke manual relevante con `npm run dev` (temas, i18n, rutas afectadas).
5. Si tocaste tokens/paleta: revisar también `/admin` (comparte `globals.css`).
