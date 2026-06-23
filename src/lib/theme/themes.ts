/* The theme/design registry — the single place to add or edit a skin.
   To add a DESIGN: add an entry here + a `[data-design="id"]` token block in
   src/styles/designs/<id>.css (and import it). It auto-appears in the ⚙ panel.
   To add a color THEME: add an entry + a `[data-theme="id"]` block in
   src/styles/themes.css. Paper/Default/ace are kept byte-identical to the old site. */

export type ModeId = "dark" | "light";
export type DesignId = "default" | "paper";
export type ThemeId =
  | "ace" | "forest" | "royal" | "mono" | "daylight" | "pearl" | "sakura" | "mint";

export type Option<Id extends string> = { id: Id; en: string; ar: string };

export const MODES: Option<ModeId>[] = [
  { id: "dark", en: "🌙 Dark", ar: "🌙 داكن" },
  { id: "light", en: "☀ Light", ar: "☀ فاتح" },
];

export const DESIGNS: Option<DesignId>[] = [
  { id: "default", en: "Default", ar: "افتراضي" },
  { id: "paper", en: "Paper", ar: "ورقي" },
];

/* Color accents (override --title-a/--title-b/--glow-main/--hl + lecture --c-*).
   `ace` is the bare-:root default; the other 7 live in src/styles/themes.css.
   Not surfaced in the panel today (matches the old site) but fully wired. */
export const THEMES: Option<ThemeId>[] = [
  { id: "ace", en: "ACE", ar: "ايس" },
  { id: "forest", en: "Forest", ar: "غابة" },
  { id: "royal", en: "Royal", ar: "ملكي" },
  { id: "mono", en: "Mono", ar: "أحادي" },
  { id: "daylight", en: "Blue", ar: "أزرق" },
  { id: "pearl", en: "Purple", ar: "بنفسجي" },
  { id: "sakura", en: "Pink", ar: "وردي" },
  { id: "mint", en: "Teal", ar: "تركواز" },
];

export const DEFAULTS = { mode: "dark" as ModeId, design: "paper" as DesignId, theme: "ace" as ThemeId, lang: "en" as "en" | "ar" };

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
  return v && VALID_DESIGNS.has(v as DesignId) ? (v as DesignId) : "paper";
}
export function normMode(v: string | null): ModeId {
  return v === "light" ? "light" : "dark";
}
export function normLang(v: string | null): "en" | "ar" {
  return v === "ar" ? "ar" : "en";
}
