"use client";
import Link from "next/link";
import { Breadcrumbs } from "./Breadcrumbs";
import { Stats } from "./Stats";
import { Settings } from "./Settings";
import { ChalkText } from "@/lib/content/Bi";

/* The ONE shared top bar — brand · breadcrumb · stats · search · ⚙ — on every page.
   Replaces the three separate header builders in app.js/study.js/site-chrome.js. */
export function Chrome() {
  return (
    <header className="site-top">
      <Link className="site-home" href="/">
        <ChalkText>{"🦷 DentAce"}</ChalkText>
      </Link>
      <Breadcrumbs />
      <div className="site-spacer" />
      <div className="site-tools">
        <Stats />
        <Link className="site-search" href="/search" title="Search" aria-label="Search">
          <ChalkText>{"🔍"}</ChalkText>
        </Link>
        <Settings />
      </div>
    </header>
  );
}
