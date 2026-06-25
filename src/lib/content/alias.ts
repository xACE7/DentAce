/* Subjects whose lecture/test content is MIRRORED from another location.
   Key = the alias path the user navigates to; value = the canonical source whose
   JSON files actually exist on disk. This lets the same content appear in two
   places (e.g. Preclinical is taught across both 3rd-year semesters) without
   duplicating the JSON or images. PDFs + titles already follow the subject's
   `base` (set in site-config); this only handles the lecture/test lookup. */
export const CONTENT_ALIAS: Record<string, string> = {
  "3rd/s2/preclinical": "3rd/s1/preclinical",
};

/** Resolve a (year,sem,sub) to its canonical content location (itself if not aliased). */
export function aliasContent(year: string, sem: string, sub: string): { year: string; sem: string; sub: string } {
  const a = CONTENT_ALIAS[`${year}/${sem}/${sub}`];
  if (!a) return { year, sem, sub };
  const [y, s, su] = a.split("/");
  return { year: y, sem: s, sub: su };
}
