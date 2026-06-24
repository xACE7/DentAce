"use client";
import { useAuth } from "@/lib/auth/AuthProvider";

/* Full-screen block shown to a signed-in member whose account was suspended. */
export function BanGate() {
  const auth = useAuth();
  if (!auth || !auth.banned) return null;
  return (
    <div className="ban-gate" role="alertdialog" aria-modal="true">
      <div className="ban-card">
        <div className="ban-emoji">🚫</div>
        <h2 className="ban-title">Account suspended</h2>
        <p className="ban-text">Your access has been restricted by the administrator.</p>
        <button className="pf-signout" type="button" onClick={() => auth.signOut()}>Sign out</button>
      </div>
    </div>
  );
}
