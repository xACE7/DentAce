import Link from "next/link";
import { SITE } from "@/lib/site-config";
import { Bi } from "@/lib/content/Bi";
import { Dua } from "@/components/nav/Dua";

/* Home — each year as a section of semester cards (renderHome equivalent). */
export default function HomePage() {
  return (
    <main className="container" id="dmain">
      <section className="section">
        <Dua />
      </section>

      {SITE.years.map((year) => (
        <section className="section" key={year.id}>
          <div className="section-head bar">
            <h2>
              <Bi v={{ en: year.name, ar: year.nameAr }} />
            </h2>
          </div>
          <div className="board semester-grid">
            {year.semesters.map((sem) => (
              <Link className="card white-glow" href={`/semester/${year.id}/${sem.id}`} key={sem.id}>
                <div className="ctitle">
                  <Bi v={{ en: sem.name, ar: sem.nameAr }} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="section">
        <Dua />
      </section>
    </main>
  );
}
