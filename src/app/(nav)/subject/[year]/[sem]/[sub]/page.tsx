import { SubjectView } from "@/components/nav/SubjectView";
import { SITE } from "@/lib/site-config";

export function generateStaticParams() {
  return SITE.years.flatMap((y) => y.semesters.flatMap((s) => s.subjects.map((sub) => ({ year: y.id, sem: s.id, sub: sub.id }))));
}

export default async function Page({ params }: { params: Promise<{ year: string; sem: string; sub: string }> }) {
  const { year, sem, sub } = await params;
  return <SubjectView year={year} sem={sem} sub={sub} />;
}
