"use client";
/* The six interactive lecture blocks.

   Each one is an active-recall widget: the student has to DO something before the
   content shows itself. All register with the sheet's InteractiveProvider and report
   completion, which drives the per-lecture progress bar.

   Keyboard and screen readers: every target is a real <button>, so Tab/Enter/Space
   work without extra handlers, and state changes are announced via aria-pressed /
   aria-expanded. */
import React, { useMemo, useState } from "react";
import { Bi } from "@/lib/content/Bi";
import { asset } from "@/lib/asset";
import { useInteractive, useInteractiveProgress, seededOrder } from "@/lib/content/interactive";
import type { Bilingual, Hot } from "@/lib/content/types";

const enOf = (v: Bilingual | undefined) => (v == null ? "" : typeof v === "string" ? v : v.en || "");
const key = (v: Bilingual) => enOf(v).replace(/\[\/?[a-z]+\]/g, "");

/* ── 1 · Image hotspots ───────────────────────────────────────────────────── */
export function HotspotView({ h, id }: { h: { img: string; cap?: Bilingual; alt?: string; pts: Hot[] }; id: string }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const { done, finish } = useInteractive(id);
  const all = open.size >= h.pts.length;

  const tap = (i: number) => {
    const next = new Set(open);
    next.has(i) ? next.delete(i) : next.add(i);
    setOpen(next);
    if (next.size >= h.pts.length) finish();
  };

  return (
    <figure className={"ix ix-hot" + (all || done ? " all" : "")}>
      <div className="ix-hot-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(h.img)} alt={h.alt || enOf(h.cap) || ""} loading="lazy" decoding="async" />
        {h.pts.map((p, i) => (
          <button
            key={i}
            type="button"
            className={"ix-dot" + (open.has(i) ? " on" : "")}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={() => tap(i)}
            aria-expanded={open.has(i)}
            aria-label={open.has(i) ? `Hide point ${i + 1}` : `Reveal point ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <ol className="ix-hot-list">
        {h.pts.map((p, i) => (
          <li key={i} className={open.has(i) ? "on" : ""}>
            <button type="button" className="ix-hot-row" onClick={() => tap(i)} aria-expanded={open.has(i)}>
              <span className="ix-num">{i + 1}</span>
              <span className="ix-hot-txt">
                {open.has(i) ? (
                  <>
                    <b><Bi v={p.label} /></b>
                    {p.body ? <span className="ix-hot-body"><Bi v={p.body} /></span> : null}
                  </>
                ) : (
                  <span className="ix-blank">tap to reveal</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {h.cap ? <figcaption><Bi v={h.cap} /></figcaption> : null}
    </figure>
  );
}

/* ── 2 · Inline self-test ─────────────────────────────────────────────────── */
export function QuizBlockView({ q, id }: { q: { q: Bilingual; opts: Bilingual[]; correct: number; explain?: Bilingual }; id: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const { done, finish } = useInteractive(id);
  // shuffle so the answer isn't always in the same slot
  const map = useMemo(() => seededOrder(q.opts.length, key(q.q)), [q.opts.length, q.q]);
  const correctSlot = map.indexOf(q.correct);

  const pick = (slot: number) => {
    if (picked != null) return;
    setPicked(slot);
    if (slot === correctSlot) finish();
  };

  return (
    <div className={"ix ix-quiz" + (picked != null ? " answered" : "") + (done ? " was-done" : "")}>
      <p className="ix-q"><span className="ix-tag">Check yourself</span><Bi v={q.q} /></p>
      <ul className="ix-opts">
        {map.map((orig, slot) => {
          const state = picked == null ? "" : slot === correctSlot ? " ok" : slot === picked ? " no" : " dim";
          return (
            <li key={slot}>
              <button type="button" className={"ix-opt" + state} onClick={() => pick(slot)} disabled={picked != null}>
                <span className="ix-mark">{String.fromCharCode(65 + slot)}</span>
                <Bi v={q.opts[orig]} />
              </button>
            </li>
          );
        })}
      </ul>
      {picked != null && q.explain ? (
        <p className="ix-explain"><Bi v={q.explain} /></p>
      ) : null}
    </div>
  );
}

/* ── 3 · Tap-to-order sequence ────────────────────────────────────────────── */
export function OrderView({ o, id }: { o: { title?: Bilingual; steps: Bilingual[] }; id: string }) {
  const n = o.steps.length;
  const shuffled = useMemo(() => seededOrder(n, o.steps.map(key).join("|")), [n, o.steps]);
  const [placed, setPlaced] = useState<number[]>([]); // original indices, in tap order
  const { done, finish } = useInteractive(id);
  const [wrong, setWrong] = useState<number | null>(null);

  const tap = (orig: number) => {
    if (placed.includes(orig)) return;
    if (orig === placed.length) {
      const next = [...placed, orig];
      setPlaced(next);
      setWrong(null);
      if (next.length === n) finish();
    } else {
      setWrong(orig);
      window.setTimeout(() => setWrong((w) => (w === orig ? null : w)), 600);
    }
  };

  const solved = placed.length === n;
  return (
    <div className={"ix ix-order" + (solved || done ? " solved" : "")}>
      <p className="ix-q">
        <span className="ix-tag">Put in order</span>
        {o.title ? <Bi v={o.title} /> : <span>Tap the steps in the correct sequence.</span>}
      </p>
      <ol className="ix-order-list">
        {shuffled.map((orig) => {
          const pos = placed.indexOf(orig);
          return (
            <li key={orig}>
              <button
                type="button"
                className={"ix-step" + (pos >= 0 ? " set" : "") + (wrong === orig ? " shake" : "")}
                onClick={() => tap(orig)}
                disabled={pos >= 0}
              >
                <span className="ix-num">{pos >= 0 ? pos + 1 : "?"}</span>
                <Bi v={o.steps[orig]} />
              </button>
            </li>
          );
        })}
      </ol>
      {placed.length > 0 && !solved ? (
        <button type="button" className="ix-reset" onClick={() => { setPlaced([]); setWrong(null); }}>Start over</button>
      ) : null}
      {solved ? <p className="ix-explain ok">Correct sequence.</p> : null}
    </div>
  );
}

/* ── 4 · Match the pairs ──────────────────────────────────────────────────── */
export function MatchView({ m, id }: { m: { title?: Bilingual; pairs: [Bilingual, Bilingual][] }; id: string }) {
  const n = m.pairs.length;
  const rightOrder = useMemo(() => seededOrder(n, m.pairs.map((p) => key(p[1])).join("|")), [n, m.pairs]);
  const [sel, setSel] = useState<number | null>(null); // selected LEFT index
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [miss, setMiss] = useState<number | null>(null);
  const { done, finish } = useInteractive(id);

  const tapRight = (orig: number) => {
    if (sel == null || matched.has(orig)) return;
    if (orig === sel) {
      const next = new Set(matched).add(orig);
      setMatched(next);
      setSel(null);
      if (next.size === n) finish();
    } else {
      setMiss(orig);
      window.setTimeout(() => setMiss((x) => (x === orig ? null : x)), 600);
      setSel(null);
    }
  };

  const solved = matched.size === n;
  return (
    <div className={"ix ix-match" + (solved || done ? " solved" : "")}>
      <p className="ix-q">
        <span className="ix-tag">Match</span>
        {m.title ? <Bi v={m.title} /> : <span>Tap a term, then its match.</span>}
      </p>
      <div className="ix-match-grid">
        <ul className="ix-col">
          {m.pairs.map((p, i) => (
            <li key={i}>
              <button
                type="button"
                className={"ix-cell" + (matched.has(i) ? " set" : "") + (sel === i ? " sel" : "")}
                onClick={() => !matched.has(i) && setSel(sel === i ? null : i)}
                disabled={matched.has(i)}
                aria-pressed={sel === i}
              >
                <Bi v={p[0]} />
              </button>
            </li>
          ))}
        </ul>
        <ul className="ix-col">
          {rightOrder.map((orig) => (
            <li key={orig}>
              <button
                type="button"
                className={"ix-cell" + (matched.has(orig) ? " set" : "") + (miss === orig ? " shake" : "")}
                onClick={() => tapRight(orig)}
                disabled={matched.has(orig) || sel == null}
              >
                <Bi v={m.pairs[orig][1]} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      {solved ? <p className="ix-explain ok">All matched.</p> : null}
    </div>
  );
}

/* ── 5 · Blur-to-reveal prompt list ───────────────────────────────────────── */
export function RevealView({ r, id }: { r: { label?: Bilingual; items: { q: Bilingual; a: Bilingual }[] }; id: string }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const { done, finish } = useInteractive(id);

  const tap = (i: number) => {
    const next = new Set(open);
    next.has(i) ? next.delete(i) : next.add(i);
    setOpen(next);
    if (next.size >= r.items.length) finish();
  };

  const all = open.size >= r.items.length;
  return (
    <div className={"ix ix-reveal" + (all || done ? " all" : "")}>
      <p className="ix-q">
        <span className="ix-tag">Recall</span>
        {r.label ? <Bi v={r.label} /> : <span>Tap each to check yourself.</span>}
      </p>
      <ul className="ix-reveal-list">
        {r.items.map((it, i) => (
          <li key={i}>
            <button type="button" className={"ix-rev" + (open.has(i) ? " on" : "")} onClick={() => tap(i)} aria-expanded={open.has(i)}>
              <span className="ix-rev-q"><Bi v={it.q} /></span>
              <span className={"ix-rev-a" + (open.has(i) ? "" : " hid")}><Bi v={it.a} /></span>
            </button>
          </li>
        ))}
      </ul>
      {!all ? (
        <button type="button" className="ix-reset" onClick={() => { setOpen(new Set(r.items.map((_, i) => i))); finish(); }}>Reveal all</button>
      ) : null}
    </div>
  );
}

/* ── 6 · Table with hidden columns ────────────────────────────────────────── */
export function HiddenTable({ t, id }: { t: { head: Bilingual[]; rows: Bilingual[][]; hide?: number[] }; id: string }) {
  const hide = useMemo(() => new Set(t.hide || []), [t.hide]);
  const cells = useMemo(() => {
    const out: string[] = [];
    t.rows.forEach((r, ri) => r.forEach((_, ci) => { if (hide.has(ci)) out.push(`${ri}:${ci}`); }));
    return out;
  }, [t.rows, hide]);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const { done, finish } = useInteractive(id);

  const tap = (k: string) => {
    const next = new Set(open);
    next.has(k) ? next.delete(k) : next.add(k);
    setOpen(next);
    if (next.size >= cells.length) finish();
  };

  const all = open.size >= cells.length;
  return (
    <div className={"table-wrap ix-tbl" + (all || done ? " all" : "")}>
      <table className="tbl">
        <tbody>
          <tr>{t.head.map((c, i) => <th key={i}><Bi v={c} /></th>)}</tr>
          {t.rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => {
                const k = `${ri}:${ci}`;
                if (!hide.has(ci)) return <td key={ci}><Bi v={c} /></td>;
                const shown = open.has(k);
                return (
                  <td key={ci} className={"ix-cellwrap" + (shown ? " on" : "")}>
                    <button type="button" className="ix-hidecell" onClick={() => tap(k)} aria-expanded={shown}>
                      <Bi v={c} />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {!all && cells.length ? (
        <button type="button" className="ix-reset" onClick={() => { setOpen(new Set(cells)); finish(); }}>Reveal all</button>
      ) : null}
    </div>
  );
}

/* ── Per-lecture progress bar ─────────────────────────────────────────────── */
export function IxBar() {
  const { total, done, pct } = useInteractiveProgress();
  if (!total) return null; // lecture has no interactions yet — show nothing
  return (
    <div className={"ix-bar" + (done === total ? " full" : "")} role="group" aria-label="Interaction progress">
      <div className="ix-bar-track"><div className="ix-bar-fill" style={{ width: `${pct}%` }} /></div>
      <span className="ix-bar-txt">
        {done === total ? "✓ All activities done" : `${done} / ${total} activities`}
      </span>
    </div>
  );
}
