"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { findYear, findSem, lectureTokens, glowClass } from "@/lib/content/nav";
import { isDone, lecturePath } from "@/lib/progress";
import { Bi, Emoji } from "@/lib/content/Bi";
import { Dua } from "./Dua";
import { SubjectRing } from "./SubjectRing";
import { NotFoundNote } from "./NotFoundNote";

export function SemesterView({ year: yId, sem: sId }: { year: string; sem: string }) {
  const year = findYear(yId);
  const sem = findSem(year, sId);
  const [counts, setCounts] = useState<Record<string, { done: number; total: number }>>({});

  useEffect(() => {
    if (!year || !sem) return;
    const c: Record<string, { done: number; total: number }> = {};
    for (const sub of sem.subjects) {
      const toks = lectureTokens(year.id, sem.id, sub.id);
      const done = toks.filter((t) => isDone(lecturePath(year.id, sem.id, sub.id, t))).length;
      c[sub.id] = { done, total: toks.length };
    }
    setCounts(c);
  }, [year, sem]);

  if (!year || !sem) return <NotFoundNote msg="Open the semester from DentAce Home." />;

  return (
    <main className="container" id="dmain">
      <section className="section">
        <Dua />
      </section>
      <section className="section">
        <div className="section-head bar">
          <h2>
            <Bi v={{ en: sem.name, ar: sem.nameAr }} />
          </h2>
        </div>
        <div className="board list-board" id="board">
          {sem.subjects.map((sub) => {
            const c = counts[sub.id] || { done: 0, total: 0 };
            return (
              <Link
                key={sub.id}
                className={`card subj-card ${glowClass(sub.color)}`}
                href={`/subject/${year.id}/${sem.id}/${sub.id}`}
              >
                <SubjectRing done={c.done} total={c.total} />
                <div className="ctitle">
                  <Emoji e={sub.emoji} />
                  <Bi v={{ en: sub.name, ar: sub.nameAr }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="section">
        <Dua />
      </section>
    </main>
  );
}
