"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SITE } from "@/lib/site-config";
import { lectureTokens, testTokens, subjectBase } from "@/lib/content/nav";
import { isDone, setDone, getScore, lecturePath, testPath } from "@/lib/progress";
import { TITLES, type TitleEntry } from "@/lib/titles";
import { useProgressBump } from "@/lib/useProgressBump";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Bi, Emoji } from "@/lib/content/Bi";

type Card = {
  id: string; y: string; s: string; emoji: string | null; name: string; nameAr: string;
  lecToks: string[]; testToks: string[];
  lecDone: Record<string, boolean>; testDone: Record<string, boolean>;
  titles: Record<string, TitleEntry | undefined>;
  done: number; lec: number; pct: number;
  tDone: number; tTot: number; avg: number; scored: number;
};
type Sec = { key: string; name: string; nameAr: string; semDone: number; semAll: number; cards: Card[] };

export function DashboardView() {
  const [secs, setSecs] = useState<Sec[]>([]);
  const [open, setOpen] = useState<string | null>(null); // expanded subject (sec.key-sub.id)

  const recompute = useCallback(() => {
    const out: Sec[] = [];
    SITE.years.forEach((y) =>
      y.semesters.forEach((s) => {
        let semDone = 0, semAll = 0;
        const cards: Card[] = [];
        s.subjects.forEach((sub) => {
          const base = subjectBase(y, s, sub);
          const lecToks = lectureTokens(y.id, s.id, sub.id).map(String);
          const lecDone: Record<string, boolean> = {};
          let done = 0;
          lecToks.forEach((t) => { const d = isDone(lecturePath(y.id, s.id, sub.id, t)); lecDone[t] = d; if (d) done++; });
          semDone += done; semAll += lecToks.length;
          const pct = lecToks.length ? Math.round((done / lecToks.length) * 100) : 0;

          const testToks = testTokens(y.id, s.id, sub.id).map(String);
          const testDone: Record<string, boolean> = {};
          let tDone = 0, scored = 0, sum = 0;
          testToks.forEach((t) => {
            const sc = getScore(testPath(y.id, s.id, sub.id, t));
            const d = isDone(testPath(y.id, s.id, sub.id, t)); // manual done flag — toggleable (finishing an exam auto-marks it)
            testDone[t] = d; if (d) tDone++;
            if (sc && sc.max) { scored++; sum += Math.round((sc.s / sc.max) * 100); }
          });
          const avg = scored ? Math.round(sum / scored) : 0;

          const titles: Record<string, TitleEntry | undefined> = {};
          Array.from(new Set([...lecToks, ...testToks])).forEach((t) => { titles[t] = TITLES[`${base}|${t}`]; });

          cards.push({
            id: sub.id, y: y.id, s: s.id, emoji: sub.emoji, name: sub.name, nameAr: sub.nameAr,
            lecToks, testToks, lecDone, testDone, titles,
            done, lec: lecToks.length, pct, tDone, tTot: testToks.length, avg, scored,
          });
        });
        if (cards.length) out.push({ key: `${y.id}-${s.id}`, name: s.name, nameAr: s.nameAr, semDone, semAll, cards });
      })
    );
    setSecs(out);
  }, []);

  const bump = useProgressBump();
  const auth = useAuth();
  const [syncMsg, setSyncMsg] = useState("");
  useEffect(() => { recompute(); }, [recompute, bump]);

  const toggleLec = (y: string, s: string, sub: string, tok: string) => {
    const id = lecturePath(y, s, sub, tok); setDone(id, !isDone(id)); recompute();
  };
  const toggleTest = (y: string, s: string, sub: string, tok: string) => {
    const id = testPath(y, s, sub, tok); setDone(id, !isDone(id)); recompute();
  };
  const setAllLec = (c: Card, value: boolean) => { c.lecToks.forEach((t) => setDone(lecturePath(c.y, c.s, c.id, t), value)); recompute(); };
  const setAllTest = (c: Card, value: boolean) => { c.testToks.forEach((t) => setDone(testPath(c.y, c.s, c.id, t), value)); recompute(); };
  const doSync = async () => {
    if (!auth) return;
    const r = await auth.syncNow();
    setSyncMsg(r.info || r.error || "");
    window.setTimeout(() => setSyncMsg(""), 2500);
  };

  return (
    <main className="container" id="dmain">
      <div id="dashRoot">
        <div className="dash-top">
          <Link className="dash-resume plan-link" href="/plan">
            <Emoji e="📅" /><Bi v={{ en: "Build a study plan", ar: "ابنِ خطة مذاكرة" }} />
          </Link>
          {auth?.enabled && auth.status === "in" ? (
            <button type="button" className="dash-sync plan-link" onClick={doSync} disabled={auth.syncing}>
              <Emoji e="🔄" />
              <Bi v={{ en: auth.syncing ? "Syncing…" : "Sync now", ar: auth.syncing ? "جارٍ المزامنة…" : "زامن الآن" }} />
              {syncMsg && !auth.syncing ? <span className="dash-sync-msg">{syncMsg}</span> : null}
            </button>
          ) : null}
        </div>
        {secs.map((sec) => (
          <section className="section" key={sec.key}>
            <div className="section-head bar">
              <h2>
                <Bi v={{ en: sec.name, ar: sec.nameAr }} /> <small className="sec-count">{sec.semDone}/{sec.semAll}</small>
              </h2>
            </div>
            <div className="board list-board">
              {sec.cards.map((c) => {
                const cardKey = `${sec.key}-${c.id}`;
                const isOpen = open === cardKey;
                const lecItems = (
                  <div className="dcl-col">
                    <div className="dcl-head"><span><Bi v={{ en: "Lectures", ar: "المحاضرات" }} /></span><span className="dcl-cnt">{c.done}/{c.lec}</span><button type="button" className="dcl-all" onClick={() => setAllLec(c, c.done < c.lec)}><Bi v={{ en: c.done < c.lec ? "✓ All" : "Clear", ar: c.done < c.lec ? "✓ الكل" : "مسح" }} /></button></div>
                    <div className="dcl-list">
                      {c.lecToks.map((t) => (
                        <label className={"dcl-item" + (c.lecDone[t] ? " done" : "")} key={t}>
                          <input type="checkbox" checked={c.lecDone[t]} onChange={() => toggleLec(c.y, c.s, c.id, t)} />
                          <span className="dcl-n">{t}</span>
                          <span className="dcl-t"><Bi v={{ en: c.titles[t]?.e || `Lecture ${t}`, ar: c.titles[t]?.a || `محاضرة ${t}` }} /></span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
                const testItems = (
                  <div className="dcl-col">
                    <div className="dcl-head"><span><Bi v={{ en: "Tests", ar: "الاختبارات" }} /></span><span className="dcl-cnt">{c.tDone}/{c.tTot}</span><button type="button" className="dcl-all" onClick={() => setAllTest(c, c.tDone < c.tTot)}><Bi v={{ en: c.tDone < c.tTot ? "✓ All" : "Clear", ar: c.tDone < c.tTot ? "✓ الكل" : "مسح" }} /></button></div>
                    <div className="dcl-list">
                      {c.testToks.map((t) => (
                        <label className={"dcl-item" + (c.testDone[t] ? " done" : "")} key={t}>
                          <input type="checkbox" checked={c.testDone[t]} onChange={() => toggleTest(c.y, c.s, c.id, t)} />
                          <span className="dcl-n">{t}</span>
                          <span className="dcl-t"><Bi v={{ en: c.titles[t]?.e || `Test ${t}`, ar: c.titles[t]?.a || `اختبار ${t}` }} /></span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
                return (
                  <div
                    className={"card dash-card" + (c.pct === 100 && c.lec ? " is-complete" : "") + (isOpen ? " open" : "")}
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : cardKey)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(isOpen ? null : cardKey); } }}
                  >
                    <span className="dash-chev" aria-hidden>{isOpen ? "▾" : "▸"}</span>
                    <div className="ctitle"><Emoji e={c.emoji} /><Bi v={{ en: c.name, ar: c.nameAr }} /></div>
                    <div className="dash-line"><span><Bi v={{ en: "Lectures", ar: "المحاضرات" }} /></span><b>{c.done}/{c.lec} · {c.pct}%</b></div>
                    <div className="dash-bar"><span style={{ width: `${c.pct}%` }} /></div>
                    <div className="dash-line"><span><Bi v={{ en: "Tests", ar: "الاختبارات" }} /></span><b>{c.tTot ? `${c.tDone}/${c.tTot}${c.scored ? ` · ${c.avg}%` : ""}` : "—"}</b></div>
                    {c.scored ? <div className="dash-bar tests"><span style={{ width: `${c.avg}%` }} /></div> : null}

                    {isOpen ? (
                      <div className="dash-checklist" onClick={(e) => e.stopPropagation()}>
                        {c.lecToks.length ? lecItems : null}
                        {c.testToks.length ? testItems : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
