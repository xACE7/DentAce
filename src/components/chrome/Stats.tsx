"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { computeStreak, isDone } from "@/lib/progress";
import { allLectureIds } from "@/lib/content/nav";
import { ChalkText } from "@/lib/content/Bi";

/* 🔥 streak · 📊 overall % — same logic as the old site header (client-computed). */
export function Stats() {
  const [streak, setStreak] = useState(0);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    setStreak(computeStreak());
    const ids = allLectureIds();
    const done = ids.filter((id) => isDone(id)).length;
    setPct(ids.length ? Math.round((done / ids.length) * 100) : 0);
  }, []);
  return (
    <div className="site-stats">
      <Link className="site-stat" href="/dashboard" title="Study streak">
        <ChalkText>{"🔥 "}</ChalkText>
        <b>{streak}</b>
      </Link>
      <Link className="site-stat" href="/dashboard" title="Overall progress">
        <ChalkText>{"📊 "}</ChalkText>
        <b>{pct}%</b>
      </Link>
    </div>
  );
}
