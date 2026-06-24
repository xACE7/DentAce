/* Cloud sync for progress: snapshots the `dentace-*` progress keys, merges the
   device's copy with the cloud copy (type-aware, so cross-device edits don't clobber
   each other), and pushes/pulls a single JSONB row per user in Supabase. UI prefs
   (theme/mode/design/lang/read-scale) are intentionally NOT synced. */
import { supabase } from "@/lib/supabase";

type Snap = Record<string, string>;
const ok = () => typeof window !== "undefined";

/** Only true progress keys sync — not theme/UI preferences. */
function isProgressKey(k: string): boolean {
  return (
    k.startsWith("dentace-done:") ||
    k.startsWith("dentace-score:") ||
    k.startsWith("dentace-saq:") ||
    k.startsWith("dentace-celebrated:") ||
    k === "dentace-days" ||
    k === "dentace-recent" ||
    k === "dentace-last" ||
    k === "dentace-plan"
  );
}

export function snapshot(): Snap {
  const out: Snap = {};
  if (!ok()) return out;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && isProgressKey(k)) { const v = localStorage.getItem(k); if (v != null) out[k] = v; }
  }
  return out;
}

function applySnap(snap: Snap) {
  if (!ok()) return;
  Object.entries(snap).forEach(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } });
  try { window.dispatchEvent(new Event("dentace-progress")); } catch { /* ignore */ } // refresh views (no push echo)
}

/* ---- type-aware merge helpers ---- */
function bestScore(a: string, b: string): string {
  try {
    const pa = JSON.parse(a), pb = JSON.parse(b);
    const ra = pa.max ? pa.s / pa.max : 0, rb = pb.max ? pb.s / pb.max : 0;
    return rb > ra ? b : a;
  } catch { return a; }
}
function mergeDays(a: string, b: string): string {
  try { return JSON.stringify({ ...JSON.parse(b), ...JSON.parse(a) }); } catch { return a; }
}
function mergeRecent(a: string, b: string): string {
  try {
    const arr = [...JSON.parse(a), ...JSON.parse(b)] as { h: string; ts: number }[];
    const by = new Map<string, { h: string; ts: number }>();
    arr.forEach((r) => { if (r && r.h) { const e = by.get(r.h); if (!e || (r.ts || 0) > (e.ts || 0)) by.set(r.h, r); } });
    return JSON.stringify([...by.values()].sort((x, y) => (y.ts || 0) - (x.ts || 0)).slice(0, 12));
  } catch { return a; }
}
function nonEmptyArr(s: string): boolean { try { return Array.isArray(JSON.parse(s)) && JSON.parse(s).length > 0; } catch { return false; } }

export function mergeSnaps(local: Snap, cloud: Snap): Snap {
  const out: Snap = {};
  const keys = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  keys.forEach((k) => {
    const a = local[k], b = cloud[k];
    if (a === undefined) { out[k] = b; return; }
    if (b === undefined || a === b) { out[k] = a; return; }
    if (k.startsWith("dentace-done:") || k.startsWith("dentace-celebrated:")) out[k] = a === "1" || b === "1" ? "1" : a;
    else if (k.startsWith("dentace-score:")) out[k] = bestScore(a, b);
    else if (k === "dentace-days") out[k] = mergeDays(a, b);
    else if (k === "dentace-recent") out[k] = mergeRecent(a, b);
    else if (k.startsWith("dentace-saq:")) out[k] = a.length >= b.length ? a : b;
    else if (k === "dentace-plan") out[k] = nonEmptyArr(a) ? a : b;
    else out[k] = a; // dentace-last and anything else: keep local
  });
  // keep dentace-last consistent with the merged recents
  if (out["dentace-recent"]) {
    try { const r = JSON.parse(out["dentace-recent"]); if (r[0]) out["dentace-last"] = JSON.stringify({ h: r[0].h, t: r[0].t }); } catch { /* ignore */ }
  }
  return out;
}

/* ---- push / pull ---- */
export async function pushCloud(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("progress").upsert({ user_id: userId, data: snapshot(), updated_at: new Date().toISOString() });
  } catch { /* offline / transient — will retry on next change */ }
}

export async function pullCloud(userId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.from("progress").select("data").eq("user_id", userId).maybeSingle();
    if (error) return false;
    const cloud = ((data?.data as Snap) || {});
    const merged = mergeSnaps(snapshot(), cloud);
    applySnap(merged);
    await pushCloud(userId); // write the union back so the cloud is up to date
    return true;
  } catch { return false; }
}

/* ---- debounced push ---- */
let timer: ReturnType<typeof setTimeout> | null = null;
export function schedulePush(userId: string) {
  if (!supabase) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void pushCloud(userId); }, 1500);
}
