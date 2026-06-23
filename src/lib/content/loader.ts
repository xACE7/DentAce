/* Server-only content loader: reads JSON content from public/content via the filesystem.
   Works in dev and at build/export time (used by generateStaticParams). This IS the
   disk-discovery model — no manifest of counts. */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Unit, Quiz, Kind } from "./types";

const ROOT = path.join(process.cwd(), "public", "content");

async function readJSON<T>(p: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(p, "utf8")) as T; } catch { return null; }
}

export function loadUnit(year: string, sem: string, sub: string, n: string): Promise<Unit | null> {
  return readJSON<Unit>(path.join(ROOT, year, sem, sub, "lecture", `${n}.json`));
}
export function loadQuiz(year: string, sem: string, sub: string, n: string): Promise<Quiz | null> {
  return readJSON<Quiz>(path.join(ROOT, year, sem, sub, "test", `${n}.json`));
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
  return out;
}
