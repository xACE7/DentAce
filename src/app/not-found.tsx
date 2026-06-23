/* 404 — lives outside the route groups, so it loads the nav chain itself. */
import "@/styles/style.css";
import "@/styles/themes.css";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" id="dmain" style={{ textAlign: "center", padding: "54px 16px 80px" }}>
      <div style={{ fontFamily: "'Permanent Marker','Gochi Hand',cursive", fontSize: "clamp(4.5rem,20vw,9rem)", fontWeight: 900, color: "var(--hl)", lineHeight: 1 }}>404</div>
      <p style={{ fontSize: "1.3rem", margin: "8px 0 2px" }}>This page wandered off 🦷</p>
      <p style={{ color: "var(--muted)", fontSize: "1.15rem", margin: "0 0 26px" }}>الصفحة الي تدوّر عليها مو موجودة</p>
      <div className="board" style={{ maxWidth: 520, margin: "0 auto" }}>
        <Link className="card white-glow" href="/">
          <div className="ctitle">🏠 Home · الرئيسية</div>
        </Link>
        <Link className="card white-glow" href="/search">
          <div className="ctitle">🔍 Search · بحث</div>
        </Link>
      </div>
    </main>
  );
}
