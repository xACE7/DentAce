/* The single home for every localStorage concern (done · scores · streak · recent ·
   plan · saq drafts), shared by dashboard, plan, list, subject, lecture nav and quiz.
   SSR-safe (all reads guarded). Replaces the triple duplication across the old engines. */

const ok = () => typeof window !== "undefined";
function get(key: string): string | null { try { return ok() ? localStorage.getItem(key) : null; } catch { return null; } }
function setRaw(key: string, val: string) { try { if (ok()) localStorage.setItem(key, val); } catch { /* ignore */ } }
function del(key: string) { try { if (ok()) localStorage.removeItem(key); } catch { /* ignore */ } }
function getJSON<T>(key: string, fallback: T): T { const v = get(key); if (!v) return fallback; try { return JSON.parse(v) as T; } catch { return fallback; } }

/* ---- logical content ids (also used as URL paths) ---- */
export const lecturePath = (y: string, s: string, sub: string, n: string | number) => `/lecture/${y}/${s}/${sub}/${n}`;
export const testPath = (y: string, s: string, sub: string, n: string | number) => `/test/${y}/${s}/${sub}/${n}`;

/* ---- done (lectures) ---- */
const doneKey = (id: string) => "dentace-done:" + id;
export function isDone(id: string): boolean { return get(doneKey(id)) === "1"; }
export function setDone(id: string, v: boolean) { if (v) setRaw(doneKey(id), "1"); else del(doneKey(id)); }

/* ---- test scores ---- */
export type Score = { s: number; max: number };
const scoreKey = (id: string) => "dentace-score:" + id;
export function getScore(id: string): Score | null { return getJSON<Score | null>(scoreKey(id), null); }
export function setScore(id: string, sc: Score) { setRaw(scoreKey(id), JSON.stringify(sc)); }

/* ---- streak (study days) ---- */
const dayKey = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export function markToday() {
  const days = getJSON<Record<string, number>>("dentace-days", {});
  days[dayKey(new Date())] = 1;
  setRaw("dentace-days", JSON.stringify(days));
}
export function computeStreak(): number {
  const days = getJSON<Record<string, number>>("dentace-days", {});
  let s = 0;
  const d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

/* ---- recent / last (Continue) ---- */
export type Recent = { h: string; t: string; k: string; ts: number };
export function pushRecent(r: Omit<Recent, "ts">) {
  let rec = getJSON<Recent[]>("dentace-recent", []);
  rec = rec.filter((x) => x && x.h !== r.h);
  rec.unshift({ ...r, ts: Date.now() });
  setRaw("dentace-recent", JSON.stringify(rec.slice(0, 12)));
  setRaw("dentace-last", JSON.stringify({ h: r.h, t: r.t }));
}
export function getRecent(): Recent[] { return getJSON<Recent[]>("dentace-recent", []); }

/* ---- study plan ---- */
export type PlanRow = { sem: string; sub: string; lectures: string[] | null; date: string };
export function getPlan(): PlanRow[] { return getJSON<PlanRow[]>("dentace-plan", []); }
export function setPlan(p: PlanRow[]) { setRaw("dentace-plan", JSON.stringify(p)); }

/* ---- SAQ drafts ---- */
const saqKey = (testId: string, i: number) => `dentace-saq:${testId}#${i}`;
export function getSaqDraft(testId: string, i: number): string { return get(saqKey(testId, i)) || ""; }
export function setSaqDraft(testId: string, i: number, v: string) { setRaw(saqKey(testId, i), v); }
export function clearSaqDraft(testId: string, i: number) { del(saqKey(testId, i)); }

/* ---- celebrate-once (100% confetti) ---- */
export function celebratedOnce(key: string): boolean {
  const k = "dentace-celebrated:" + key;
  if (get(k) === "1") return true;
  setRaw(k, "1");
  return false;
}
