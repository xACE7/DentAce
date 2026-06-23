/* Lecture/test stylesheet chain — imported DIRECTLY (not via CSS @import) so Turbopack bundles
   and hot-reloads every file. Order = the old study.css cascade, flattened. */
import "@/styles/chrome.css";
import "@/styles/lecture/tokens.css";
import "@/styles/lecture/base.css";
import "@/styles/lecture/header.css";
import "@/styles/lecture/lecture-nav.css";
import "@/styles/lecture/sheet.css";
import "@/styles/lecture/head.css";
import "@/styles/lecture/text.css";
import "@/styles/lecture/recall.css";
import "@/styles/lecture/callout.css";
import "@/styles/lecture/table-figure.css";
import "@/styles/lecture/layout.css";
import "@/styles/lecture/deco.css";
import "@/styles/lecture/cover.css";
import "@/styles/lecture/quiz.css";
import "@/styles/lecture/reveal.css";
import "@/styles/lecture/responsive.css";
import "@/styles/themes.css";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
