"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { MODES, DESIGNS, type Option } from "@/lib/theme/themes";
import { ChalkText } from "@/lib/content/Bi";

function Grid<T extends string>({
  items,
  current,
  onPick,
}: {
  items: Option<T>[];
  current: T;
  onPick: (id: T) => void;
}) {
  return (
    <div className="set-grid">
      {items.map((o) => (
        <button
          key={o.id}
          type="button"
          className={"theme-opt" + (o.id === current ? " active" : "")}
          onClick={() => onPick(o.id)}
        >
          <span className="en">
            <ChalkText>{o.en}</ChalkText>
          </span>
          <span className="ar">
            <ChalkText>{o.ar}</ChalkText>
          </span>
        </button>
      ))}
    </div>
  );
}

/* The ⚙ settings: language toggle + gear + Mode/Design panel + plan link.
   Markup matches site-chrome.js (.themewrap > .site-lang + .themebtn + .theme-menu.settings-panel). */
export function Settings() {
  const { design, mode, lang, setDesign, setMode, setLang } = useTheme();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  // Place the panel just below the ⚙, clamped to the viewport. The header wraps on
  // tablets/laptops (long breadcrumb), so the gear can land anywhere — this keeps the
  // panel attached to it AND fully on-screen no matter where it is.
  const place = () => {
    const b = btn.current?.getBoundingClientRect();
    if (!b) return;
    const w = 236;
    const left = Math.max(8, Math.min(b.right - w, window.innerWidth - w - 8));
    setPos({ top: Math.round(b.bottom + 6), left: Math.round(left) });
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const reposition = () => place();
    document.addEventListener("click", onDoc);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("click", onDoc);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  return (
    <div className="themewrap" ref={wrap}>
      <button
        className="site-lang"
        type="button"
        title="Language"
        aria-label="Switch language"
        onClick={(e) => {
          e.stopPropagation();
          setLang(lang === "ar" ? "en" : "ar");
        }}
      >
        {lang === "ar" ? "AR" : "EN"}
      </button>
      <button
        className="themebtn"
        type="button"
        title="Settings"
        aria-label="Settings"
        ref={btn}
        onClick={(e) => {
          e.stopPropagation();
          if (!open) place();
          setOpen((v) => !v);
        }}
      >
        <ChalkText>⚙</ChalkText>
      </button>
      <div
        className="theme-menu settings-panel"
        hidden={!open}
        style={pos ? { position: "fixed", top: pos.top, left: pos.left, right: "auto", margin: 0 } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="set-label">
          <span className="en">Mode</span>
          <span className="ar">الوضع</span>
        </div>
        <Grid items={MODES} current={mode} onPick={setMode} />
        <div className="set-label">
          <span className="en">Design</span>
          <span className="ar">التصميم</span>
        </div>
        <Grid items={DESIGNS} current={design} onPick={setDesign} />
        <Link className="set-link" href="/plan">
          <span className="en">
            <ChalkText>{"📅 Build a study plan"}</ChalkText>
          </span>
          <span className="ar">
            <ChalkText>{"📅 خطة مذاكرة"}</ChalkText>
          </span>
        </Link>
      </div>
    </div>
  );
}
