"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  findYear, findSem, findSubject, subjectBase, tokensForKind, pdfItems, isPractical, glowClass,
} from "@/lib/content/nav";
import { isDone, lecturePath, celebratedOnce } from "@/lib/progress";
import { TITLES } from "@/lib/titles";
import { Bi, Emoji } from "@/lib/content/Bi";
import { Dua } from "./Dua";
import { NotFoundNote } from "./NotFoundNote";
import { confetti } from "@/lib/confetti";
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
  const year = findYear(yId);
  const sem = findSem(year, sId);
  const sub = findSubject(sem, subId);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [filt, setFilt] = useState<"all" | "todo" | "done">("all");

  const items: Item[] = useMemo(() => {
    if (!year || !sem || !sub) return [];
    const base = subjectBase(year, sem, sub);
    const pmap = kind === "pdf" ? new Map(pdfItems(year.id, sem.id, sub.id).map((p) => [String(p.token), p.file])) : null;
    return tokensForKind(year.id, sem.id, sub.id, kind).map((token) => {
      const isNum = typeof token === "number" || /^\d+$/.test(String(token));
      const prac = isNum && isPractical(sub.practical, kind, parseInt(String(token), 10));
      const labelEn = `${LABEL[kind][0]} ${token}${prac ? " (Practical)" : ""}`;
      const labelAr = `${LABEL[kind][1]} ${token}${prac ? ` (${PRACTICAL[1]})` : ""}`;
      const href =
        kind === "pdf" ? pmap!.get(String(token)) || "#"
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
  }, [year, sem, sub, kind]);

  useEffect(() => {
    if (!year || !sem || !sub) return;
    const d: Record<string, boolean> = {};
    if (kind === "lecture")
      items.forEach((it) => { d[String(it.token)] = isDone(lecturePath(year.id, sem.id, sub.id, it.token)); });
    setDone(d);
  }, [items, year, sem, sub, kind]);

  const doneCount = items.filter((it) => done[String(it.token)]).length;

  useEffect(() => {
    if (!year || !sem || !sub) return;
    if (items.length > 0 && kind === "lecture" && doneCount === items.length) {
      const base = subjectBase(year, sem, sub);
      if (!celebratedOnce(`${base}|${kind}`)) confetti();
    }
  }, [doneCount, items.length, kind, year, sem, sub]);

  if (!year || !sem || !sub) return <NotFoundNote msg="Open the list from a subject card." />;

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
                  <a key={String(it.token)} className={cls} href={it.href} hidden={!visible(it)} target="_blank" rel="noopener noreferrer">
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
