"use client";
import React from "react";
import parse from "html-react-parser";
import { Bi } from "@/lib/content/Bi";
import { asset } from "@/lib/asset";
import type { Unit, Sheet, Row, Block, Fig, Bilingual } from "@/lib/content/types";

/* React port of render.js — emits the exact chalk-sheet DOM (same classes) from a Unit. */

const ACC = ["blue", "green", "purple", "orange", "pink"];
const DEF_ICON = '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="9"/><path d="M14 9 v5 l3 3"/></svg>';
const RULE = '<svg class="rule" viewBox="0 0 260 11" preserveAspectRatio="none"><path d="M2 7 Q74 1 140 5 T258 4"/></svg>';
const DOODLE = '<svg class="doodle" style="bottom:120px;left:34px;width:58px;height:58px" viewBox="0 0 60 60"><path d="M30 6 l6 16 17 1 -13 11 5 17 -15 -10 -15 10 5 -17 -13 -11 17 -1z"/></svg>';

const enOf = (o: Bilingual | undefined) => (o == null ? "" : typeof o === "string" ? o : o.en || "");
const stripMk = (s: string) => String(s ?? "").replace(/\[br\]/g, " ").replace(/\[\/?(?:imp|exam|extra|def|mic|b|u|r)\]/g, "");
const Raw = ({ html, ...rest }: { html: string } & React.HTMLAttributes<HTMLSpanElement>) => <span {...rest} dangerouslySetInnerHTML={{ __html: html }} />;

/* chalk decorations that study.js deco() injects into every sheet */
function Tray() {
  return (
    <div className="tray" aria-hidden="true">
      <span className="ck c1" /><span className="ck c2" /><span className="ck c3" /><span className="ck c4" /><span className="ck c5" />
      <span className="er" />
    </div>
  );
}
function Flourish() {
  return (
    <svg className="flourish" viewBox="0 0 62 30" aria-hidden="true">
      <path d="M3 22 C16 6 26 6 33 16 C38 23 47 23 59 9" />
      <line x1="50" y1="4" x2="58" y2="2" />
    </svg>
  );
}

function Legend() {
  return (
    <div className="key">
      <span className="imp"><b>●</b><span className="en">imp</span><span className="ar">مهم</span></span>{" "}
      <span className="exam"><b>●</b><span className="en">exam</span><span className="ar">امتحان</span></span>{" "}
      <span className="extra"><b>●</b><span className="en">extra</span><span className="ar">إضافي</span></span>{" "}
      <span className="def"><b>●</b><span className="en">def</span><span className="ar">تعريف</span></span>{" "}
      <span className="mic"><b>●</b><span className="en">term</span><span className="ar">مصطلح</span></span>
    </div>
  );
}

function Figure({ f }: { f: Fig }) {
  const alt = stripMk(f.alt || enOf(f.cap) || "");
  return (
    <figure className="clin">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(f.img)} alt={alt} loading="lazy" decoding="async" />
      <figcaption>{f.cap != null ? <Bi v={f.cap} /> : null}</figcaption>
    </figure>
  );
}

