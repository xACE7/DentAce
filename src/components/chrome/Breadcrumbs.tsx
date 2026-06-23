"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { findYear, findSem, findSubject } from "@/lib/content/nav";
import { Bi } from "@/lib/content/Bi";
import type { Kind } from "@/lib/content/types";

const PLURAL: Record<Kind, [string, string]> = {
  lecture: ["Lectures", "المحاضرات"],
  pdf: ["PDFs", "ملفات PDF"],
  test: ["Tests", "الاختبارات"],
};
const LABEL: Record<Kind, [string, string]> = {
  lecture: ["Lecture", "محاضرة"],
  pdf: ["PDF", "PDF"],
  test: ["Test", "اختبار"],
};

function YearSem({ y, s }: { y: string; s: string }) {
  const year = findYear(y);
  const sem = findSem(year, s);
  if (!year || !sem) return null;
  return (
    <span className="crumb-yc">
      <span className="cur">
        <Bi v={{ en: year.name, ar: year.nameAr }} />
      </span>
      <span className="yr-slash">/</span>
      <details className="crumb-sw">
        <summary>
          <Bi v={{ en: sem.name, ar: sem.nameAr }} />
        </summary>
        <div className="crumb-sw-menu">
          {year.semesters.map((o) => (
            <Link key={o.id} href={`/semester/${year.id}/${o.id}`} className={o.id === sem.id ? "cur" : undefined}>
              <Bi v={{ en: o.name, ar: o.nameAr }} />
            </Link>
          ))}
        </div>
      </details>
    </span>
  );
}

function join(nodes: React.ReactNode[]): React.ReactNode {
  return nodes.map((n, i) => (
    <React.Fragment key={i}>
      {i > 0 ? <span className="sep">›</span> : null}
      {n}
    </React.Fragment>
  ));
}

export function Breadcrumbs() {
  const path = usePathname() || "/";
  const seg = path.split("/").filter(Boolean);
  const section = seg[0];

  const simple: Record<string, [string, string]> = {
    search: ["Search", "بحث"],
    dashboard: ["Progress", "التقدّم"],
    plan: ["Study plan", "خطة المذاكرة"],
  };

  let crumbs: React.ReactNode[] = [];

  if (section in simple) {
    const [en, ar] = simple[section];
    crumbs = [
      <span className="cur" key="s">
        <Bi v={{ en, ar }} />
      </span>,
    ];
  } else if (section === "semester") {
    const [, y, s] = seg;
    crumbs = [<YearSem key="ys" y={y} s={s} />];
  } else if (section === "subject") {
    const [, y, s, sub] = seg;
    const subject = findSubject(findSem(findYear(y), s), sub);
    crumbs = [
      <YearSem key="ys" y={y} s={s} />,
      <span className="cur" key="sub">
        {subject ? <Bi v={{ en: subject.name, ar: subject.nameAr }} /> : sub}
      </span>,
    ];
  } else if (section === "list") {
    const [, y, s, sub, kind] = seg as [string, string, string, string, Kind];
    const subject = findSubject(findSem(findYear(y), s), sub);
    crumbs = [
      <YearSem key="ys" y={y} s={s} />,
      <Link href={`/subject/${y}/${s}/${sub}`} key="sub">
        {subject ? <Bi v={{ en: subject.name, ar: subject.nameAr }} /> : sub}
      </Link>,
      <span className="cur" key="k">
        <Bi v={{ en: PLURAL[kind][0], ar: PLURAL[kind][1] }} />
      </span>,
    ];
  } else if (section === "lecture" || section === "test") {
    const [, y, s, sub, n] = seg;
    const kind: Kind = section === "lecture" ? "lecture" : "test";
    const subject = findSubject(findSem(findYear(y), s), sub);
    crumbs = [
      <YearSem key="ys" y={y} s={s} />,
      <Link href={`/subject/${y}/${s}/${sub}`} key="sub">
        {subject ? <Bi v={{ en: subject.name, ar: subject.nameAr }} /> : sub}
      </Link>,
      <Link href={`/list/${y}/${s}/${sub}/${kind}`} key="k">
        <Bi v={{ en: PLURAL[kind][0], ar: PLURAL[kind][1] }} />
      </Link>,
      <span className="cur" key="n">
        <Bi v={{ en: `${LABEL[kind][0]} ${n}`, ar: `${LABEL[kind][1]} ${n}` }} />
      </span>,
    ];
  }

  return <nav className="site-crumbs">{join(crumbs)}</nav>;
}
