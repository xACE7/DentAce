# DentAce — a simple guide (no tech background needed)

This explains, in plain language, **what each folder is for** and **where to look when you want to
change something**. You don't need to understand the code — just know which folder holds what.

To open the site on your computer, someone runs `npm run dev` and visits **http://localhost:3000**.

---

## "I want to change… → look here"

| If you want to change… | Go to this folder/file | What's inside |
|---|---|---|
| The **words/content** of a lecture or test | `public/content/` | One small text file per lecture and per test — plain text in English **and** Arabic. |
| The **PDFs and pictures** students see | `public/3rd-year/` | The PDF files and lecture images, organised by year → semester → subject. |
| The **colours / look & feel** (the "Paper" chalk look and the sleek "Default" look) | `src/styles/` | All the styling. `themes.css` is where extra colour themes get added. |
| The **subject list, names, emojis, Arabic names, and the duas** | `src/lib/site-config.ts` | One file describing the years, semesters and subjects. |
| The **app/site icon and install info** | `public/` | `icon.svg`, `favicon.png`, and `manifest.webmanifest` (the "install as an app" details). |

Everything else (`src/app`, `src/components`, `src/lib`) is the program's "engine" — best left to a
developer.

---

## A tour of the project

```
dentace-next/
├─ public/                ← things the website serves directly to students
│  ├─ content/            ← THE STUDY CONTENT (lectures & tests) as simple text files
│  │   └─ 3rd/s2/ocd/...     example: 3rd year, semester 2, "Oral Cavity in Disease"
│  ├─ 3rd-year/           ← the PDFs and lecture images
│  ├─ icon.svg, favicon.png, manifest.webmanifest   ← app icon & install info
│
├─ src/                   ← the program that turns the content into pages
│  ├─ app/                ← the pages themselves (home, subject lists, a lecture, a test…)
│  ├─ components/         ← reusable pieces (the top bar, the lecture viewer, the quiz)
│  ├─ lib/                ← shared logic: progress tracking, settings, the subject list
│  └─ styles/             ← all the colours, fonts and the "Paper / Default" looks
│
├─ tools/                 ← small helper scripts (e.g. refreshing the content list)
│
├─ how-to-add-contents.md ← step‑by‑step for adding a new lecture/test
├─ migration.md           ← the technical overview of how the project is built
└─ explaination.md        ← this file
```

---

## Where the study material lives (most important)

- A lecture's **text** is one file, e.g. `public/content/3rd/s2/ocd/lecture/2.json`
  ("3rd year → semester 2 → Oral Cavity in Disease → Lecture 2"). It contains the headings,
  bullet points and captions in **both English and Arabic**.
- A test's questions are one file, e.g. `public/content/3rd/s2/ocd/test/2.json`.
- The matching **PDFs and images** sit under `public/3rd-year/...` in `pdf/` and `img/` folders.

> Today, only the **"Oral Cavity in Disease" (OCD)** subject has lectures and tests. Every other
> subject only has PDFs. So if a subject shows "no lectures", that's normal.

---

## Adding a new lecture (the short version)

1. Create a new text file in the right `public/content/.../lecture/` folder (copy an existing one as a
   template — see `how-to-add-contents.md` for the exact shape).
2. Ask a developer to run `npm run discover` once (this makes the site notice the new file).
3. The new lecture now appears automatically in the menus, search and progress — **no list to edit by hand.**

That "no list to edit" part is the main convenience: the website simply looks at which files exist.

---

## A few words you'll hear

- **Lecture / Test JSON** — a plain text file holding one lecture's or test's content.
- **Design / Theme** — the overall look. "Paper" is the chalkboard style; "Default" is the neon style.
  Users switch it (plus dark/light and English/Arabic) from the ⚙ gear in the top bar.
- **`npm run dev`** — the command a developer runs to open the site locally for editing/preview.
- **`public/`** — the folder of things shown to students as‑is (content, PDFs, images, icons).
- **`src/`** — the folder of code that builds the pages. Usually only a developer touches this.
