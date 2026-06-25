"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  findYear, findSem, findSubject, subjectBase, tokensForKind, pdfItems, isPractical, glowClass,
} from "@/lib/content/nav";
import { isDone, lecturePath, testPath, celebratedOnce } from "@/lib/progress";
import { useProgressBump } from "@/lib/useProgressBump";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TITLES } from "@/lib/titles";
import { Bi, Emoji } from "@/lib/content/Bi";
import { Dua } from "./Dua";
import { NotFoundNote } from "./NotFoundNote";
import { confetti } from "@/lib/confetti";
import { openPdf } from "@/lib/pdf";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { Token } from "@/lib/content/contentIndex";
import type { Kind } from "@/lib/content/types";

const PLURAL: Record<Kind, [string, string]> = {
  lecture: ["Lectures", "المحاضرات"], pdf: ["PDFs", "ملفات PDF"], test: ["Tests", "الاختبارات"],
};
const LABEL: Record<Kind, [string, string]> = {
  lecture: ["Lecture", "محاضرة"], pdf: ["PDF", "PDF"], test: ["Test", "اختبار"],
};
const PRACTICAL: [string, string] = ["Practical", "عملي"];

type Item = { token: Token; href: string; isLecture: boolean; labelEn: string; labelAr: string; topicEn: string; topicAr: string; search: string };

