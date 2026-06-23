"use client";
import React from "react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { renderInline } from "./inline";
import type { Bilingual } from "./types";

export function enOf(v: Bilingual): string { return typeof v === "string" ? v : v.en ?? ""; }
export function arOf(v: Bilingual): string { return typeof v === "string" ? "" : v.ar ?? v.en ?? ""; }

/* Mirror of render.js bi(): a string → only an .en span; an object → .en + .ar spans
   (CSS .lang-en/.lang-ar shows the active one). Inline markup + chalk icons handled. */
export function Bi({ v }: { v: Bilingual }) {
  const { paperActive } = useTheme();
  if (typeof v === "string") return <span className="en">{renderInline(v, paperActive)}</span>;
  return (
    <>
      <span className="en">{renderInline(v.en ?? "", paperActive)}</span>
      <span className="ar">{renderInline(v.ar ?? v.en ?? "", paperActive)}</span>
    </>
  );
}

/* Plain (non-bilingual) label that still gets chalk icons in Paper. */
export function ChalkText({ children }: { children: string }) {
  const { paperActive } = useTheme();
  return <>{renderInline(children, paperActive)}</>;
}

/* Leading emoji (e.g. a subject's), chalkified in Paper when it maps. */
export function Emoji({ e }: { e?: string | null }) {
  const { paperActive } = useTheme();
  if (!e) return null;
  return <>{renderInline(e + " ", paperActive)}</>;
}
