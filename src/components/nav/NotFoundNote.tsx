import Link from "next/link";

/* Equivalent of app.js renderStartFallback — shown when a route's params don't
   resolve to a known year/semester/subject. */
export function NotFoundNote({ msg }: { msg?: string }) {
  return (
    <main className="container" id="dmain">
      <section className="section">
        <div className="empty-note">{msg || "Not found"}</div>
        <div className="board">
          <Link className="card white-glow" href="/">
            <div className="ctitle">🏠 Home · الرئيسية</div>
          </Link>
        </div>
      </section>
    </main>
  );
}
