"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/site-config";
import { findYear, findSem, findSubject, lectureTokens } from "@/lib/content/nav";
import { subjectBase } from "@/lib/content/nav";
import { isDone, lecturePath, getPlan, setPlan, type PlanRow } from "@/lib/progress";
import { TITLES } from "@/lib/titles";
import { Bi } from "@/lib/content/Bi";
import { useTheme } from "@/lib/theme/ThemeProvider";

const semFromKey = (key: string) => {
  const [y, s] = (key || "").split("|");
  const year = findYear(y);
  const sem = findSem(year, s);
  return year && sem ? { year, sem } : null;
};
const tokensAll = (y: string, s: string, sub: string) => lectureTokens(y, s, sub).map(String);

export function PlanView() {
  const { lang } = useTheme();
  const AR = lang === "ar";
  const [plans, setPlans] = useState<PlanRow[]>([{ sem: "", sub: "", lectures: null, date: "" }]);

  useEffect(() => {
    const stored = getPlan();
    setPlans(stored.length ? stored : [{ sem: "", sub: "", lectures: null, date: "" }]);
  }, []);

  const save = (next: PlanRow[]) => { setPlans(next); setPlan(next); };
  const patch = (i: number, p: Partial<PlanRow>) => save(plans.map((pl, j) => (j === i ? { ...pl, ...p } : pl)));

  // selected (or default not-done) lecture tokens for a plan row
  const selOf = (pl: PlanRow): string[] => {
    const ctx = semFromKey(pl.sem);
    const sub = ctx && findSubject(ctx.sem, pl.sub);
    if (!ctx || !sub) return [];
    const toks = tokensAll(ctx.year.id, ctx.sem.id, sub.id);
    if (Array.isArray(pl.lectures)) return pl.lectures.filter((t) => toks.includes(t));
    return toks.filter((t) => !isDone(lecturePath(ctx.year.id, ctx.sem.id, sub.id, t)));
  };

  // ---- daily schedule across all exams (nearest first) ----
  function schedule(): React.ReactNode {
    const today = new Date(new Date().toDateString());
    type Exam = { name: string; nameAr: string; date: string; examDay: number; queue: string[]; y: string; s: string; sub: string; base: string };
    const exams: Exam[] = [];
    plans.forEach((pl) => {
      const ctx = semFromKey(pl.sem);
      const sub = ctx && findSubject(ctx.sem, pl.sub);
      if (!ctx || !sub || !pl.date) return;
      const queue = selOf(pl).filter((t) => !isDone(lecturePath(ctx.year.id, ctx.sem.id, sub.id, t)));
      if (!queue.length) return;
      const examDay = Math.max(0, Math.round((new Date(pl.date + "T00:00:00").getTime() - today.getTime()) / 86400000));
      exams.push({ name: sub.name, nameAr: sub.nameAr || sub.name, date: pl.date, examDay, queue: [...queue], y: ctx.year.id, s: ctx.sem.id, sub: sub.id, base: subjectBase(ctx.year, ctx.sem, sub) });
    });
    if (!exams.length) return <div className="empty-note">{AR ? "اختر مادة وتاريخًا لبناء جدولك" : "Choose a subject + date to build your schedule"}</div>;
    const maxDay = Math.max(...exams.map((e) => e.examDay));
    const days: React.ReactNode[] = [];
    for (let d = 0; d <= maxDay; d++) {
      const rows: React.ReactNode[] = [];
      exams.slice().sort((a, b) => a.examDay - b.examDay).forEach((e) => {
        if (!e.queue.length || d > e.examDay) return;
        const daysLeft = Math.max(1, e.examDay - d);
        const items = e.queue.splice(0, Math.ceil(e.queue.length / daysLeft));
        if (!items.length) return;
        rows.push(
          <div className="plan-day-exam" key={`${e.sub}-${d}`}>
            <div className="plan-day-sub"><Bi v={{ en: e.name, ar: e.nameAr }} /> <small className="sec-count">{e.date}</small></div>
            <div className="dash-recent">
              {items.map((t) => {
                const ti = TITLES[`${e.base}|${t}`];
                return (
                  <Link className="recent-item" href={`/lecture/${e.y}/${e.s}/${e.sub}/${t}`} key={t}>
                    <Bi v={{ en: `Lecture ${t}${ti ? " — " + (ti.e || ti.a) : ""}`, ar: `محاضرة ${t}${ti ? " — " + (ti.a || ti.e) : ""}` }} />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      });
      if (rows.length) {
        const dd = new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);
        days.push(
          <section className="section plan-day" key={`day-${d}`}>
            <div className="section-head bar"><h2><Bi v={{ en: "Day", ar: "يوم" }} /> {d + 1} <small className="sec-count">{dd}</small></h2></div>
            {rows}
          </section>
        );
      }
    }
    return (
      <>
        <h2 className="section-h plan-sched-title"><span className="grad-text"><Bi v={{ en: "📋 Your daily schedule", ar: "📋 جدولك اليومي" }} /></span></h2>
        {days}
      </>
    );
  }

  const semOpts = SITE.years.flatMap((y) => y.semesters.map((s) => ({ value: `${y.id}|${s.id}`, label: `${y.name} · ${s.name}` })));

  return (
    <main className="container" id="dmain">
      <div id="planRoot">
        <p className="plan-intro">
          <Bi v={{ en: "For each exam: pick semester → subject → the lectures it covers + its date. The schedule below spreads everything across the days, prioritising the nearest exam.", ar: "لكل امتحان: اختر الفصل ← المادة ← المحاضرات الداخلة + تاريخه. الجدول تحت يوزّع كل شي على الأيام مع أولوية الأقرب." }} />
        </p>

        {plans.map((pl, pi) => {
          const ctx = semFromKey(pl.sem);
          const sub = ctx && findSubject(ctx.sem, pl.sub);
          const toks = ctx && sub ? tokensAll(ctx.year.id, ctx.sem.id, sub.id) : [];
          const sel = selOf(pl);
          return (
            <div className="plan-exam" key={pi}>
              <div className="plan-cfg">
                <select className="plan-sem" value={pl.sem} onChange={(e) => patch(pi, { sem: e.target.value, sub: "", lectures: null })}>
                  <option value="">{AR ? "الفصل…" : "Semester…"}</option>
                  {semOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {ctx ? (
                  <select className="plan-sub" value={pl.sub} onChange={(e) => patch(pi, { sub: e.target.value, lectures: null })}>
                    <option value="">{AR ? "المادة…" : "Subject…"}</option>
                    {ctx.sem.subjects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                ) : null}
                <input type="date" className="plan-date" value={pl.date || ""} onChange={(e) => patch(pi, { date: e.target.value })} />
                <button className="plan-del" type="button" title="Remove" aria-label="Remove" onClick={() => save(plans.filter((_, j) => j !== pi))}>✕</button>
              </div>

              {ctx && sub ? (
                <div className="plan-lecs">
                  <div className="plan-lecs-head">
                    <Bi v={{ en: "Lectures in this exam", ar: "المحاضرات الداخلة" }} /> <span className="plan-cnt">({sel.length}/{toks.length})</span>{" "}
                    <button className="plan-all" type="button" onClick={() => patch(pi, { lectures: sel.length < toks.length ? [...toks] : [] })}>
                      {sel.length < toks.length ? (AR ? "تحديد الكل" : "Select all") : (AR ? "إلغاء الكل" : "Clear")}
                    </button>
                  </div>
                  <div className="plan-lec-list">
                    {toks.map((t) => {
                      const ti = TITLES[`${subjectBase(ctx.year, ctx.sem, sub)}|${t}`];
                      const isd = isDone(lecturePath(ctx.year.id, ctx.sem.id, sub.id, t));
                      const checked = sel.includes(t);
                      return (
                        <label className={"plan-lec" + (isd ? " done" : "")} key={t}>
                          <input
                            type="checkbox"
                            className="plan-lec-cb"
                            checked={checked}
                            onChange={(e) => {
                              const base = new Set(sel);
                              if (e.target.checked) base.add(t); else base.delete(t);
                              patch(pi, { lectures: toks.filter((x) => base.has(x)) });
                            }}
                          />{" "}
                          <span><Bi v={{ en: `Lecture ${t}${ti ? " — " + (ti.e || ti.a) : ""}${isd ? " ✓" : ""}`, ar: `محاضرة ${t}${ti ? " — " + (ti.e || ti.a) : ""}${isd ? " ✓" : ""}` }} /></span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        <button className="plan-add" type="button" onClick={() => save([...plans, { sem: "", sub: "", lectures: null, date: "" }])}>
          + <Bi v={{ en: "Add exam", ar: "أضف امتحان" }} />
        </button>

        <div id="planSched">{schedule()}</div>
      </div>
    </main>
  );
}
