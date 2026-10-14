# Plan: Refactor + Rediseño AI-First Minimalista

**Fecha:** 2026-10-12
**Modo de rediseño:** Redesign-Preserve (rutas, slugs y contenido intactos; se preserva la voz y el teal de marca; se retira el "cinematic glow").
**Brief inferido:** portfolio de desarrollador para reclutadores, lenguaje AI-first radical (el chat/⌘K es la navegación) + minimalista frío, teal como único acento, sin aspecto de plantilla genérica.

**Dials:** `VARIANCE 6` · `MOTION 4` · `DENSITY 3` (aire, hairlines, sin glass/glow soup).

**Decisiones del usuario:**
- AI-first = UX radical (el asistente reemplaza la navegación; las páginas pasan a segundo plano).
- Paleta: refrescar a neutro frío + teal como único acento (no conservar crema).
- Home: ask-first hero + secciones curadas debajo.
- Nav: header slim (logo + 2 enlaces + ⌘K); footer como sitemap completo.

---

## Fase 0 — Sistema de diseño (tokens fríos + anti-genérico)

1. `app/globals.css`: light crema `#FBF6EA` → neutro frío; dark se mantiene `#03100E`; arreglar `--brand-green` duplicado de `--brand-dark`; eliminar `--brand-cream`.
2. `tailwind.config.js`: eliminar maps muertos (`bg`, `lightHomeBg`); limpiar `content` globs (`./pages`, `./src`); radius único vía `--radius`.
3. Migrar todos los hex hardcodeados a tokens: `MainLayout`, `SiteAtmosphere`, `focus-ring`, `RecruiterChat`, `header`, `BodyContent`, `globals.css`.
4. Quitar glow soup: `text-glow`, `animate-shimmer` (hero), `glow-pulse` (retrato), sombras neón de CTAs; bajar opacidad de aurora en `SiteAtmosphere`.
5. Anti-tells: quitar índices `01`/`02` (AboutTeaser, FeaturedProjects), eyebrows ≤ `ceil(secciones/3)`, cero `—` en textos nuevos, sin tres cards iguales.

## Fase 1 — Deuda técnica

1. Borrar dead code: `StatsSection.tsx`, `experiencePath.tsx`, `Skillbar` si no se usa, `.scss` legacy, dependencias muertas.
2. `header.tsx`: eliminar `window.addEventListener('scroll')` → `useScroll()` de framer-motion.
3. `MainLayout`: `min-h-screen` → `min-h-[100dvh]`; simplificar MutationObserver de tema.
4. i18n: strings hardcodeados del CV download → dictionary `en`/`es`.
5. Fronteras: crear `not-found.tsx`, `error.tsx`, `loading.tsx` públicos.
6. `RecruiterChat`: migrar paleta `stone/emerald` → tokens de marca.
7. Footer: revisar hrefs hardcodeados (`github.com`, `linkedin.com`, `contact@example.com`).
8. Admin: fuera de alcance de rediseño; verificar legibilidad tras tokens.

## Fase 2 — Shell AI-first: header slim + ⌘K

1. Header slim: logo + "Trabajo" + "Sobre mí" + idioma/tema + botón ⌘K. Rutas completas en footer sitemap.
2. Command palette ⌘K (componente propio, sin deps nuevas): modo buscar (páginas + anclas) + modo preguntar (`/api/assistant`, respuesta inline + "continuar en el chat"); `Esc`, ↑↓, `Enter`.
3. `RecruiterChat` como dock secundario minimal, siempre disponible.
4. i18n: nuevas keys `palette.*` + faltantes de `assistant.*` en `en`/`es`.

## Fase 3 — Home ask-first

1. `BodyContent`: ≤4 elementos de texto, headline ≤2 líneas, subtexto ≤20 palabras, CTA visible sin scroll, `pt-24` máx, **sin scroll cue**, sin fila de sociales (va al footer). CTA primario = input "Pregúntame sobre mi trabajo"; secundario = CV download. Retrato con marco hairline, sin glow.
2. `RecruiterChat.renderInline`: aceptar rutas relativas `/…` con `next/link` (hoy solo `http(s)`).
3. `lib/ai/profile-context.ts`: mapa de rutas + instrucción de enlazar páginas internas.
4. TechMarquee / AboutTeaser / FeaturedProjects / ContactCTA: de-glass + hairlines + familias de layout distintas (≥4); marquee solo 1 por página.

