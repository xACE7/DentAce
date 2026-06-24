"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Account } from "./Account";

/* Avatar button in the top bar (next to ⚙) that opens an account dropdown:
   logged out → log in / sign up form; logged in → email + Edit profile + Sign out.
   Hidden entirely when accounts aren't configured. */
export function ProfileButton() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  const place = () => {
    const b = btn.current?.getBoundingClientRect();
    if (!b) return;
    const w = 244;
    const left = Math.max(8, Math.min(b.right - w, window.innerWidth - w - 8));
    setPos({ top: Math.round(b.bottom + 6), left: Math.round(left) });
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
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

  if (!auth || !auth.enabled) return null;

  const av = auth.user ? auth.profile?.avatar_url : null;
  const initial = (auth.profile?.username || auth.user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="themewrap" ref={wrap}>
      <button
        className="site-profile"
        type="button"
        title="Account"
        aria-label="Account"
        ref={btn}
        onClick={(e) => { e.stopPropagation(); if (!open) place(); setOpen((v) => !v); }}
      >
        {auth.user ? (
          av
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="site-avatar" src={av} alt="" />
            : <span className="site-avatar ph">{initial}</span>
        ) : (
          <span className="site-avatar ph" aria-hidden>
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" />
            </svg>
          </span>
        )}
      </button>
      <div
        className="theme-menu profile-panel"
        hidden={!open}
        style={pos ? { position: "fixed", top: pos.top, left: pos.left, right: "auto", margin: 0 } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <Account onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );
}
