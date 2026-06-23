import { ListView } from "@/components/nav/ListView";
import type { Kind } from "@/lib/content/types";
import { SITE } from "@/lib/site-config";

export function generateStaticParams() {
  const kinds = ["pdf", "lecture", "test"];
  return SITE.years.flatMap((y) =>
    y.semesters.flatMap((s) => s.subjects.flatMap((sub) => kinds.map((kind) => ({ year: y.id, sem: s.id, sub: sub.id, kind }))))
  );
}

export default async function Page({ params }: { params: Promise<{ year: string; sem: string; sub: string; kind: string }> }) {
  const { year, sem, sub, kind } = await params;
  const k: Kind = kind === "pdf" || kind === "test" ? kind : "lecture";
  return <ListView year={year} sem={sem} sub={sub} kind={k} />;
}