## Fase 4 — Páginas internas (5 rutas)

`/about`, `/experience`, `/projects`, `/blogs`, `/resources`: tokens nuevos, `PageHeader` unificado sin índices, tarjetas sin `backdrop-blur`/glow, variedad de familias, i18n y estados vacíos.

## Fase 5 — Verificación (gate obligatorio)

1. `npx tsc --noEmit` + `npx next lint --file <tocados>` + `npm run build`.
2. Checklist: contraste AA 4.5:1 ambos temas, hero gates, conteo eyebrows, cero `—`, un solo acento, radius único, `prefers-reduced-motion`, sin `h-screen`.
3. QA manual `npm run dev`: light+dark, móvil/desktop, ⌘K, chat con enlaces internos, i18n.
4. Lighthouse: LCP <2.5s, INP <200ms, CLS <0.1.

---

**Orden:** 0 → 1 → 2 → 3 → 4 → 5 (cada fase deja el sitio compilando).

**Fuera de alcance:** `/admin` (salvo legibilidad de tokens), Fases 2-4 del roadmap del asistente (tools/agenda/Cloudflare), vectorización.

---

## Progreso

- **Fase 0 ✅** (verificada: tsc + lint).
- **Fase 1 ✅** (verificada: tsc + lint + smoke 200/404 en dev):
  - Dead code borrado: `StatsSection`, `experiencePath` (tipo movido a `ExperienceTimeline`), `styles/*.scss` (+ dep `sass`), dashboard legado completo (`CRUDTable`, `DataGrid`, `AddExperience`, `DatePickerField`, `DatePickerWithPopover`) + carpeta duplicada `@\` + deps `ag-grid-*`, `react-skillbars`, `@types/react-vertical-timeline-component`, `modal/DeleteModal`.
  - `header.tsx`: `useScroll`/`useMotionValueEvent` en vez de `addEventListener('scroll')`.
  - `MainLayout`: sin `MutationObserver` de tema ni estado `activeRoute`; header usa `dark:` classes (prop `isDark` eliminada).
  - i18n CV (`cvDownloading` etc.), tema (`toggleTheme`), footer completo (`footer.*`) → en/es.
  - Fronteras nuevas: `app/not-found.tsx` (server, locale por cookie), `app/error.tsx` (client), `app/loading.tsx` (skeleton); reduced-motion ampliado (pulse/spin/ping).
  - `RecruiterChat`: stone/emerald → tokens de marca (burbujas, chips, input, send, FAB).
  - Un solo acento: gradients arcoíris de `AboutBody`/`projects` → brand; `ThemeToggle` sun/moon → `foreground`.
  - Footer: hrefs placeholder → links dinámicos desde `/api/user-social-links` (TanStack Query + `iconMap` exportado), corazón → accent.
  - Docs: `AGENTS.md`/`CLAUDE.md` actualizados (dashboard legado ya no existe).
- **Fase 2 ✅** (verificada: tsc + lint + smoke en dev, light y dark, desktop y móvil):
  - `header.tsx` slim: logo + "Trabajo" (`/projects`) + "Sobre Mí" (`/about`) + botón ⌘K + tema/idioma; drawer móvil ahora con el sitemap completo (6 rutas, incluye Blogs); pill activo `layoutId` con color sólido (sin gradiente); `Logo`/`MenuItem` tokenizados (`bg-brand-green`, `text-white dark:text-background`, sin `gray-*`); kbd según plataforma (`⌘K` / `Ctrl K`).
  - `assistant/CommandPalette.tsx` (nuevo, sin deps): ⌘K/Ctrl+K global + botón header, `Esc`/↑↓/`Enter`, buscar 6 páginas + anclas (`/#about`, `/#featured`), modo preguntar con respuesta inline vía `askAssistant` (exportado de `RecruiterChat`) y botón "Continuar en el chat"; `prefers-reduced-motion` respetado; overlay `bg-black/50` (sin blur pesado).
  - Acoplamiento palette→chat: `assistant/chat-events.ts` (`dranzr:open-chat` CustomEvent con seed); `RecruiterChat` escucha, abre el dock y siembra la conversación (histórico recortado a `MAX_HISTORY`).
  - `MainLayout`: estado `paletteOpen` + montaje de `CommandPalette` (solo rutas públicas).
  - i18n: `palette.*` (en/es) + `nav.work`.
  - Smoke: ⌘K abre/cierra, filtrado, ask responde (200, markdown renderizado), "Continuar en el chat" siembra el dock, ↑↓+Enter navega a `/experience`, Esc cierra, drawer móvil OK, 0 errores de consola.