export function ListView({ year: yId, sem: sId, sub: subId, kind }: { year: string; sem: string; sub: string; kind: Kind }) {
  const { lang } = useTheme();
  const auth = useAuth();
  const year = findYear(yId);
  const sem = findSem(year, sId);
  const sub = findSubject(sem, subId);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [filt, setFilt] = useState<"all" | "todo" | "done">("all");
  // PDFs are served from the private Supabase 'pdfs' bucket, not the repo. List the
  // bucket at runtime so cards show in production (where the files aren't in git);
  // the on-disk index is only a local fallback. null = not loaded → use the index.
  const [bucketPdfs, setBucketPdfs] = useState<{ token: string; file: string }[] | null>(null);
  const bump = useProgressBump();

  useEffect(() => {
    setBucketPdfs(null);
    if (kind !== "pdf" || !supabase || !year || !sem || !sub) return;
    let alive = true;
    const folder = `${subjectBase(year, sem, sub)}/pdf`;
    (async () => {
      const { data, error } = await supabase!.storage.from("pdfs")
        .list(folder, { limit: 1000, sortBy: { column: "name", order: "asc" } });
      if (!alive || error || !data) return;
      const rows = data
        .filter((f) => f.name.toLowerCase().endsWith(".pdf"))
        .map((f) => ({ token: f.name.match(/-([\d-]+)\.pdf$/i)?.[1] ?? f.name.replace(/\.pdf$/i, ""), file: `/${folder}/${f.name}` }))
        .sort((a, b) => (parseInt(a.token) || 0) - (parseInt(b.token) || 0) || a.token.localeCompare(b.token));
      if (rows.length) setBucketPdfs(rows);
    })();
    return () => { alive = false; };
  }, [kind, year, sem, sub]);

  const items: Item[] = useMemo(() => {
    if (!year || !sem || !sub) return [];
    const base = subjectBase(year, sem, sub);
    const rows: { token: Token; file?: string }[] =
      kind === "pdf"
        ? (bucketPdfs ?? pdfItems(year.id, sem.id, sub.id)).map((p) => ({ token: p.token, file: p.file }))
        : tokensForKind(year.id, sem.id, sub.id, kind).map((token) => ({ token }));
    return rows.map(({ token, file }) => {
      const isNum = typeof token === "number" || /^\d+$/.test(String(token));
      const prac = isNum && isPractical(sub.practical, kind, parseInt(String(token), 10));
      const labelEn = `${LABEL[kind][0]} ${token}${prac ? " (Practical)" : ""}`;
      const labelAr = `${LABEL[kind][1]} ${token}${prac ? ` (${PRACTICAL[1]})` : ""}`;
      const href =
        kind === "pdf" ? file || "#"
        : kind === "lecture" ? `/lecture/${year.id}/${sem.id}/${sub.id}/${token}`
        : `/test/${year.id}/${sem.id}/${sub.id}/${token}`;
      const ti = TITLES[`${base}|${token}`];
      const topicEn = ti ? ti.e || ti.a : "";
      const topicAr = ti ? ti.a || ti.e : "";
      return {
        token, href, isLecture: kind === "lecture", labelEn, labelAr, topicEn, topicAr,
        search: `${labelEn} ${labelAr} ${topicEn} ${topicAr}`.toLowerCase(),
      };
    });
  }, [year, sem, sub, kind, bucketPdfs]);

  useEffect(() => {
    if (!year || !sem || !sub) return;
    const d: Record<string, boolean> = {};
    if (kind === "lecture")
      items.forEach((it) => { d[String(it.token)] = isDone(lecturePath(year.id, sem.id, sub.id, it.token)); });
    else if (kind === "test")
      items.forEach((it) => { d[String(it.token)] = isDone(testPath(year.id, sem.id, sub.id, it.token)); });
    setDone(d);
  }, [items, year, sem, sub, kind, bump]);

  const doneCount = items.filter((it) => done[String(it.token)]).length;

  useEffect(() => {
    if (!year || !sem || !sub) return;
    if (items.length > 0 && kind === "lecture" && doneCount === items.length) {
      const base = subjectBase(year, sem, sub);
      if (!celebratedOnce(`${base}|${kind}`)) confetti();
    }
  }, [doneCount, items.length, kind, year, sem, sub]);

  if (!year || !sem || !sub) return <NotFoundNote msg="Open the list from a subject card." />;

  // per-member content visibility (admin/guests see everything)
  const hidden =
    (kind === "pdf" && auth?.flags.pdfs === false) ||
    (kind === "test" && auth?.flags.tests === false) ||
    (kind === "lecture" && auth?.flags.lectures === false);
  if (hidden) {
    return (
      <main className="container" id="dmain">
        <section className="section">
          <div className="empty-note">
            <Bi v={{ en: `${PLURAL[kind][0]} aren't available for your account.`, ar: `${PLURAL[kind][1]} غير متاحة لحسابك.` }} />
          </div>
        </section>
      </main>
    );
  }

  const g = glowClass(sub.color);
  const ph = lang === "ar" ? `بحث في ${PLURAL[kind][1]}` : `Search ${PLURAL[kind][0]}`;

  const visible = (it: Item) => {
    const isd = !!done[String(it.token)];
    const matchQ = !q || it.search.indexOf(q.trim().toLowerCase()) !== -1;
    const matchF = filt === "all" || (filt === "done" && isd) || (filt === "todo" && !isd);
    return matchQ && matchF;
  };

  return (
    <main className="container" id="dmain">
      <section className="section">
        <Dua />
      </section>
      <section className="section">
        <div className="section-head bar" style={{ ["--bar-glow" as string]: `var(--glow-${sub.color || "pink"})` }}>
          <h2>
            <Emoji e={sub.emoji} />
            <Bi v={{ en: sub.name, ar: sub.nameAr }} /> — <Bi v={{ en: PLURAL[kind][0], ar: PLURAL[kind][1] }} />
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="empty-note">
            <Bi v={{ en: `No ${PLURAL[kind][0]} yet.`, ar: `لا يوجد ${PLURAL[kind][1]} بعد.` }} />
          </div>
        ) : (
          <>
            <div className="list-tools">
              <input
                className="list-search"
                type="search"
                aria-label="Search"
                placeholder={`🔍 ${ph}…`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <div className="list-filter" role="group">
                {(["all", "todo", "done"] as const).map((f) => (
                  <button key={f} className={"lf-btn" + (filt === f ? " active" : "")} type="button" onClick={() => setFilt(f)}>
                    <Bi v={{ en: f === "all" ? "All" : f === "todo" ? "To do" : "Done", ar: f === "all" ? "الكل" : f === "todo" ? "المتبقّي" : "المنجز" }} />
                  </button>
                ))}
              </div>
              <span className="list-progress">
                {doneCount}/{items.length} <Bi v={{ en: "done", ar: "منجز" }} />
              </span>
            </div>

            <div className="board list-board" id="board">
              {items.map((it) => {
                const isd = !!done[String(it.token)];
                const card = (
                  <>
                    {isd ? <span className="done-badge">✓</span> : null}
                    <div className="ctitle nowrap">
                      <Bi v={{ en: it.labelEn, ar: it.labelAr }} />
                    </div>
                    {it.topicEn ? (
                      <div className="card-sub">
                        <Bi v={{ en: it.topicEn, ar: it.topicAr }} />
                      </div>
                    ) : null}
                  </>
                );
                const cls = `card ${g}${isd ? " is-done" : ""}`;
                return kind === "pdf" ? (
                  <a key={String(it.token)} className={cls} hidden={!visible(it)} role="button" tabIndex={0} style={{ cursor: "pointer" }}
                    onClick={(e) => { e.preventDefault(); if (it.href !== "#") void openPdf(it.href); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (it.href !== "#") void openPdf(it.href); } }}>
                    {card}
                  </a>
                ) : (
                  <Link key={String(it.token)} className={cls} href={it.href} hidden={!visible(it)}>
                    {card}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
      <section className="section">
        <Dua />
      </section>
    </main>
  );
}
