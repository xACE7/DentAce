"use client";
/* Member activity log: records what each signed-in member opens, for how long, and
   (for tests) the mark. Rows go to public.activity (admin-readable). Best-effort —
   silently no-ops when Supabase isn't configured, the user is a guest, or the table
   is missing, so the study experience never depends on it. */
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type LogOpts = {
  userId?: string | null;
  kind: "lecture" | "test";
  ref: string;          // "year/sem/sub/token", e.g. "3rd/s1/preclinical/5"
  title: string;
  seconds: number;
  score?: number | null;
  max?: number | null;
};

export async function logActivity(o: LogOpts): Promise<void> {
  if (!supabase || !o.userId || o.seconds < 2) return; // ignore guests + <2s blips
  try {
    await supabase.from("activity").insert({
      user_id: o.userId, kind: o.kind, ref: o.ref, title: (o.title || "").slice(0, 200),
      seconds: Math.round(o.seconds), score: o.score ?? null, max: o.max ?? null,
    });
  } catch { /* offline / table not set up — ignore */ }
}

/** Log one 'lecture' row with time-spent when the user leaves the lecture page. */
export function useLectureActivity(userId: string | null | undefined, ref: string, title: string) {
  const start = useRef(Date.now());
  useEffect(() => {
    start.current = Date.now();
    return () => { void logActivity({ userId, kind: "lecture", ref, title, seconds: (Date.now() - start.current) / 1000 }); };
  }, [userId, ref, title]);
}