- **Fase 3 ✅** (verificada: tsc + lint + smoke en dev con capturas):
  - `BodyContent` ask-first: ≤4 elementos de texto (headline, subtexto con `line-clamp-2` ≤20 palabras, input "Pregúntame sobre mi trabajo…" que abre el dock con foco en el input, botón CV); eliminados chip de estado, link "Ver trabajo", fila de sociales (viven en ContactCTA/footer) y scroll cue; retrato con marco hairline (`border-border`, sin glow `shadow-2xl`/borde brand, sin tag de esquina); headline bajó a `text-5xl md:text-6xl lg:text-7xl` para que los CTAs queden above the fold.
  - `RecruiterChat.renderInline`: `[label](/ruta)` relativa → `next/link` (con guard `//`); http(s) sigue en nueva pestaña. Comprobado en vivo: el asistente emite `[mis proyectos](/projects)`.
  - `RecruiterChat`: foco automático del input al abrir (evento/FAB/CTA hero).
  - `lib/ai/profile-context.ts`: `SITE_MAP` (6 rutas) en el system prompt + regla de enlazar con markdown relativo (nunca inventar rutas).
  - Home de-glass/tokens: `ContactCTA` sin `backdrop-blur-xl`/tinte brand → `bg-card border-border`; socials/chips/tags/flecha sin blur; `gray-*` → tokens en TechMarquee/AboutTeaser/FeaturedProjects/ContactCTA/SocialLink; hairlines neutros (`bg-border`).
  - Eyebrows home: 2 (`techTitle`, `aboutIndex`) ≤ ceil(4/3); se quitó `letsConnect` del CTA.
  - Footer: quick links ahora sitemap completo (6 rutas, incluye `/` y `/resources`).
  - i18n: `home.askPlaceholder` (en/es).
  - Nota: `welcomeNote` de la DB ocupa 4 líneas (el gate ideal es 2; es contenido editable desde `/admin`).
- **Fase 4 ✅** (verificada: tsc + lint + smoke en las 5 páginas internas, 0 errores de consola):
  - Índices numerados eliminados: `PageHeader` sin prop `index` (AboutBody, BlogsTitle, ExperienceTitle, ProjectsHeader, ResourcesContent actualizados) y `02` de `/projects`.
  - De-glass + tokens en tarjetas: `ProjectCard`, `BlogCard`, `ResourceCard`, `ExperienceTimeline`, `EducationTimeline`, `AboutBody` (quick facts, párrafos, CTA, skills), `projects/page.tsx` (stats), `ResourcesContent` (filtros, empty state), `LanguageSwitcher`, `SectionHeading`, `Skillbar`. Cero `backdrop-blur` y cero `shadow-brand-green` en público (header ⌘K y footer logo limpiados; admin fuera de alcance).
  - `gray-*` → tokens en todos los componentes anteriores.
  - i18n: `projects.*` (allTitle, countLabel, empty, stat*, newBadge), `resources.*` (filterTitle, resultsOne/Many, emptyTitle, emptyHint, by), `about.fact*` (8 keys), `about.skillsMeta/categoryMeta/noSkills`, `experience.*` (educationTitle/Subtitle, journeyTitle/Subtitle, empty, inField), `blogs.empty` — en/es.
  - `app/lib/server-i18n.ts` (nuevo): `serverT()` para páginas server (mismo patrón cookie/accept-language que not-found/loading).
  - Estados vacíos: `/blogs` (nuevo), `/experience` (nuevo), `/projects` y `/resources` ya los tenían.
  - `Skillbar`: eliminado el gradiente emerald hardcodeado `#10b981/#059669` (bug: `category.color` se ignoraba) → siempre brand; barras sin doble gradiente.
  - Timelines: separador de fechas `—` → `·`; `en {field}` → `t.experience.inField`.
  - Smoke: /projects (stats ES, badge Nuevo, 1 proyecto), /about (4 facts, CTA, skillsMeta), /experience (Educación/Experiencia, timeline Coforge), /blogs (empty state), /resources (21 cards, filtros, results count).
