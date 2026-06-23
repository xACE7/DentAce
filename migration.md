# DentAce — technical overview

How the project is organised and built. For the day‑to‑day authoring guide see
[`how-to-add-contents.md`](./how-to-add-contents.md); for a plain‑language folder tour see
[`explaination.md`](./explaination.md).

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**.
- A single content **renderer** reads JSON; a single **quiz engine** reads JSON.
- Content availability is **discovered from disk** — there is no manifest of counts to maintain.
- Two visual **designs** (Paper / chalk, Default / neon) × **mode** (dark/light) × **language** (EN/AR),
  driven by a small theme registry + CSS tokens.
- Fully static: `npm run build` prerenders every route; `npm run export` emits a standalone `out/`.

---

## Folder map

```
src/app/
  (nav)/      home · semester · subject · list · search · dashboard · plan   → loads the nav CSS chain
  (study)/    lecture · test                                                 → loads the lecture CSS chain
  layout.tsx  <html>, no‑flash theme boot script, analytics, ThemeProvider, Chrome, PWA register
src/components/
  chrome/     ONE shared header (TopBar · Breadcrumbs · Stats · Settings · Lang · Footer · ToTop · Offline)
  content/    LectureRenderer (+ LectureView)   — the single lecture renderer
  quiz/       QuizEngine                          — the single test engine
  nav/        the Board/Card views for the nav pages
src/lib/
  theme/      themes registry · ThemeProvider · chalk‑icon rendering   (the design wrapper)
  content/    types · loader (reads JSON from disk) · contentIndex (generated) · Bi/inline renderers · nav helpers
  site-config.ts   nav structure (years → semesters → subjects + duas)
  titles.ts        lecture‑topic subtitles
  progress.ts      ALL localStorage logic (done · scores · streak · recent · plan · saq) in one place
src/styles/   the stylesheets, split into a nav chain (style.css) and a lecture chain (study.css), plus
              themes.css (extensible colour themes)
public/content/<year>/<sem>/<sub>/{lecture,test}/N.json   ← the content source of truth
public/3rd-year/.../{pdf,img}/                            ← PDFs & images
tools/migrate/   helper scripts (notably discover.ts, which rebuilds the content index)
```

---

## Content model + discovery

- Each lecture/test is one JSON file under `public/content/<year>/<sem>/<sub>/{lecture,test}/N.json`.
- The shape is defined in `src/lib/content/types.ts` (`Unit` for lectures, `Quiz` for tests). Body text
  is plain text with lightweight inline markup — `[imp] [exam] [extra] [def] [mic] [b] [u] [br] [r]…[/r]` —
  and an `{ "html": "…" }` escape hatch for anything unusual. Strings are bilingual `{ "en", "ar" }`.
- `LectureRenderer` builds the chalk "sheets" from a `Unit`; `QuizEngine` runs casual + timed‑exam modes
  from a `Quiz` (MCQs of any option count, plus short‑answer questions).
- **Discovery, not a manifest:** `tools/migrate/discover.ts` scans `public/content` (lectures/tests) and
  `public/<base>/pdf` (PDFs), then regenerates `src/lib/content/contentIndex.ts`. Routes are produced
  with `generateStaticParams`, and the loader reads the JSON at build time. Add a file, run
  `npm run discover`, and it appears everywhere (menus, search, progress) with no list to edit.

---

## Design / theme wrapper

- `src/lib/theme/themes.ts` is a typed registry of designs, modes and colour themes; `ThemeProvider`
  applies them to the document and persists the choice to `localStorage`. The ⚙ panel is generated
  from the registry.
- **Add a design** = one registry entry + a `[data-design="id"]` token block in `src/styles/`.
- **Add a colour theme** = one registry entry + four lines in `src/styles/themes.css`
  (`--title-a / --title-b / --glow-main / --hl`).
- A no‑flash inline `<head>` script sets `data-theme/design/mode/lang` from `localStorage` before first
  paint, so there is never a flash of the wrong theme.

The CSS is split into two chains loaded by route group — nav pages load `style.css`, lecture/test pages
load `study.css` — so their token systems never collide.

---

## Shared logic (loosely coupled)

- One `Chrome` (top bar + breadcrumbs + stats + settings + language + footer + offline + back‑to‑top) is
  rendered once for every page.
- One `src/lib/progress.ts` owns every `localStorage` concern (done state, test scores, study streak,
  recent items, study plan, short‑answer drafts), shared by the dashboard, plan, lists, lecture nav and quiz.

---

## Build & deploy

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server at http://localhost:3000 |
| `npm run discover` | Rebuild the content index after adding/removing content or PDFs |
| `npm run build` | Production build (every route prerendered) |
| `npm run export` | Emit a standalone static `out/` folder (no Node server) |

**Static export:** `npm run export` sets `EXPORT=1`, which turns on `output: 'export'` in
`next.config.mjs` and writes `out/` (HTML/JS/CSS + the copied PDFs/images). Serve the folder with any
static server (`npx serve out`, or `cd out && python -m http.server`, or host it on Netlify / GitHub
Pages). Do **not** double‑click `out/index.html` via a `file://` URL — assets are referenced at absolute
paths like `/_next/…` that only resolve when the folder is served at a web root, so styling won't load.

A service worker (`public/sw.js`, registered in production only) provides offline support, and Google
Analytics (`REDACTED`) is wired in `src/app/layout.tsx`.

---

## Current content scope

Only **OCD (3rd year → Semester 2 → Oral Cavity in Disease)** has lectures (1–4, 9, 11–20) and tests.
Every other subject is PDF‑only. To add the missing OCD lectures (5–8, 10) or any other subject's
content, follow [`how-to-add-contents.md`](./how-to-add-contents.md).