function Table({ t }: { t: { head: Bilingual[]; rows: Bilingual[][] } }) {
  // Wrapped in .table-wrap (overflow-x:auto) so a wide table gets a horizontal
  // scrollbar on phones instead of being clipped by the sheet.
  return (
    <div className="table-wrap">
      <table className="tbl">
        <tbody>
          <tr>{t.head.map((c, i) => <th key={i}><Bi v={c} /></th>)}</tr>
          {t.rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}><Bi v={c} /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  if ("p" in b) return <p><Bi v={b.p} /></p>;
  if ("h3" in b) return <h3 className={b.c ? "c-" + b.c : undefined}><Bi v={b.h3} /></h3>;
  if ("ul" in b) return <ul>{b.ul.map((li, i) => <li key={i}><Bi v={li} /></li>)}</ul>;
  if ("note" in b)
    return (
      <div className="xnote">
        <span className="lbl chalk"><Bi v={b.note.label} /></span>
        <p className="ln"><Bi v={b.note.body} /></p>
      </div>
    );
  if ("saq" in b)
    return (
      <div className="saq">
        <span className="lbl chalk"><Bi v={b.saq.label} /></span>
        <p><Bi v={b.saq.body} /></p>
      </div>
    );
  if ("cap" in b) return <p className="cap" style={{ textAlign: "left", marginTop: 12 }}><Bi v={b.cap} /></p>;
  if ("table" in b) return <Table t={b.table} />;
  if ("fig" in b) return <Figure f={b.fig} />;
  if ("doodle" in b) return <div className="fill">{parse(b.doodle)}</div>;
  if ("html" in b) return <>{parse(b.html)}</>;
  return null;
}

function RowView({ row }: { row: Row }) {
  return (
    <div className={"row" + (row.reverse ? " r" : "")}>
      {row.blk && row.blk.length ? <div className="blk">{row.blk.map((b, i) => <BlockView key={i} b={b} />)}</div> : null}
      {row.figs?.map((f, i) => <Figure key={i} f={f} />)}
    </div>
  );
}

function Cover({ unit }: { unit: Unit }) {
  const m = unit.meta;
  const codeLine =
    m.code != null
      ? { en: m.code + (m.course ? " · " + enOf(m.course) : ""), ar: m.code + (m.course ? " · " + (typeof m.course === "string" ? m.course : m.course.ar || "") : "") }
      : null;
  return (
    <section className="sheet cover acc-pink">
      <div className="border" />
      <div className="border2" />
      <div className="wrap">
        <Raw className="ic" style={{ width: 74, height: 74, color: "var(--exam)" }} html={m.coverIcon || DEF_ICON} />
        <h1 className="ptitle chalk"><Bi v={m.title} /></h1>
        {m.subtitle ? <p style={{ fontFamily: "'Caveat',cursive", fontSize: "1.7rem", color: "var(--exam)", margin: 0 }}><Bi v={m.subtitle} /></p> : null}
        {codeLine ? <p style={{ fontFamily: "'Gochi Hand',cursive", color: "var(--muted)", margin: "2px 0 8px" }}><Bi v={codeLine} /></p> : null}
        <div className="chips">
          <span className="chip imp"><span className="en">important</span><span className="ar">مهم</span></span>
          <span className="chip exam"><span className="en">exam focus</span><span className="ar">يأتي بالامتحان</span></span>
          <span className="chip extra"><span className="en">extra note</span><span className="ar">ملاحظة إضافية</span></span>
          <span className="chip def"><span className="en">definition</span><span className="ar">تعريف</span></span>
          <span className="chip mic"><span className="en">term</span><span className="ar">مصطلح</span></span>
        </div>
      </div>
      <div className="foot">
        <span>{m.footer != null ? <Bi v={m.footer} /> : null}</span>
        <span>1</span>
      </div>
      <Tray />
    </section>
  );
}

function SheetView({ sh, idx }: { sh: Sheet; idx: number }) {
  const num = idx + 2;
  const acc = sh.accent || ACC[idx % ACC.length];
  return (
    <section className={"sheet acc-" + acc}>
      {sh.doodle ? parse(DOODLE) : null}
      <header className="phead">
        <Raw className="ic" style={sh.iconColor ? { color: sh.iconColor } : undefined} html={sh.icon || DEF_ICON} />
        <h2 className="ptitle chalk"><Bi v={sh.title} /></h2>
        <Flourish />
        <span className="pnum">{num}</span>
      </header>
      {parse(RULE)}
      {sh.wrap ? (
        <div className="wrap">{sh.wrap.map((b, i) => <BlockView key={i} b={b} />)}</div>
      ) : (
        <div className="stack">{(sh.rows || []).map((r, i) => <RowView key={i} row={r} />)}</div>
      )}
      <div className="foot">
        <Legend />
        <span>{num}</span>
      </div>
      <Tray />
    </section>
  );
}

export function LectureRenderer({ unit }: { unit: Unit }) {
  return (
    <>
      <Cover unit={unit} />
      {unit.lecture.map((sh, i) => <SheetView key={i} sh={sh} idx={i} />)}
    </>
  );
}
