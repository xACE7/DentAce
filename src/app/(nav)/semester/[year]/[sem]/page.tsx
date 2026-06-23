import { SemesterView } from "@/components/nav/SemesterView";
import { SITE } from "@/lib/site-config";

export function generateStaticParams() {
  return SITE.years.flatMap((y) => y.semesters.map((s) => ({ year: y.id, sem: s.id })));
}

export default async function Page({ params }: { params: Promise<{ year: string; sem: string }> }) {
  const { year, sem } = await params;
  return <SemesterView year={year} sem={sem} />;
}
