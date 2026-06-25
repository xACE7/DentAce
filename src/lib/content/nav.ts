/* Navigation helpers built on SITE (structural metadata) + CONTENT_INDEX (disk discovery).
   Mirrors the lookups the old app.js did, but availability comes from discovery. */
import { SITE } from "@/lib/site-config";
import { CONTENT_INDEX, type Token, type PdfItem } from "./contentIndex";
import { aliasContent } from "./alias";
import type { Year, Semester, Subject, Kind, Practical } from "./types";

export function findYear(id: string): Year | undefined { return SITE.years.find((y) => y.id === id); }
export function findSem(year: Year | undefined, id: string): Semester | undefined { return year?.semesters.find((s) => s.id === id); }
export function findSubject(sem: Semester | undefined, id: string): Subject | undefined { return sem?.subjects.find((s) => s.id === id); }

export const subjectKey = (y: string, s: string, sub: string) => `${y}/${s}/${sub}`;

/** Old subjectBase: the on-disk folder for a subject (year-folder/sem-folder/subject-id). */
export function subjectBase(year: Year, sem: Semester, subject: Subject): string {
  if (subject.base) return subject.base.replace(/\/+$/, "");
  const yf = year.folder || year.id + "-year";
  const sf = sem.folder || year.id + "-" + sem.id;
  return `${yf}/${sf}/${subject.id}`;
}

export function content(y: string, s: string, sub: string): { lecture: Token[]; test: Token[]; pdf: PdfItem[] } {
  const a = aliasContent(y, s, sub); // mirror e.g. 3rd/s2/preclinical → 3rd/s1/preclinical
  return CONTENT_INDEX[subjectKey(a.year, a.sem, a.sub)] || { lecture: [], test: [], pdf: [] };
}

export function lectureTokens(y: string, s: string, sub: string): Token[] { return content(y, s, sub).lecture; }
export function testTokens(y: string, s: string, sub: string): Token[] { return content(y, s, sub).test; }
export function pdfItems(y: string, s: string, sub: string): PdfItem[] { return content(y, s, sub).pdf; }

export function tokensForKind(y: string, s: string, sub: string, kind: Kind): Token[] {
  if (kind === "pdf") return pdfItems(y, s, sub).map((p) => p.token);
  return content(y, s, sub)[kind];
}

export function isPractical(practical: Practical, kind: Kind, n: Token): boolean {
  if (!practical) return false;
  const num = typeof n === "number" ? n : parseInt(String(n), 10);
  const arr = Array.isArray(practical) ? (kind === "test" ? [] : practical) : practical[kind === "pdf" ? "pdf" : "lecture"] || [];
  return arr.indexOf(num) !== -1;
}

/** Every lecture id across the whole site (for overall % / dashboard totals). */
export function allLectureIds(): string[] {
  const ids: string[] = [];
  for (const y of SITE.years)
    for (const s of y.semesters)
      for (const sub of s.subjects)
        for (const t of lectureTokens(y.id, s.id, sub.id)) ids.push(`/lecture/${y.id}/${s.id}/${sub.id}/${t}`);
  return ids;
}

export const glowClass = (color?: string | null) => "glow-" + (color || "pink");
