/* The unified content model. JSON content files (one per lecture/test) match these
   shapes; one renderer consumes them. Superset of the old `window.UNIT`/`window.QUIZ`.
   Bilingual strings may embed inline markup: [imp][exam][extra][def][mic][b][u][br][r]…[/r]. */

export type Bilingual = { en: string; ar?: string } | string;

export type Fig = { img: string; cap?: Bilingual; alt?: string };

/* ---- interactive blocks ----
   Six active-recall widgets rendered by components/content/Interactive.tsx.
   Each one registers with the sheet's InteractiveProvider and reports completion,
   which drives the per-lecture progress bar. All are optional: a lecture without
   them renders exactly as before. */

/** One labelled point on a hotspot figure. x/y are PERCENTAGES of the image box. */
export type Hot = { x: number; y: number; label: Bilingual; body?: Bilingual };

export type Block =
  | { p: Bilingual }
  | { h3: Bilingual; c?: "exam" | "imp" | "extra" }
  | { ul: Bilingual[] }
  /** `hide` lists column indices rendered blurred until tapped. */
  | { table: { head: Bilingual[]; rows: Bilingual[][]; hide?: number[] } }
  | { note: { label: Bilingual; body: Bilingual } }
  | { saq: { label: Bilingual; body: Bilingual } }
  | { cap: Bilingual }
  | { fig: Fig }
  /** Tap a numbered dot on the figure to name the structure. */
  | { hotspot: { img: string; cap?: Bilingual; alt?: string; pts: Hot[] } }
  /** A single MCQ inside the sheet; tap an option for instant feedback. */
  | { quiz: { q: Bilingual; opts: Bilingual[]; correct: number; explain?: Bilingual } }
  /** `steps` are given in the CORRECT order and shuffled deterministically at render. */
  | { order: { title?: Bilingual; steps: Bilingual[] } }
  /** Tap a term then its match. Pairs are [term, match]. */
  | { match: { title?: Bilingual; pairs: [Bilingual, Bilingual][] } }
  /** Prompt/answer list where each answer is blurred until tapped. */
  | { reveal: { label?: Bilingual; items: { q: Bilingual; a: Bilingual }[] } }
  | { doodle: string } // raw inline SVG decoration inside a row
  | { html: string }; // escape hatch for anything exotic (keeps conversion faithful)

export type Row = { reverse?: boolean; blk?: Block[]; figs?: Fig[] };

export type Accent = "blue" | "green" | "purple" | "orange" | "pink";

export type Sheet = {
  title: Bilingual;
  icon?: string; // raw inline SVG markup (e.g. "<svg …>…</svg>")
  iconColor?: string; // e.g. "var(--exam)"
  accent?: Accent;
  rows?: Row[];
  wrap?: Block[]; // centred summary sheet
  doodle?: boolean; // star doodle on the sheet
};

export type UnitMeta = {
  course?: Bilingual;
  code?: string;
  title: Bilingual;
  subtitle?: Bilingual;
  footer?: Bilingual;
  coverIcon?: string; // raw inline SVG
};

/** A lecture content file. */
export type Unit = { meta: UnitMeta; lecture: Sheet[] };

/* ---- tests ---- */
export type Mcq = { q: string; img?: string; opts: string[]; correct: number; explain?: string };
/* A model answer rendered as structure rather than a wall of prose.
   `table` for compare/contrast questions, `list` for "list the…", `steps` for
   "describe the procedure", `text` for a one-liner. A Saq keeps `a` as the plain
   fallback (also what search and export read); `ans` overrides it when present. */
export type SaqPart =
  | { h?: string; table: { head: string[]; rows: string[][] } }
  | { h?: string; list: string[] }
  | { h?: string; steps: string[] }
  | { text: string };

export type Saq = { q: string; a: string; ans?: SaqPart[]; keys?: string[][] };
export type Quiz = { title: string; src?: string; mcqs: Mcq[]; saqs?: Saq[] };

/* ---- site nav config (structural metadata; not per-content counts) ---- */
export type Practical = { lecture?: number[]; pdf?: number[] } | number[] | null;

export type Subject = {
  id: string;
  slug: string | null;
  name: string;
  nameAr: string;
  emoji: string | null;
  color: string;
  base: string | null;
  practical: Practical;
};

export type Semester = {
  id: string;
  name: string;
  nameAr: string;
  folder: string | null;
  subjects: Subject[];
};

export type Year = {
  id: string;
  name: string;
  nameAr: string;
  header: string | null;
  folder: string | null;
  semesters: Semester[];
};

export type SiteConfig = {
  brand: string;
  buttons: string;
  duas: string[];
  years: Year[];
};

export type Kind = "lecture" | "pdf" | "test" | "extra";
