/* Server-only content loader: reads JSON content from public/content via the filesystem.
   Works in dev and at build/export time (used by generateStaticParams). This IS the
   disk-discovery model — no manifest of counts. */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Unit, Quiz, Kind } from "./types";
import { CONTENT_ALIAS, aliasContent } from "./alias";

const ROOT = path.join(process.cwd(), "public", "content");

async function readJSON<T>(p: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(p, "utf8")) as T; } catch { return null; }
}

export function loadUnit(year: string, sem: string, sub: string, n: string): Promise<Unit | null> {
  const a = aliasContent(year, sem, sub);
  return readJSON<Unit>(path.join(ROOT, a.year, a.sem, a.sub, "lecture", `${n}.json`));
}
export function loadQuiz(year: string, sem: string, sub: string, n: string): Promise<Quiz | null> {
  const a = aliasContent(year, sem, sub);
  return readJSON<Quiz>(path.join(ROOT, a.year, a.sem, a.sub, "test", `${n}.json`));
}

async function safeReaddir(p: string): Promise<string[]> {
  try { return await fs.readdir(p); } catch { return []; }
}

/** Enumerate {year,sem,sub,n} for every content file of a kind — for generateStaticParams. */
export async function listParams(kind: Kind): Promise<{ year: string; sem: string; sub: string; n: string }[]> {
  const out: { year: string; sem: string; sub: string; n: string }[] = [];
  for (const year of await safeReaddir(ROOT))
    for (const sem of await safeReaddir(path.join(ROOT, year)))
      for (const sub of await safeReaddir(path.join(ROOT, year, sem)))
        for (const f of await safeReaddir(path.join(ROOT, year, sem, sub, kind)))
          if (f.endsWith(".json")) out.push({ year, sem, sub, n: f.replace(/\.json$/, "") });
  // mirrored subjects: emit alias routes (e.g. 3rd/s2/preclinical) for each source file
  for (const [alias, src] of Object.entries(CONTENT_ALIAS)) {
    const [ay, asem, asub] = alias.split("/");
    const [sy, ssem, ssub] = src.split("/");
    for (const f of await safeReaddir(path.join(ROOT, sy, ssem, ssub, kind)))
      if (f.endsWith(".json")) out.push({ year: ay, sem: asem, sub: asub, n: f.replace(/\.json$/, "") });
  }
  return out;
}
