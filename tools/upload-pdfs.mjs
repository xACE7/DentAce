/* Upload every PDF under public/ (each file inside a .../pdf/ folder) into the
 * private Supabase 'pdfs' bucket, keyed by its path relative to public/
 * (e.g. 3rd-year/3rd-s1/ocih/pdf/ocih-1.pdf) — exactly what the app asks for
 * when it creates a signed URL.
 *
 * Run once, from the repo root, with your SERVICE ROLE key (NOT the anon key):
 *
 *   # PowerShell
 *   $env:SUPABASE_URL="https://<ref>.supabase.co"; $env:SUPABASE_SERVICE_KEY="<service_role key>"; node tools/upload-pdfs.mjs
 *
 *   # Git Bash
 *   SUPABASE_URL="https://<ref>.supabase.co" SUPABASE_SERVICE_KEY="<service_role key>" node tools/upload-pdfs.mjs
 *
 * Find both at: Supabase Dashboard → Project Settings → API
 *   URL = "Project URL"; SERVICE key = "service_role" secret (keep it private!).
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = "pdfs";

if (!URL || !KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY (service_role) in the environment first.");
  process.exit(1);
}
const supa = createClient(URL, KEY, { auth: { persistSession: false } });

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.toLowerCase().endsWith(".pdf")) yield p;
  }
}

let ok = 0, fail = 0;
for await (const file of walk("public")) {
  // only files that live under a /pdf/ folder
  const rel = relative("public", file).split(sep).join("/");
  if (!rel.includes("/pdf/")) continue;
  const buf = await readFile(file);
  const { error } = await supa.storage.from(BUCKET).upload(rel, buf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) { fail++; console.error(`FAIL  ${rel}  — ${error.message}`); }
  else { ok++; if (ok % 20 === 0) console.log(`…uploaded ${ok}`); }
}
console.log(`\nDone: ${ok} uploaded, ${fail} failed.`);
process.exit(fail ? 1 : 0);
