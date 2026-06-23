"use client";
import { useEffect } from "react";

/* Service worker DISABLED for now — a stale one was caching pages and CSS, which made edits
   never show up. This actively unregisters any existing worker so the browser always talks
   straight to the server. (Re-enable a proper SW later, once the app is stable.) */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  }, []);
  return null;
}
