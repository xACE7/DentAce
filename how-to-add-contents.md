# How to add content (lectures, tests, PDFs)

Content lives as plain **JSON** files under `public/content/`. There is **no list/manifest to edit** —
the site discovers what exists on disk. Adding content is: create a file → run one command → done.

```
public/content/<year>/<sem>/<sub>/lecture/<N>.json   ← a lecture
public/content/<year>/<sem>/<sub>/test/<N>.json      ← a test
```
`<year>`, `<sem>`, `<sub>` are the ids from `src/lib/site-config.ts` (e.g. `3rd`, `s2`, `ocd`).
`<N>` is the lecture/test number (the URL becomes `/lecture/3rd/s2/ocd/<N>`).

After adding/removing any file, run:

```bash
npm run discover     # rebuilds src/lib/content/contentIndex.ts from disk
npm run dev          # (if not already running) → http://localhost:3000
```

> Tip: copy an existing file (e.g. `public/content/3rd/s2/ocd/lecture/2.json`) as your template.

---

## 1. Add a lecture

Create `public/content/<year>/<sem>/<sub>/lecture/<N>.json`:

```jsonc
{
  "meta": {
    "course":   { "en": "Oral Cavity in Disease", "ar": "أمراض تجويف الفم" },
    "code":     "OCD 21",
    "title":    { "en": "TOPIC[br]TITLE", "ar": "عنوان[br]الموضوع" },   // [br] = line break on the cover
    "subtitle": { "en": "a short subtitle", "ar": "عنوان فرعي قصير" },
    "footer":   { "en": "footer line", "ar": "سطر التذييل" },
    "coverIcon": "<svg viewBox=\"0 0 28 28\">…</svg>"                   // optional cover icon
  },
  "lecture": [
    {
      "title": { "en": "Section title", "ar": "عنوان القسم" },
      "icon":  "<svg viewBox=\"0 0 28 28\">…</svg>",                    // optional
      "accent": "blue",                                                 // blue|green|purple|orange|pink (auto-cycles if omitted)
      "rows": [
        {
          "blk": [
            { "p":  { "en": "A paragraph with [imp]emphasis[/imp].", "ar": "فقرة مع [imp]تمييز[/imp]." } },
            { "h3": { "en": "A sub-heading", "ar": "عنوان فرعي" }, "c": "exam" },   // c: exam|imp|extra (optional tint)
            { "ul": [ { "en": "bullet one", "ar": "نقطة" }, { "en": "bullet two", "ar": "نقطة" } ] },
            { "table": {
                "head": [ { "en": "Col A", "ar": "عمود أ" }, { "en": "Col B", "ar": "عمود ب" } ],
                "rows": [ [ { "en": "a1", "ar": "أ1" }, { "en": "b1", "ar": "ب1" } ] ] } },
            { "note": { "label": { "en": "note", "ar": "ملاحظة" }, "body": { "en": "…", "ar": "…" } } },
            { "saq":  { "label": { "en": "recall", "ar": "تذكّر" }, "body": { "en": "Q = [r]hidden answer[/r]", "ar": "س = [r]إجابة مخفية[/r]" } } }
          ],
          "figs": [
            { "img": "/3rd-year/3rd-s2/ocd/img/ocd-21-img/ocd-21-x.jpg",
              "cap": { "en": "[b]Caption[/b] — detail", "ar": "[b]تعليق[/b] — تفصيل" } }
          ]
        },
        { "reverse": true, "blk": [ … ], "figs": [ … ] }                 // reverse = image on the other side
      ]
    },
    {
      "title": { "en": "Summary", "ar": "الملخّص" },
      "doodle": true,                                                    // star doodle on this sheet
      "wrap": [ { "h3": { "en": "in 5 lines", "ar": "في 5 أسطر" }, "c": "extra" }, { "ul": [ … ] } ]
    }
  ]
}
```

**Inline markup** (use inside any `en`/`ar` string — keeps content as raw text, not HTML):
`[imp]…[/imp]` important · `[exam]…[/exam]` exam focus · `[extra]…[/extra]` · `[def]…[/def]` definition ·
`[mic]…[/mic]` term · `[b]…[/b]` bold · `[u]…[/u]` underline · `[br]` line break ·
`[r]…[/r]` tap-to-reveal (active recall).

**Sheet shapes:** a normal sheet has `rows` (each row = `blk` blocks and/or `figs` figures); a summary
sheet uses `wrap` (centred blocks) instead. Need something unusual? use `{ "html": "<…>" }` as an
escape hatch (rendered as-is).

---

## 2. Add a test

Create `public/content/<year>/<sem>/<sub>/test/<N>.json`:

```jsonc
{
  "title": "OCD 21 — Test",
  "src":   "short topic line",
  "mcqs": [
    { "q": "Question text?",
      "img": "/3rd-year/3rd-s2/ocd/img/ocd-21-img/ocd-21-q1.jpg",   // optional image
      "opts": ["A", "B", "C", "D"],                      // 2+ options (True/False = 2)
      "correct": 0,                                       // index of the right option
      "explain": "Why it's correct." }
  ],
  "saqs": [
    { "q": "Short-answer question?", "a": "Model answer (may contain <b>HTML</b>)." }
  ]
}
```

Casual mode checks each MCQ on tap; exam mode (set minutes → Start) runs timed, one question at a time,
then reveals everything wrong-first and saves the score.

---

## 3. PDFs and images

- Put PDFs at `public/<base>/pdf/` and images at `public/<base>/img/`, where `<base>` is the subject's
  folder (e.g. `3rd-year/3rd-s2/ocd`). **Images are grouped one folder per lecture**:
  `public/<base>/img/<sub>-<N>-img/` (e.g. `…/ocd/img/ocd-21-img/`). A lecture's figures **and** its
  test's images both live in that lecture's folder. Reference them in JSON by their absolute public path
  (`/3rd-year/3rd-s2/ocd/img/ocd-21-img/ocd-21-x.jpg`).
- PDFs are listed automatically — `npm run discover` reads the filenames. A file like `ocd-21.pdf`
  shows as "PDF 21"; irregular names like `rad-1-2.pdf` show as "PDF 1-2".
- To pull text/images out of a source PDF while authoring, the helper scripts in `tools/pdf/`
  (`extract-pdf.py`, `extract-pdf-images.py`, need Python + `pypdf`/`Pillow`) can help.

---

## 4. Add a whole new subject

1. Add the subject (id, name, `nameAr`, `emoji`, `color`, optional `slug`/`practical`) to the right
   semester in `src/lib/site-config.ts`.
2. Add its PDFs/images under `public/<base>/{pdf,img}/` and/or content JSON under `public/content/…`.
3. Run `npm run discover`.

(If a lecture should show a topic subtitle on list/search pages, add an entry to `src/lib/titles.ts`
keyed by `"<base>|<N>"`, e.g. `"3rd-year/3rd-s2/ocd|21": { "e": "English topic", "a": "الموضوع" }`.)

---

## 5. Publish

- Local preview: `npm run dev`.
- Static site: `npm run export` → serve the `out/` folder (`npx serve out`, or host on Netlify /
  GitHub Pages). See `migration.md` for details.