- **Fase 5 ✅** (gate final, verificada):
  - `npm run build` exitoso: 30 páginas, rutas públicas `ƒ (Dynamic)` (no-store por diseño), First Load JS 135-159 kB.
  - `npx tsc --noEmit` + `next lint` limpios.
  - Lighthouse home: **100 Accesibilidad / 100 Best Practices / 100 SEO / 99 Agentic Browsing**, CLS 0.055 (good).
  - Fixes de accesibilidad del audit: logo header con `aria-label`, link "READ MORE" → "About" (AboutTeaser), `--muted-foreground` light 46.9% → 42% (contraste AA), botón ⌘K sin mismatch (aria-label removido, contenido = nombre).
  - QA visual: home light/dark desktop + móvil 375px, ⌘K abre palette, toggle i18n EN↔ES (cookie + re-render), 0 errores de consola.
  - Dev server reiniciado en puerto 3000.
- **Follow-up: refactor con skill `design-taste-frontend` ✅** (VARIANCE 6 / MOTION 5 / DENSITY 4):
  - Causa del "raro": keys del diccionario eliminadas que `ExperienceIntro` aún usaba → renderizaba `undefined`.
  - `/experience`: intro IA sin caja (statement + chips, sin barras duplicadas de Skillbar); `CollapsibleSection` (hairlines, títulos semibold, animación grid-rows sin `height`); timeline con nodo simple; educación como filas compactas `divide-y` (familia distinta a las cards); badge "Now" en rol actual; copy sin em-dashes.
  - App-wide: eliminado h2 duplicado en `/about`, h2 del CTA `7xl→5xl`, labels de filtros sin mono, `nav.toggleMenu` i18n, borrado `SectionHeading` muerto.
  - Verificado: tsc + lint limpios, accordion abre/cierra, 0 errores de consola.
- **Follow-up 2: skill a todas las páginas ✅** (mismo lenguaje: stat-strip dividido, una sola jerarquía display por página):
  - `/about`: quick-facts de 4 cards a strip dividido sin cajas (bio paragraphs quedan como única familia de cards + CTA).
  - `/projects`: stats a strip + valores Poiret→sans (ya no compiten con el h2 "All projects").
  - `/blogs`: empty state con link "Ask the assistant about my writing" → abre el dock (nuevo `BlogsEmptyState.tsx` + keys `blogs.emptyCta`).
  - `/home`: quote AboutTeaser `5xl→4xl` máx (no compite con Featured h2); CTA ya en `5xl`.
  - Verificado: tsc + lint limpios, Lighthouse home 100/100/100/99, 0 errores consola, toggle accordion y ask-link funcionan.
- **Follow-up 3: auténtico + moderno en no-home ✅** (skill, una familia distinta por sección):
  - `/about`: bio de N cards a prosa editorial (lead grande + párrafos con hairlines, sin cajas ni hover).
  - `/projects`: featured-first (proyecto `isNew` en variante horizontal `featured` full-width + resto en grid 2-col).
  - `/blogs`: empty state editorial (statement + botón pill al asistente, sin caja dashed).
  - `/resources`: filtros de card con selects a toolbar slim de pills con conteos live (categorías + tipos) + `aria-pressed`/`role=group`.
  - Verificado: tsc + lint limpios, filtrado pills funciona, 0 errores consola, screenshots confirman jerarquía.
- **Follow-up 4: QA rediseños ✅** (Lighthouse + móvil):
  - `/projects`: 100/100/100/100, 0 fallos. `/resources`: 98→100 tras fix `heading-order`.
  - Fixes orden de headings: count de resultados `<p>→<h2>`, `BlogCard`/`AboutBody` CTA `h3→h2`, `CollapsibleSection` a patrón `h2>button` (WAI-ARIA accordion).
  - Móvil 375px: pills envuelven limpio, featured apila cover+contenido, strips en 2-col sin divisores.
