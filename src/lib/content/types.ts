/* The unified content model. JSON content files (one per lecture/test) match these
   shapes; one renderer consumes them. Superset of the old `window.UNIT`/`window.QUIZ`.
   Bilingual strings may embed inline markup: [imp][exam][extra][def][mic][b][u][br][r]…[/r]. */

export type Bilingual = { en: string; ar?: string } | string;

export type Fig = { img: string; cap?: Bilingual; alt?: string };

export type Block =
  | { p: Bilingual }
  | { h3: Bilingual; c?: "exam" | "imp" | "extra" }
  | { ul: Bilingual[] }
  | { table: { head: Bilingual[]; rows: Bilingual[][] } }
  | { note: { label: Bilingual; body: Bilingual } }
  | { saq: { label: Bilingual; body: Bilingual } }
  | { cap: Bilingual }
  | { fig: Fig }
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
export type Saq = { q: string; a: string; keys?: string[][] };
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

export type Kind = "lecture" | "pdf" | "test";
