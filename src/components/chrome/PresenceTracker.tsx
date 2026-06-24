"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { setPresence, clearPresence } from "@/lib/presence";

/* Mounted globally. While signed in, reports the current page to the presence table
   (immediately on navigation + a 30s heartbeat), and clears it on leave/sign-out.
   No-op for signed-out visitors. */
export function PresenceTracker() {
  const auth = useAuth();
  const user = auth?.user;
  const pathname = usePathname();
  const name = auth?.profile?.username || user?.email || "User";

  const pageRef = useRef(pathname);
  const nameRef = useRef(name);
  useEffect(() => { pageRef.current = pathname; }, [pathname]);
  useEffect(() => { nameRef.current = name; }, [name]);

  // report immediately on sign-in and on every page change
  useEffect(() => {
    if (user) void setPresence(user.id, nameRef.current, pathname || "/");
  }, [user, pathname]);

  // heartbeat + cleanup, tied to the session
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => void setPresence(user.id, nameRef.current, pageRef.current || "/"), 30000);
    const gone = () => void clearPresence(user.id);
    window.addEventListener("pagehide", gone);
    return () => {
      clearInterval(iv);
      window.removeEventListener("pagehide", gone);
      void clearPresence(user.id);
    };
  }, [user]);

  return null;
}
