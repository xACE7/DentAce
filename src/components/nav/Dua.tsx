"use client";
import { useEffect, useState } from "react";
import { DUAS } from "@/lib/site-config";

/* A random dua card (picked client-side to avoid SSR randomness/hydration mismatch),
   matching the old `.card.white-glow.wide-2[dir=rtl]` dua panels. */
export function Dua() {
  const [text, setText] = useState("");
  useEffect(() => {
    if (DUAS.length) setText(DUAS[Math.floor(Math.random() * DUAS.length)]);
  }, []);
  return (
    <div className="board">
      <div className="card white-glow wide-2" dir="rtl">
        {text}
      </div>
    </div>
  );
}
