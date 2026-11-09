"use client";
/* Per-lecture interaction tracking.

   Every interactive block (hotspot · quiz · order · match · reveal · hidden table)
   registers itself on mount and reports when the student has actually worked it —
   revealed every hotspot, answered the MCQ, put the steps in order, matched all the
   pairs, revealed every blurred item. The provider counts those and drives the
   progress bar at the foot of the lecture.

   Completion is persisted per lecture in localStorage so it survives a reload, and
   is read in an effect (never during render) to keep the static export hydrating
   cleanly. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const KEY = (id: string) => "dentace-ix:" + id;

type Ctx = {
  complete: (id: string) => void;
  isComplete: (id: string) => boolean;
  total: number;
  done: number;
};

const InteractiveCtx = createContext<Ctx | null>(null);

export function InteractiveProvider(
  { lectureId, total, children }: { lectureId: string; total: number; children: React.ReactNode }
) {
  const [doneSet, setDoneSet] = useState<Set<string>>(() => new Set());
  const loaded = useRef(false);

  // hydrate persisted completion once, after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(lectureId));
      if (raw) setDoneSet(new Set(JSON.parse(raw) as string[]));
    } catch { /* private mode / blocked storage — start empty */ }
    loaded.current = true;
  }, [lectureId]);

  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(KEY(lectureId), JSON.stringify([...doneSet])); } catch { /* ignore */ }
  }, [doneSet, lectureId]);

  const complete = useCallback((id: string) => {
    setDoneSet((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const isComplete = useCallback((id: string) => doneSet.has(id), [doneSet]);

  // `total` is counted from the unit itself (see countInteractive), so the bar is
  // correct on the very first paint instead of popping in after effects run.
  const done = Math.min(doneSet.size, total);

  const value = useMemo<Ctx>(
    () => ({ complete, isComplete, total, done }),
    [complete, isComplete, total, done]
  );

  return <InteractiveCtx.Provider value={value}>{children}</InteractiveCtx.Provider>;
}

/** Gives one interactive block its `done` flag plus a `finish()` callback. */
export function useInteractive(id: string) {
  const ctx = useContext(InteractiveCtx);
  const done = ctx ? ctx.isComplete(id) : false;
  const finish = useCallback(() => ctx?.complete(id), [ctx, id]);
  return { done, finish };
}

/** Totals for the progress bar. Returns zeros when no provider is mounted. */
export function useInteractiveProgress() {
  const ctx = useContext(InteractiveCtx);
  const total = ctx?.total ?? 0;
  const done = ctx?.done ?? 0;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

/* ---- deterministic shuffle ----
   `order` and `match` must look shuffled but produce the SAME arrangement on the
   server and on the client, or static-export hydration mismatches. A tiny seeded
   PRNG keyed off the content does that: same content, same shuffle, every time. */
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function seededOrder(n: number, seed: string): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  let s = seedOf(seed) || 1;
  for (let i = n - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  // never hand back the identity permutation for a solvable puzzle
  if (n > 1 && idx.every((v, i) => v === i)) [idx[0], idx[1]] = [idx[1], idx[0]];
  return idx;
}

/* ---- counting ----
   Walks a lecture unit and counts the blocks that carry an interaction, so the
   provider knows the denominator without every widget having to announce itself. */
export function countInteractive(unit: { lecture: Array<Record<string, unknown>> }): number {
  let n = 0;
  const isIx = (b: Record<string, unknown>) =>
    "hotspot" in b || "quiz" in b || "order" in b || "match" in b || "reveal" in b ||
    ("table" in b && Array.isArray((b.table as { hide?: unknown[] })?.hide) && ((b.table as { hide: unknown[] }).hide.length > 0));
  for (const sh of unit.lecture || []) {
    for (const r of (sh.rows as Array<{ blk?: Record<string, unknown>[] }>) || [])
      for (const b of r.blk || []) if (isIx(b)) n++;
    for (const b of (sh.wrap as Record<string, unknown>[]) || []) if (isIx(b)) n++;
  }
  return n;
}
