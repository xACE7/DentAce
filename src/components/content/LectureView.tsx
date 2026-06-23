"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LectureRenderer } from "./LectureRenderer";
import { findYear, findSem, findSubject, lectureTokens } from "@/lib/content/nav";
import { isDone, setDone, markToday, pushRecent, lecturePath } from "@/lib/progress";
import type { Unit } from "@/lib/content/types";

export function LectureView({ unit, year, sem, sub, n }: { unit: Unit; year: string; sem: string; sub: string; n: string }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const id = lecturePath(year, sem, sub, n);
  const [done, setDoneState] = useState(false);

  // ordered neighbours (skip gaps)
  const toks = lectureTokens(year, sem, sub).map(String);
  const idx = toks.indexOf(String(n));
  const prevTok = idx > 0 ? toks[idx - 1] : null;
  const nextTok = idx >= 0 && idx < toks.length - 1 ? toks[idx + 1] : null;
  const prevHref = prevTok ? `/lecture/${year}/${sem}/${sub}/${prevTok}` : null;
  const nextHref = nextTok ? `/lecture/${year}/${sem}/${sub}/${nextTok}` : null;

  // body.lecture (RTL) + initial done + record activity
  useEffect(() => {
    document.body.classList.add("lecture");
    setDoneState(isDone(id));
    const subj = findSubject(findSem(findYear(year), sem), sub);
    pushRecent({ h: id, t: `${subj?.name ?? sub} · Lecture ${n}`, k: "lecture" });
    markToday();
    return () => { document.body.classList.remove("lecture"); };
  }, [id, year, sem, sub, n]);

  // active-recall: tap to reveal
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const recalls = Array.from(host.querySelectorAll<HTMLElement>(".recall"));
    const onClick = (e: Event) => (e.currentTarget as HTMLElement).classList.toggle("show");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.currentTarget as HTMLElement).classList.toggle("show"); }
    };
    recalls.forEach((r) => {
      r.setAttribute("tabindex", "0");
      r.setAttribute("role", "button");
      r.setAttribute("aria-label", "reveal answer");
      r.addEventListener("click", onClick);
      r.addEventListener("keydown", onKey as EventListener);
    });
    return () => recalls.forEach((r) => { r.removeEventListener("click", onClick); r.removeEventListener("keydown", onKey as EventListener); });
  });

  // reveal-on-scroll
  useEffect(() => {
    document.body.classList.add("js");
    const sheets = root.current?.querySelectorAll<HTMLElement>(".sheet");
    if (!sheets) return;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
        { threshold: 0.08 }
      );
      sheets.forEach((s) => io.observe(s));
      return () => io.disconnect();
    }
    sheets.forEach((s) => s.classList.add("in"));
  });

  // keyboard: ←/[/J prev · →/]/K next · D done
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
      const t = ev.target as HTMLElement | null;
      const tn = t?.tagName;
      if (tn === "INPUT" || tn === "TEXTAREA" || t?.isContentEditable) return;
      const k = ev.key;
      if (k === "ArrowLeft" || k === "[" || k === "j" || k === "J") { if (prevHref) { ev.preventDefault(); router.push(prevHref); } }
      else if (k === "ArrowRight" || k === "]" || k === "k" || k === "K") { if (nextHref) { ev.preventDefault(); router.push(nextHref); } }
      else if (k === "d" || k === "D") { ev.preventDefault(); toggleDone(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const toggleDone = () => { const nv = !isDone(id); setDone(id, nv); setDoneState(nv); };

  return (
    <div ref={root}>
      <LectureRenderer unit={unit} />
      <nav className="study-nav">
        {prevHref ? <Link className="study-pg" href={prevHref}>← Prev</Link> : <span className="study-pg off">← Prev</span>}
        <button className={"study-done" + (done ? " on" : "")} type="button" onClick={toggleDone}>
          {done ? "✓ Done" : "Mark done"}
        </button>
        {nextHref ? <Link className="study-pg" href={nextHref}>Next →</Link> : <span className="study-pg off">Next →</span>}
      </nav>
    </div>
  );
}
