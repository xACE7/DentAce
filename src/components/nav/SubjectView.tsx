"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { findYear, findSem, findSubject, lectureTokens, testTokens, glowClass } from "@/lib/content/nav";
import { isDone, getScore, lecturePath, testPath } from "@/lib/progress";
import { useProgressBump } from "@/lib/useProgressBump";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Bi, Emoji } from "@/lib/content/Bi";
import { Dua } from "./Dua";
import { NotFoundNote } from "./NotFoundNote";

export function SubjectView({ year: yId, sem: sId, sub: subId }: { year: string; sem: string; sub: string }) {
  const year = findYear(yId);
  const sem = findSem(year, sId);
  const sub = findSubject(sem, subId);
  const [perf, setPerf] = useState({ ld: 0, lt: 0, lp: 0, tk: 0, tt: 0, ta: 0 });
  const bump = useProgressBump();
  const auth = useAuth();

  useEffect(() => {
    if (!year || !sem || !sub) return;
    const lec = lectureTokens(year.id, sem.id, sub.id);
    const ld = lec.filter((t) => isDone(lecturePath(year.id, sem.id, sub.id, t))).length;
    const lp = lec.length ? Math.round((ld / lec.length) * 100) : 0;
    const tst = testTokens(year.id, sem.id, sub.id);
    let tk = 0, sp = 0;
    tst.forEach((t) => {
      const sc = getScore(testPath(year.id, sem.id, sub.id, t));
      if (sc && sc.max) { tk++; sp += Math.round((sc.s / sc.max) * 100); }
    });
    setPerf({ ld, lt: lec.length, lp, tk, tt: tst.length, ta: tk ? Math.round(sp / tk) : 0 });
  }, [year, sem, sub, bump]);

  if (!year || !sem || !sub) return <NotFoundNote msg="Open the subject from DentAce Home." />;

  const g = glowClass(sub.color);
  const q = `${year.id}/${sem.id}/${sub.id}`;

  return (
    <main className="container" id="dmain">
      <section className="section">
        <Dua />
      </section>
      <section className="section">
        <div className="section-head bar" style={{ ["--bar-glow" as string]: `var(--glow-${sub.color || "pink"})` }}>
          <h2>
            <Emoji e={sub.emoji} />
            <Bi v={{ en: sub.name, ar: sub.nameAr }} />
          </h2>
        </div>
        <div className="board subj-board" id="board">
          <div className="subj-perf">
            <div className="perf-item">
              <div className="perf-lbl"><Emoji e="📘" /><Bi v={{ en: "Lectures", ar: "المحاضرات" }} /></div>
              <div className="perf-bar"><span style={{ width: `${perf.lp}%` }} /></div>
              <div className="perf-num">{perf.ld}/{perf.lt} · {perf.lp}%</div>
            </div>
            <div className="perf-item">
              <div className="perf-lbl"><Emoji e="📝" /><Bi v={{ en: "Tests", ar: "الاختبارات" }} /></div>
              <div className="perf-bar tests"><span style={{ width: `${perf.ta}%` }} /></div>
              <div className="perf-num">
                {perf.tk ? `${perf.tk}/${perf.tt} · ${perf.ta}%` : <Bi v={{ en: "not taken", ar: "لم تُختبر" }} />}
              </div>
            </div>
          </div>
          {auth?.flags.pdfs !== false ? (
            <Link className={`card ${g}`} href={`/list/${q}/pdf`}>
              <div className="ctitle"><Emoji e="📁" /><Bi v={{ en: "PDFs", ar: "ملفات PDF" }} /></div>
            </Link>
          ) : null}
          {auth?.flags.lectures !== false ? (
            <Link className={`card ${g}`} href={`/list/${q}/lecture`}>
              <div className="ctitle"><Emoji e="📘" /><Bi v={{ en: "Lectures", ar: "المحاضرات" }} /></div>
            </Link>
          ) : null}
          {auth?.flags.tests !== false ? (
            <Link className={`card ${g}`} href={`/list/${q}/test`}>
              <div className="ctitle"><Emoji e="📝" /><Bi v={{ en: "Tests", ar: "الاختبارات" }} /></div>
            </Link>
          ) : null}
        </div>
      </section>
      <section className="section">
        <Dua />
      </section>
    </main>
  );
}