- **Follow-up 5: cobertura total + build ✅**:
  - Lighthouse 100/100/100/100 en las 6 páginas públicas (`/about`, `/experience`, `/blogs` auditadas; footer `h3→h2` fix del último `heading-order`).
  - `aria-hidden` en contenido de accordions colapsados; dark mode verificado con screenshots (pills, timeline, strips).
  - `npm run build` exitoso con todos los cambios (30 páginas, First Load 135-159 kB); dev server reiniciado en :3000.
- **Follow-up 7: CRUD Social Links en admin ✅** (faltaba edición):
  - API: POST colección (zod `socialLinkSchema` + 409 por nombre) + `[id]` GET/PUT/DELETE por ObjectId (400 id inválido, 404, 409 en rename).
  - Admin: `SocialLinkForm` (name/link + select de las 8 keys de `iconMap` con preview, otras no renderizan en footer) + página `/admin/social-links` (DataTable: name/link/icon) + entrada en sidebar.
  - Verificado: ciclo API 201/409/200/404/400, crear vía UI aparece en tabla, tsc + lint limpios, 0 errores consola. Filas de prueba eliminadas.
  - Icono `facebook` agregado a `iconMap` (+ form) y fila FB legacy (URL→key) corregida; footer lo muestra verificado con screenshot.
- **Follow-up 8: CRUD About en admin ✅**: POST + `[id]` GET/PUT/DELETE (400/404, zod `aboutSchema`); `AboutForm` (textarea) + `/admin/about` (DataTable) + sidebar; verificado 201/200/404/400 y UI con filas reales.
- **Propuesta: página IA especializada (evaluada, SIN implementar)**:
  - Gap: el portfolio dice "AI Engineer" pero no hay showcase de IA (el asistente es herramienta, el strip de experience es teaser, skills IA son 2).
  - Opción A (recomendada): ruta `/ai` — statement + demo CTA (abre el dock) + "how it works" honesto (RAG estático ~7KB, provider agnóstico, rate-limit) + stack + skills DB. Sin DB ni deps. Registro en footer/palette/SITE_MAP (sería ruta 7).
  - Opción B (no): sección en home — rompe flujo curado y duplica hero-ask + dock.
  - Opción C (no): expandir strip de /experience — mezcla historia laboral con técnica.
  - Opción D (complemento de A): asistente como Project creado en admin (alimenta /projects + featured sin código).
- **Follow-up 9: página `/ai` implementada (opción A) ✅**:
  - `app/ai/`: header + demo live (CTA abre dock; 3 samples preguntan vía `askAssistant` y siembran Q+A) + "How it works" (4 filas honestas del sistema real) + stack chips + skills IA de DB.
  - i18n `ai.*` en/es + `nav.ai`; ruta 7 registrada en footer, palette, drawer móvil y SITE_MAP del prompt.
  - Incidente: caché stale del dev ignoró un string (SSR lo confirmó); reinicio lo resolvió.
  - Verificado: tsc + lint limpios, demo end-to-end (Q+A en dock), Lighthouse /ai 100/100/100/100, 0 errores consola.
- **Follow-up 6: polish de componentes con `emil-design-eng` ✅**:
  - Palette ⌘K instantáneo (fuera motion de 180ms; acción de teclado 100+/día, sin animación).
  - `.pressable` (utilidad exacta 160ms) + `active:scale` en CTAs, pills, icon-buttons, FAB, send, drawer, footer socials.
  - Fuera lifts en hover (Blog/Resource/Featured/socials); `transition-all`→props exactas; duraciones UI 500→300ms; stagger timeline 100→60ms; dots timeline sin `scale(0)`; tech pill 0.8→0.9.
  - Verificado: tsc + lint limpios, palette abre instantáneo con foco, 0 errores consola.
- **Nota:** `prisma generate` falla con EPERM si el dev server (puerto 3000) está corriendo (dll bloqueada); el cliente generado previo sigue siendo válido mientras el schema no cambie.
