# AGENTS.md

Guía para agentes de IA (Claude Code, opencode, Cursor, etc.) que trabajen en este repositorio. Para guía de desarrollo humano ver `CLAUDE.md`.

## Qué es este proyecto

Portfolio personal Next.js 16 (App Router, React 19) con:

- Render público server-side (Home, About, Experience, Projects).
- UI de autoría/admin (`/admin`).
- Contenido multilingüe (en/es) con i18n propio (no next-intl).
- MongoDB + Prisma, y un asistente de reclutadores (Gemini + RAG estático) montado como shell AI-first (⌘K + chat).

## Comandos

```bash
npm run dev                 # dev server (http://localhost:3000)
npm run build               # build producción
npm run lint                # eslint . (flat config)
npx tsc --noEmit            # typecheck (NO hay `npm run typecheck`)
pnpm contract:emit          # re-emitir contract.json/.d.ts tras editar prisma/contract.prisma
npx tsx prisma/seed-profile.ts  # seed (requiere DATABASE_URL)
```

**Sin test runner.** No hay Jest/Vitest/Playwright. No afirmes que "los tests pasan": verifica con `npx tsc --noEmit`, `npm run lint` y un smoke manual con `npm run dev`.

**Entorno:** Node >= 24 (según `package.json` engines). Instalación con `pnpm` (npm falla con error arborist); si `pnpm install` queja, usa `pnpm install --force`.

## Variables de entorno

En `.env.example`. Importantes:

- `DATABASE_URL` — MongoDB (requerida por Prisma).
- `ADMIN_API_KEY` + `NEXT_PUBLIC_ADMIN_API_KEY` (mismo valor) — el proxy raíz (`proxy.ts`, `export function proxy`) exige `x-api-key` en POST/PUT/DELETE; el admin la envía desde el cliente. **Si `ADMIN_API_KEY` no está en Vercel, toda mutación responde 401.**
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
- Slug: usar `generateSlug` de `lib/slug-util.ts` (única fuente de verdad).
- Al crear registros con slug, check de colisión → `409`.

### Prisma 8 / MongoDB

- Contrato en `prisma/contract.prisma` (`// use prisma-8`); tras editarlo correr `pnpm contract:emit` y commitear `contract.json` + `contract.d.ts`. Sin `generate`, sin `db push` (lecturas/escrituras directas sobre colecciones existentes).
- Versiones pineadas: CLI `prisma@8.0.0-rc.22` + `@prisma/orm-mongo@8.0.0-rc.18` + override pnpm `@prisma/orm-toolchain@8.0.0-rc.18` (el CLI trae un toolchain viejo que rompe el descriptor mongo; no tocar sin re-verificar `contract:emit`).
- Queries vía `db.orm.<Colección>` (nombre exacto de colección: `db.orm.Project`, `db.orm.UserSocialLinks`): `.where({...}).first()`, `.all()`, `.orderBy({ f: 1 | -1 })`, `.limit()`, `.include('rel')`, `.create({...})`, `.where().update()`, `.where().delete()`, `.where().deleteAndCount()`. Sin `findUnique/findFirst/deleteMany`, sin transacciones.
- Documentos usan `_id` (string), no `id`: normalizar con `withId/withIds` de `lib/mongo-util.ts` en el borde (rutas API, `lib/data.ts`).
- Sin M2M en PSL (`PSL_ORPHANED_BACKRELATION`): `Project` ↔ `ProjectTool` se joinnea en app con `attachTools()` (`toolIDs`/`projectIDs` como `ObjectId[]` planos).
- Sin `@default(0)` en PSL mongo: defaults en zod (`lib/validators.ts`) o `?? 0` en rutas.
- `params` de routes dinámicos y `cookies()`/`headers()` son async: siempre `await`.
- Siempre importar Prisma desde `lib/db.ts` (singleton) — nunca crear clientes en módulos.
- `next.config.js` tiene `serverExternalPackages: ["@prisma/orm-mongo", "mongodb"]` (Turbopack rompe el parsing del connection string si los bundlers internos).

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
lib/
  ai/                       # gemini.ts, provider.ts, profile-context.ts, rate-limit.ts
  data.ts                   # lecturas server (Prisma directo, prerender)
  db.ts                     # singleton Prisma
  validators.ts             # zod schemas (assistantSchema, etc.)
  mongo-util.ts             # withId/withIds/attachTools (borde Prisma 8 → app)
