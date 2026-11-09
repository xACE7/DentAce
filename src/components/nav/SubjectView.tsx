"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { findYear, findSem, findSubject, lectureTokens, testTokens, pdfItems, extraTokens, glowClass } from "@/lib/content/nav";
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
  const nLec = lectureTokens(year.id, sem.id, sub.id).length;
  const nTst = testTokens(year.id, sem.id, sub.id).length;
  const nPdf = pdfItems(year.id, sem.id, sub.id).length;
  const nExt = extraTokens(year.id, sem.id, sub.id).length;

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
          {/* Nothing to track means nothing to show — a 0/0 bar is just noise. */}
          {nLec || nTst ? (
            <div className="subj-perf">
              {nLec ? (
                <div className="perf-item">
                  <div className="perf-lbl"><Emoji e="📘" /><Bi v={{ en: "Lectures", ar: "المحاضرات" }} /></div>
                  <div className="perf-bar"><span style={{ width: `${perf.lp}%` }} /></div>
                  <div className="perf-num">{perf.ld}/{perf.lt} · {perf.lp}%</div>
                </div>
              ) : null}
              {nTst ? (
                <div className="perf-item">
                  <div className="perf-lbl"><Emoji e="📝" /><Bi v={{ en: "Tests", ar: "الاختبارات" }} /></div>
                  <div className="perf-bar tests"><span style={{ width: `${perf.ta}%` }} /></div>
                  <div className="perf-num">
                    {perf.tk ? `${perf.tk}/${perf.tt} · ${perf.ta}%` : <Bi v={{ en: "not taken", ar: "لم تُختبر" }} />}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {/* A card is only worth showing when that kind has something behind it:
              Diagnosis & Planning, for instance, carries extras but no lectures,
              tests or PDFs, and empty cards lead the reader to empty lists. */}
          {nPdf && auth?.flags.pdfs !== false ? (
            <Link className={`card ${g}`} href={`/list/${q}/pdf`}>
              <div className="ctitle"><Emoji e="📁" /><Bi v={{ en: "PDFs", ar: "ملفات PDF" }} /></div>
            </Link>
          ) : null}
          {nLec ? (
            <Link className={`card ${g}`} href={`/list/${q}/lecture`}>
              <div className="ctitle"><Emoji e="📘" /><Bi v={{ en: "Lectures", ar: "المحاضرات" }} /></div>
            </Link>
          ) : null}
          {nTst ? (
            <Link className={`card ${g}`} href={`/list/${q}/test`}>
              <div className="ctitle"><Emoji e="📝" /><Bi v={{ en: "Tests", ar: "الاختبارات" }} /></div>
            </Link>
          ) : null}
          {nExt ? (
            <Link className={`card ${g}`} href={`/list/${q}/extra`}>
              <div className="ctitle"><Emoji e="🧩" /><Bi v={{ en: "Extra", ar: "إضافي" }} /></div>
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
