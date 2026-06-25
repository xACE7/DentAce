/* The theme/design registry — the single place to add or edit a skin.
   To add a DESIGN: add an entry here + a `[data-design="id"]` token block in
   src/styles/designs/<id>.css (and import it). It auto-appears in the ⚙ panel.
   To add a color THEME: add an entry + a `[data-theme="id"]` block in
   src/styles/themes.css. Paper/Default/ace are kept byte-identical to the old site. */

export type ModeId = "dark" | "light";
export type DesignId = "default" | "paper";
export type ThemeId =
  | "ace" | "azure" | "blush" | "sky" | "lagoon" | "candy" | "sunset" | "grape" | "citrus" | "ember";

export type Option<Id extends string> = { id: Id; en: string; ar: string };

export const MODES: Option<ModeId>[] = [
  { id: "dark", en: "🌙 Dark", ar: "🌙 داكن" },
  { id: "light", en: "☀ Light", ar: "☀ فاتح" },
];

export const DESIGNS: Option<DesignId>[] = [
  { id: "default", en: "Neon", ar: "نيون" },
  { id: "paper", en: "Paper", ar: "ورقي" },
];

/* Color accents (override --title-a/--title-b/--glow-main/--hl + lecture --c-*).
   `ace` is the bare-:root default; the other 7 live in src/styles/themes.css.
   Not surfaced in the panel today (matches the old site) but fully wired. */
/* Each color theme is a 2-colour combo (a → b) that re-tints the site accents.
   a/b are the swatch colours shown in the ⚙ panel (== --title-a/--title-b). */
export type ThemeOption = Option<ThemeId> & { a: string; b: string };
export const THEMES: ThemeOption[] = [
  { id: "ace",    en: "Default", ar: "افتراضي", a: "#ff2bd6", b: "#16f2ff" },
  { id: "azure",  en: "Azure",   ar: "أزرق",    a: "#38bdf8", b: "#7dd3fc" },
  { id: "blush",  en: "Blush",   ar: "زهري",    a: "#f9a8d4", b: "#fbcfe8" },
  { id: "sky",    en: "Sky",     ar: "سماوي",   a: "#38bdf8", b: "#f9a8d4" },
  { id: "lagoon", en: "Lagoon",  ar: "بحيرة",   a: "#2dd4bf", b: "#818cf8" },
  { id: "candy",  en: "Candy",   ar: "حلوى",    a: "#f472b6", b: "#93c5fd" },
  { id: "sunset", en: "Sunset",  ar: "غروب",    a: "#fb923c", b: "#f472b6" },
  { id: "grape",  en: "Grape",   ar: "عنب",     a: "#a78bfa", b: "#22d3ee" },
  { id: "citrus", en: "Citrus",  ar: "حمضي",    a: "#a3e635", b: "#fbbf24" },
  { id: "ember",  en: "Ember",   ar: "جمر",     a: "#fb7185", b: "#fcd34d" },
];

export const DEFAULTS = { mode: "dark" as ModeId, design: "default" as DesignId, theme: "ace" as ThemeId, lang: "en" as "en" | "ar" };

const set = <T extends string>(arr: Option<T>[]) => new Set(arr.map((o) => o.id));
const VALID_THEMES = set(THEMES);
const VALID_DESIGNS = set(DESIGNS);

export const STORAGE = {
  theme: "dentace-theme",
  mode: "dentace-mode",
  design: "dentace-design",
  lang: "dentace-lang",
  readScale: "dentace-read-scale",
} as const;

export function normTheme(v: string | null): ThemeId {
  return v && VALID_THEMES.has(v as ThemeId) ? (v as ThemeId) : "ace";
}
export function normDesign(v: string | null): DesignId {
  if (v === "chalk") return "paper";
  return v && VALID_DESIGNS.has(v as DesignId) ? (v as DesignId) : "default";
}
export function normMode(v: string | null): ModeId {
  return v === "light" ? "light" : "dark";
}
export function normLang(v: string | null): "en" | "ar" {
  return v === "ar" ? "ar" : "en";
}
