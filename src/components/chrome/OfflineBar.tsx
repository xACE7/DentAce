"use client";
import { useEffect, useState } from "react";

export function OfflineBar() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const upd = () => setOnline(navigator.onLine);
    upd();
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    return () => {
      window.removeEventListener("online", upd);
      window.removeEventListener("offline", upd);
    };
  }, []);
  return (
    <div className="offline-bar" aria-live="polite" hidden={online}>
      <span className="en">⚡ Offline — saved pages still work</span>
      <span className="ar">⚡ بدون اتصال — الصفحات المحفوظة تشتغل</span>
    </div>
  );
}
