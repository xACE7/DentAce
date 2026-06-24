"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  // usePathname() is identical on server and client → no hydration mismatch.
  const path = usePathname() || "/";
  const mailto =
    "mailto:dentace.sa@gmail.com?subject=" +
    encodeURIComponent("DentAce error: " + path) +
    "&body=" +
    encodeURIComponent("Page: " + path + "\n\nFeedback:\n");
  return (
    <footer className="dfooter">
      <a className="foot-report" href={mailto}>
        <span className="en">⚐ Report an error</span>
        <span className="ar">⚐ بلّغ عن خطأ</span>
      </a>
      <Link className="foot-brand" href="/">
        🦷 DentAce
      </Link>
    </footer>
  );
}
