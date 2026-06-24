"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site-config";
import { subjectBase, tokensForKind, pdfItems, glowClass } from "@/lib/content/nav";
import { TITLES } from "@/lib/titles";
import { Bi, Emoji } from "@/lib/content/Bi";
import { asset } from "@/lib/asset";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { Kind } from "@/lib/content/types";

const KINDS: [Kind, string, string][] = [
  ["lecture", "Lecture", "محاضرة"],
  ["test", "Test", "اختبار"],
  ["pdf", "PDF", "PDF"],
];

export function SearchView() {
  const { lang } = useTheme();
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const query = q.trim().toLowerCase();
  const m = query.match(/(\d+)/);
  const num = m ? parseInt(m[1], 10) : null;
  const words = query.replace(/\d+/g, " ").trim().split(/\s+/).filter(Boolean);
  const hasQuery = query.length > 0;

  const sections: React.ReactNode[] = [];
  SITE.years.forEach((year) =>
    year.semesters.forEach((sem) => {
      const cards: React.ReactNode[] = [];
      sem.subjects.forEach((sub) => {
        const base = subjectBase(year, sem, sub);
        const g = glowClass(sub.color);
        const subHay = `${sub.name} ${sub.nameAr} ${sub.id} ${sub.slug || ""} ${sem.name} ${sem.nameAr} ${year.name} ${year.nameAr}`.toLowerCase();
        const subMatch = !words.length || words.every((w) => subHay.indexOf(w) !== -1);

        if (!hasQuery || subMatch) {
          cards.push(
            <Link key={`s-${sub.id}`} className={`card ${g}`} href={`/subject/${year.id}/${sem.id}/${sub.id}`}>
              <div className="ctitle"><Emoji e={sub.emoji} /><Bi v={{ en: sub.name, ar: sub.nameAr }} /></div>
            </Link>
          );
        }

        // items: search every lecture / test / pdf by its label (kind + number) AND topic subtitle.
        // num query ("ocd 13") → that number, scoped by subject; word query ("salivary") → any item whose label/subtitle matches.
        if (hasQuery) {
          KINDS.forEach(([k, en, ar]) => {
            tokensForKind(year.id, sem.id, sub.id, k).map(String).forEach((tok) => {
              const ti = TITLES[`${base}|${tok}`];
              const ownHay = `${en} ${ar} ${ti?.e || ""} ${ti?.a || ""}`.toLowerCase();
              const wordHit = words.length > 0 && words.every((w) => ownHay.indexOf(w) !== -1);
              const show = num != null
                ? tok === String(num) && (subMatch || wordHit)
                : wordHit;
              if (!show) return;
              const href = k === "pdf"
                ? pdfItems(year.id, sem.id, sub.id).find((p) => String(p.token) === tok)?.file || "#"
                : `/${k}/${year.id}/${sem.id}/${sub.id}/${tok}`;
              const inner = (
                <>
                  <div className="ctitle nowrap"><Bi v={{ en: `${en} ${tok}`, ar: `${ar} ${tok}` }} /></div>
                  {ti ? <div className="card-sub"><Bi v={{ en: ti.e || ti.a, ar: ti.a || ti.e }} /></div> : null}
                </>
              );
              cards.push(
                k === "pdf"
                  ? <a key={`i-${sub.id}-${k}-${tok}`} className={`card ${g} search-direct`} href={href === "#" ? "#" : asset(href)} target="_blank" rel="noopener noreferrer">{inner}</a>
                  : <Link key={`i-${sub.id}-${k}-${tok}`} className={`card ${g} search-direct`} href={href}>{inner}</Link>
              );
            });
          });
        }
      });
      if (cards.length)
        sections.push(
          <section className="section" key={`${year.id}-${sem.id}`}>
            <div className="section-head bar"><h2><Bi v={{ en: sem.name, ar: sem.nameAr }} /></h2></div>
            <div className="board list-board">{cards}</div>
          </section>
        );
    })
  );

  return (
    <main className="container" id="dmain">
      <div className="search-wrap">
        <input
          ref={ref}
          id="gsearch"
          className="list-search"
          type="search"
          aria-label="Search"
          autoComplete="off"
          placeholder={lang === "ar" ? "🔍 ابحث عن مادة أو محاضرة أو اختبار أو ملف… (مثال: salivary أو ocd 13)" : "🔍 Search subjects, lectures, tests, PDFs… (e.g. salivary or ocd 13)"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div id="searchResults">
        {sections.length ? sections : <div className="empty-note">{lang === "ar" ? "لا نتائج" : "No matches"}</div>}
      </div>
    </main>
  );
}
