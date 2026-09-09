"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { computeStreak, isDone } from "@/lib/progress";
import { lectureIdsForScope } from "@/lib/content/nav";
import { ChalkText } from "@/lib/content/Bi";
import { useAuth } from "@/lib/auth/AuthProvider";

/* 🔥 streak · 📊 progress % — scoped to the member's chosen term (Profile → Year & semester);
   falls back to whole-site progress when no term is set (e.g. signed out). */
export function Stats() {
  const auth = useAuth();
  const scope = auth?.profile?.scope ?? null;
  const [streak, setStreak] = useState(0);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    setStreak(computeStreak());
    const ids = lectureIdsForScope(scope);
    const done = ids.filter((id) => isDone(id)).length;
    setPct(ids.length ? Math.round((done / ids.length) * 100) : 0);
  }, [scope]);
  return (
    <div className="site-stats">
      <Link className="site-stat" href="/dashboard" title="Study streak">
        <ChalkText>{"🔥 "}</ChalkText>
        <b>{streak}</b>
      </Link>
      <Link className="site-stat" href="/dashboard" title={scope ? "Progress — your semester" : "Overall progress"}>
        <ChalkText>{"📊 "}</ChalkText>
        <b>{pct}%</b>
      </Link>
    </div>
  );
}
