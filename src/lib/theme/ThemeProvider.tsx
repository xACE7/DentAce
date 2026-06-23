"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  DEFAULTS, STORAGE, normDesign, normMode, normTheme, normLang,
  type DesignId, type ModeId, type ThemeId,
} from "./themes";

type Lang = "en" | "ar";
type Ctx = {
  mounted: boolean;
  design: DesignId;
  mode: ModeId;
  theme: ThemeId;
  lang: Lang;
  paperActive: boolean; // mounted && design === "paper" — gates chalk-icon rendering
  setDesign: (d: DesignId) => void;
  setMode: (m: ModeId) => void;
  setTheme: (t: ThemeId) => void;
  setLang: (l: Lang) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Deterministic initial state (matches SSR) → no hydration mismatch; real values applied on mount.
  const [mounted, setMounted] = useState(false);
  const [design, setDesignState] = useState<DesignId>(DEFAULTS.design);
  const [mode, setModeState] = useState<ModeId>(DEFAULTS.mode);
  const [theme, setThemeState] = useState<ThemeId>(DEFAULTS.theme);
  const [lang, setLangState] = useState<Lang>(DEFAULTS.lang);

  useEffect(() => {
    const el = document.documentElement;
    setDesignState(normDesign(el.getAttribute("data-design") ?? read(STORAGE.design)));
    setModeState(normMode(el.getAttribute("data-mode") ?? read(STORAGE.mode)));
    setThemeState(normTheme(el.getAttribute("data-theme") ?? read(STORAGE.theme)));
    setLangState(normLang(el.getAttribute("data-lang") ?? read(STORAGE.lang)));
    el.classList.add("has-topbar");
    setMounted(true);
  }, []);

  // Reflect each piece of state onto the document + localStorage (same keys as the old site).
  useEffect(() => { if (mounted) { document.documentElement.setAttribute("data-design", design); write(STORAGE.design, design); } }, [design, mounted]);
  useEffect(() => { if (mounted) { document.documentElement.setAttribute("data-mode", mode); write(STORAGE.mode, mode); } }, [mode, mounted]);
  useEffect(() => { if (mounted) { document.documentElement.setAttribute("data-theme", theme); write(STORAGE.theme, theme); } }, [theme, mounted]);
  useEffect(() => {
    document.documentElement.setAttribute("data-lang", lang);
    document.body.classList.toggle("lang-ar", lang === "ar");
    document.body.classList.toggle("lang-en", lang !== "ar");
    if (mounted) write(STORAGE.lang, lang);
  }, [lang, mounted]);

  const setDesign = useCallback((d: DesignId) => setDesignState(d), []);
  const setMode = useCallback((m: ModeId) => setModeState(m), []);
  const setTheme = useCallback((t: ThemeId) => setThemeState(t), []);
  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const value: Ctx = {
    mounted, design, mode, theme, lang,
    paperActive: mounted && design === "paper",
    setDesign, setMode, setTheme, setLang,
  };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}
