import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadUnit, listParams } from "@/lib/content/loader";
import { LectureView } from "@/components/content/LectureView";
import type { Bilingual } from "@/lib/content/types";

/* An extra is authored in the lecture shape and rendered by the lecture view, so
   this route mirrors the lecture route and only points the loader at extra/. */

export async function generateStaticParams() {
  return listParams("extra");
}

const en = (b?: Bilingual) => (b == null ? "" : typeof b === "string" ? b : b.en || "");
const clean = (s: string) =>
  s.replace(/\[br\]/g, " ").replace(/\[\/?(?:imp|exam|extra|def|mic|b|u|r)\]/g, "").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: { params: Promise<{ year: string; sem: string; sub: string; n: string }> }): Promise<Metadata> {
  const { year, sem, sub, n } = await params;
  const unit = await loadUnit(year, sem, sub, n, "extra");
  if (!unit) return {};
  const m = unit.meta;
  const title = clean([m.code, en(m.title)].filter(Boolean).join(" — ")) || "Extra";
  const description = clean(en(m.subtitle) || en(m.course) || "Dentistry study material") || undefined;
  return {
    title,
    description,
    openGraph: { type: "article", title: `${title} — DentAce`, description, images: ["/og.png"] },
    twitter: { card: "summary_large_image", title: `${title} — DentAce`, description, images: ["/og.png"] },
  };
}

export default async function Page({ params }: { params: Promise<{ year: string; sem: string; sub: string; n: string }> }) {
  const { year, sem, sub, n } = await params;
  const unit = await loadUnit(year, sem, sub, n, "extra");
  if (!unit) notFound();
  return <LectureView unit={unit} year={year} sem={sem} sub={sub} n={n} kind="extra" />;
}
