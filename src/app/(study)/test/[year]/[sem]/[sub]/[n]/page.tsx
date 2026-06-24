import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadQuiz, listParams } from "@/lib/content/loader";
import { QuizEngine } from "@/components/quiz/QuizEngine";
import { StudyGate } from "@/components/content/StudyGate";

export async function generateStaticParams() {
  return listParams("test");
}

export async function generateMetadata({ params }: { params: Promise<{ year: string; sem: string; sub: string; n: string }> }): Promise<Metadata> {
  const { year, sem, sub, n } = await params;
  const quiz = await loadQuiz(year, sem, sub, n);
  if (!quiz) return {};
  const title = quiz.title || "Test";
  const description = quiz.src || "Dentistry self-test";
  return {
    title,
    description,
    openGraph: { type: "article", title: `${title} — DentAce`, description, images: ["/og.png"] },
    twitter: { card: "summary_large_image", title: `${title} — DentAce`, description, images: ["/og.png"] },
  };
}

export default async function Page({ params }: { params: Promise<{ year: string; sem: string; sub: string; n: string }> }) {
  const { year, sem, sub, n } = await params;
  const quiz = await loadQuiz(year, sem, sub, n);
  if (!quiz) notFound();
  return (
    <StudyGate kind="test">
      <QuizEngine quiz={quiz} year={year} sem={sem} sub={sub} n={n} />
    </StudyGate>
  );
}