prisma/contract.prisma      # contrato PSL v8 (emit → contract.json/.d.ts)
```

## Flujo de datos (público)

```
Server Component page → lib/data.ts (Prisma directo, prerender en build)
  → lib/db.ts (singleton) → MongoDB
```

Lecturas públicas van directo a Prisma (sin HTTP, prerenderizables). Mutaciones del cliente van por TanStack Query (`app/providers/tanstack.provider.tsx`) contra `/api/*` con header `x-api-key`, protegido por `proxy.ts` raíz (GETs públicos, resto exige `ADMIN_API_KEY`). `lib/request-util.ts#fetchJSON` es solo-cliente (relativo same-origin).

## Verificación antes de afirmar "listo"

1. `npx tsc --noEmit` limpio.
2. `npm run lint` limpio.
3. `npm run build` exitoso.
4. Smoke manual relevante con `npm run dev` (temas, i18n, rutas afectadas).
5. Si tocaste tokens/paleta: revisar también `/admin` (comparte `globals.css`).

## Rama `cloudflare-opennext` (deploy alternativo en Workers) — DESPLEGADO ✅

- URL prod: `https://dranzr.com` (custom domain, route de zona `dranzr.com/*` → worker `portfolio`, declarado en `wrangler.jsonc`); alias técnico `https://portfolio.cardenascode7.workers.dev`. Desplegado 2026-10-16, adapter `@opennextjs/cloudflare@1.20.12`.
- Custom domain NO usar: el apex tiene registros DNS gestionados externamente, así que `custom_domain: true` falla. Va por `routes` con `zone_name`. Nunca declarar `workers_dev: false` sin querer: un deploy parcial con custom domain lo apagó una vez y tumbó el subdominio.
- `next.config.js` `images.qualities: [75, 90]` (Next 16 exige allowlist de quality); el retrato del hero usa `quality={90}` + `preload` (`priority` está deprecado en Next 16). Cloudflare Images re-encoda: sirve WebP (~150KB) con `Vary: Accept`.
- Adapter + `wrangler.jsonc` (R2 `portfolio-opennext-cache` creado, binding `AI`, `nodejs_compat`). Proxy (`proxy.ts`) incluido en el bundle.
- Asistente con Workers AI: `AI_PROVIDER=cloudflare` usa `lib/ai/cloudflare.ts` (**Llama 3.3 70B** `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, override con `CLOUDFLARE_AI_MODEL`); verificado en prod con respuesta real. ~127 neurons/mensaje → ~75 msgs/día gratis.
- BD en Workers: Prisma 8 usa el driver `mongodb` directo (verificado en prod contra Atlas). Accelerate **no soporta MongoDB**; el worker usa `DATABASE_URL` normal vía `wrangler secret put` (ya subidos `DATABASE_URL` + `ADMIN_API_KEY`).
- `DATABASE_URL` del worker lleva `&maxIdleTimeMS=1000&socketTimeoutMS=5000` (el `.env` local, no): workerd invalida los sockets al terminar cada request y el pool reciclaba conexiones muertas en turnos alternos (50% hangs). Con idle cap bajo cada request abre conexión fresca. Si ves hangs alternados en prod, revisar estos params.
- `.npmrc` con `node-linker=hoisted`: el layout pnpm aislado rompe esbuild en Windows (`Cannot read directory .pnpm/...`); con hoisted `pnpm build:cf` funciona en Windows. No quitar sin re-verificar el build.
- Notas de versión: adapter 1.20.12 requerido por Next 16.4 (`preview-props.json` no se incrustaba en 1.20.11 → worker 500 en init).
- `pnpm build:cf` / `deploy` / `preview` en `package.json`. OAuth con scopes k2 incompletos — si el deploy se queja, `wrangler login` para refrescar.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
