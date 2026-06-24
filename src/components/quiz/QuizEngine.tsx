"use client";
import parse from "html-react-parser";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Quiz } from "@/lib/content/types";
import { findSubject, findSem, findYear, testTokens } from "@/lib/content/nav";
import { DUAS } from "@/lib/site-config";
import { testPath, setScore, markToday, pushRecent, getSaqDraft, setSaqDraft, clearSaqDraft, isDone, setDone } from "@/lib/progress";
import { asset } from "@/lib/asset";

const RULE = '<svg class="rule" viewBox="0 0 260 11" preserveAspectRatio="none"><path d="M2 7 Q74 1 140 5 T258 4"/></svg>';
function shuffle(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const fmt = (s: number) => { const m = Math.floor(s / 60); const x = s % 60; return `${m}:${x < 10 ? "0" : ""}${x}`; };

function Foot({ next, pal }: { next?: ReactNode; pal?: ReactNode }) {
  return (
    <div className="foot">
      <div className="goodluck">🍀 <span className="extra">good luck</span> <span className="mic">·</span> <span className="exam">best wishes</span> 💙{next}</div>
      {pal}
    </div>
  );
}

export function QuizEngine({ quiz, year, sem, sub, n }: { quiz: Quiz; year: string; sem: string; sub: string; n: string }) {
  const MCQ = quiz.mcqs;
  const SAQ = quiz.saqs || [];
  const testId = testPath(year, sem, sub, n);

  // ordered neighbour tests (skip gaps) + done state
  const toks = testTokens(year, sem, sub).map(String);
  const tIdx = toks.indexOf(String(n));
  const prevHref = tIdx > 0 ? `/test/${year}/${sem}/${sub}/${toks[tIdx - 1]}` : null;
  const nextHref = tIdx >= 0 && tIdx < toks.length - 1 ? `/test/${year}/${sem}/${sub}/${toks[tIdx + 1]}` : null;
  const [done, setDoneState] = useState(false);

  const [mounted, setMounted] = useState(false);
  // per-MCQ option order (stable once mounted); supports any option count (e.g. True/False)
  const maps = useMemo(() => MCQ.map((m) => shuffle(m.opts.length)), [MCQ]);
  const correctVis = useMemo(() => MCQ.map((m, i) => maps[i].indexOf(m.correct)), [MCQ, maps]);

  const [chosen, setChosen] = useState<(number | null)[]>(() => MCQ.map(() => null));
  const [locked, setLocked] = useState<boolean[]>(() => MCQ.map(() => false));
  const [saqDone, setSaqDone] = useState<boolean[]>(() => SAQ.map(() => false));
  const [saqShown, setSaqShown] = useState<boolean[]>(() => SAQ.map(() => false));
  const [drafts, setDrafts] = useState<string[]>(() => SAQ.map(() => ""));
  const [examOn, setExamOn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [remain, setRemain] = useState(0);
  const [examLen, setExamLen] = useState(0);
  const [order, setOrder] = useState<number[]>(() => MCQ.map((_, i) => i));
  const [cur, setCur] = useState(0);
  const [minutes, setMinutes] = useState(20);
  const [dua, setDua] = useState("رَبِّ زِدْني عِلْمًا");

  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeSpent = useRef<number[]>([]);
  const lastTs = useRef(0);
  const cardRefs = useRef<(HTMLElement | null)[]>([]); // [...mcq, ...saq] in original order

  const total = MCQ.length + SAQ.length;

  useEffect(() => {
    setMounted(true);
    setDoneState(isDone(testId));
    if (DUAS.length) setDua(DUAS[Math.floor(Math.random() * DUAS.length)]);
    setDrafts(SAQ.map((_, i) => getSaqDraft(testId, i)));
    document.body.classList.add("test");
    const subj = findSubject(findSem(findYear(year), sem), sub);
    pushRecent({ h: testId, t: `${subj?.name ?? sub} · Test ${n}`, k: "test" });
    markToday();
    return () => {
      document.body.classList.remove("test", "qexam", "qsolo");
      if (tick.current) clearInterval(tick.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mcqScore = chosen.filter((c, i) => c === correctVis[i]).length;
  const saqScore = saqDone.filter(Boolean).length;

  // ---- MCQ interactions ----
  function pickOpt(i: number, v: number) {
    if (examOn) {
      setChosen((p) => p.map((c, j) => (j === i ? v : c)));
      return;
    }
    if (locked[i]) return;
    setChosen((p) => p.map((c, j) => (j === i ? v : c)));
    setLocked((p) => p.map((l, j) => (j === i ? true : l)));
  }
  const reveal = (i: number) => submitted || (!examOn && locked[i]);

  // ---- SAQ ----
  function draftChange(i: number, val: string) {
    setDrafts((p) => p.map((d, j) => (j === i ? val : d)));
    setSaqDraft(testId, i, val);
  }

  // ---- exam timer ----
  function startExam() {
    doReset(true);
    setExamOn(true); setSubmitted(false);
    document.body.classList.add("qexam", "qsolo");
    const min = Math.max(1, Math.min(180, minutes || 20));
    setExamLen(min * 60); setRemain(min * 60);
    timeSpent.current = Array(total).fill(0);
    lastTs.current = Date.now();
    setCur(0);
    if (tick.current) clearInterval(tick.current);
    tick.current = setInterval(() => {
      setRemain((r) => {
        if (r <= 1) { submitExam(); return 0; }
        return r - 1;
      });
    }, 1000);
    showItem(0);
  }

  function tickTime() {
    if (examOn) { const now = Date.now(); timeSpent.current[cur] += (now - lastTs.current) / 1000; lastTs.current = now; }
  }

  function submitExam() {
    tickTime();
    if (tick.current) { clearInterval(tick.current); tick.current = null; }
    setExamOn(false); setSubmitted(true);
    document.body.classList.remove("qexam", "qsolo");
    setSaqShown(SAQ.map(() => true));
    // wrong-first order
    const rank = (i: number) => (chosen[i] === null ? 1 : chosen[i] === correctVis[i] ? 2 : 0);
    setOrder([...MCQ.map((_, i) => i)].sort((a, b) => rank(a) - rank(b)));
    // persist score + auto-mark done (still uncheckable from the dashboard)
    setScore(testId, { s: chosen.filter((c, i) => c === correctVis[i]).length, max: MCQ.length });
    setDone(testId, true); setDoneState(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function doReset(silent: boolean) {
    if (tick.current) { clearInterval(tick.current); tick.current = null; }
    setExamOn(false); setSubmitted(false);
    document.body.classList.remove("qexam", "qsolo");
    setChosen(MCQ.map(() => null));
    setLocked(MCQ.map(() => false));
    setOrder(MCQ.map((_, i) => i));
    setSaqDone(SAQ.map(() => false));
    setSaqShown(SAQ.map(() => false));
    if (!silent) {
      setDrafts(SAQ.map(() => "")); SAQ.forEach((_, i) => clearSaqDraft(testId, i));
    }
  }

  function showItem(k: number) {
    tickTime();
    setCur(k);
    lastTs.current = Date.now();
    const el = cardRefs.current[k];
    const sheet = el?.closest(".sheet") as HTMLElement | null;
    if (sheet) window.scrollTo({ top: sheet.offsetTop - 16, behavior: "smooth" });
  }

  const toggleDone = () => { const nv = !isDone(testId); setDone(testId, nv); setDoneState(nv); };

  if (!mounted) return null;

  const scoreQ = examOn && !submitted;

  // exam navigator (shown in exam mode): in-flow timer at top; Next + Finish beside "best wishes"; numbers under "good luck"
  const examTimer = <div className={"exam-top" + (remain <= 60 ? " low" : "")}>⏱ <b>{fmt(Math.max(0, remain))}</b></div>;
  const examNav = (
    <>
      <button className="exam-next" onClick={() => showItem(Math.min(total - 1, cur + 1))}>Next →</button>
      <button className="exam-submit" onClick={submitExam}>✔ Finish &amp; Submit</button>
    </>
  );
  const examPal = (
    <div className="exam-pal">
      {Array.from({ length: total }).map((_, k) => {
        const answered = k < MCQ.length ? chosen[k] !== null : drafts[k - MCQ.length]?.trim() !== "";
        return (
          <button key={k} className={"exam-pn" + (answered ? " done" : "") + (k === cur ? " on" : "")} onClick={() => showItem(k)}>
            {k < MCQ.length ? k + 1 : `S${k - MCQ.length + 1}`}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ---------- cover ---------- */}
      <section className="sheet cover acc-pink quiz-cover">
        <div className="border" /><div className="border2" />
        <div className="wrap">
          <span className="ic" style={{ width: 60, height: 60, color: "var(--exam)" }}>
            <svg viewBox="0 0 28 28"><path d="M9 4 l0 16 a3 3 0 0 0 6 0 l0-16" /><line x1="9" y1="9" x2="12" y2="9" /><line x1="9" y1="13" x2="12" y2="13" /></svg>
          </span>
          <h1 className="ptitle chalk">{quiz.title || "Test"}</h1>
          {quiz.src ? <p className="quiz-src">{quiz.src}</p> : null}
          <p className="quiz-dua dua">{dua}</p>
          <div className="quiz-score">
            <span>MCQ <b>{scoreQ ? "?" : mcqScore}</b>/{MCQ.length}</span>
            <span>SAQ <b>{saqScore}</b>/{SAQ.length}</span>
            <span>Total <b>{scoreQ ? "?" : mcqScore + saqScore}</b>/{total}</span>
          </div>
          {submitted ? <p className="quiz-time">⏱ Time taken: {fmt(examLen - Math.max(0, remain))}</p> : null}
          <div className="quiz-controls">
            <span className="setup-min">
              <span className="setup-lab">Minutes:</span>
              <input type="number" min={1} max={180} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 20)} />
            </span>
            <button className="qctl go" onClick={startExam}>▶ Start exam</button>
            <button className="qctl" onClick={() => doReset(false)}>↺ Reset</button>
          </div>
        </div>
      </section>

      {/* ---------- MCQs ---------- */}
      <section className="sheet acc-blue quiz-mcq">
        {examTimer}
        <header className="phead">
          <span className="ic"><svg viewBox="0 0 28 28"><circle cx="12" cy="12" r="7" /><line x1="17" y1="17" x2="24" y2="24" /></svg></span>
          <h2 className="ptitle chalk">MCQs</h2><span className="pnum">{MCQ.length}</span>
        </header>
        {parse(RULE)}
        <div className="qgrid">
          {order.map((i) => {
            const m = MCQ[i];
            const showFb = reveal(i);
            const ok = chosen[i] === correctVis[i];
            return (
              <article className={"qcard" + (examOn && cur === i ? " cur" : "")} key={i} ref={(el) => { cardRefs.current[i] = el; }} data-i={i}>
                <p className="q-meta">Q{i + 1} / {MCQ.length}{submitted ? <span className="q-time"> · ⏱ {Math.round(timeSpent.current[i] || 0)}s</span> : null}</p>
                {m.img ? (/* eslint-disable-next-line @next/next/no-img-element */ <img className="qimg" src={asset(m.img)} alt={`image for question ${i + 1}`} loading="lazy" />) : null}
                <p className="q-text">{m.q}</p>
                <div className="q-opts">
                  {maps[i].map((orig, v) => {
                    const cls = ["q-opt"];
                    if (chosen[i] === v) cls.push("sel");
                    if (showFb && v === correctVis[i]) cls.push("correct");
                    if (showFb && chosen[i] === v && v !== correctVis[i]) cls.push("wrong");
                    return (
                      <button key={v} className={cls.join(" ")} disabled={submitted || (!examOn && locked[i])} onClick={() => pickOpt(i, v)}>
                        <span className="q-key">{String.fromCharCode(65 + v)}</span><span>{m.opts[orig]}</span>
                      </button>
                    );
                  })}
                </div>
                {showFb ? (
                  <div className="q-fb">
                    {chosen[i] === null ? <b className="no">Answer: {String.fromCharCode(65 + correctVis[i])}</b>
                      : ok ? <b className="ok">Correct ✔</b>
                      : <b className="no">Answer: {String.fromCharCode(65 + correctVis[i])}</b>}{" "}
                    {m.explain || ""}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        <Foot next={examNav} pal={examPal} />
      </section>

      {/* ---------- SAQs ---------- */}
      {SAQ.length ? (
        <section className="sheet acc-green quiz-saq">
          {examTimer}
          <header className="phead">
            <span className="ic"><svg viewBox="0 0 28 28"><line x1="6" y1="8" x2="22" y2="8" /><line x1="6" y1="14" x2="22" y2="14" /><line x1="6" y1="20" x2="16" y2="20" /></svg></span>
            <h2 className="ptitle chalk">Short Answer</h2><span className="pnum">{SAQ.length}</span>
          </header>
          {parse(RULE)}
          <div>
            {SAQ.map((s, i) => (
              <article className={"saq-item" + (examOn && cur === MCQ.length + i ? " cur" : "")} key={i} ref={(el) => { cardRefs.current[MCQ.length + i] = el; }} data-i={i}>
                <p className="q-meta">Q{i + 1} / {SAQ.length}</p>
                <p className="q-text">{s.q}</p>
                <textarea className="saq-box" rows={4} placeholder="Write your answer…" value={drafts[i]} onChange={(e) => draftChange(i, e.target.value)} />
                <div className="saq-row">
                  <button className="qbtn saq-reveal" onClick={() => !examOn && setSaqShown((p) => p.map((x, j) => (j === i ? !x : x)))}>
                    {saqShown[i] ? "Hide answer" : "Reveal answer"}
                  </button>
                  <button className={"qbtn saq-done" + (saqDone[i] ? " on" : "")} onClick={() => setSaqDone((p) => p.map((x, j) => (j === i ? !x : x)))}>
                    {saqDone[i] ? "✓ done" : "Mark done"}
                  </button>
                </div>
                <div className="saq-ans" hidden={!saqShown[i]}>{parse(s.a || "")}</div>
              </article>
            ))}
          </div>
          <Foot next={examNav} pal={examPal} />
        </section>
      ) : null}

      {/* prev test · mark done · next test (hidden in exam mode via CSS) */}
      <nav className="study-nav">
        {prevHref ? <Link className="study-pg" href={prevHref}>← Prev test</Link> : <span className="study-pg off">← Prev test</span>}
        <button className={"study-done" + (done ? " on" : "")} type="button" onClick={toggleDone}>
          {done ? "✓ Done" : "Mark done"}
        </button>
        {nextHref ? <Link className="study-pg" href={nextHref}>Next test →</Link> : <span className="study-pg off">Next test →</span>}
      </nav>
    </>
  );
}
