"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

/* Account section in the ⚙ settings panel: email + password (log in / sign up),
   with email verification on first sign-up. Hidden when Supabase isn't configured. */
function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Wrong email or password.";
  if (m.includes("not confirmed")) return "Verify your email first — check your inbox.";
  if (m.includes("already registered") || m.includes("already exists")) return "That email already has an account — log in instead.";
  if (m.includes("at least") && m.includes("character")) return "Password must be at least 6 characters.";
  return msg;
}

export function Account({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [verify, setVerify] = useState(false);

  if (!auth || !auth.enabled) return null;

  const label =
    mode === "in"
      ? { en: "Account — log in", ar: "الحساب — تسجيل الدخول" }
      : { en: "Account — sign up", ar: "الحساب — إنشاء حساب" };

  return (
    <>
      <div className="set-label">
        <span className="en">{label.en}</span>
        <span className="ar">{label.ar}</span>
      </div>

      {auth.status === "loading" ? (
        <p className="acct-note">…</p>
      ) : auth.user ? (
        <div className="acct">
          <div className="acct-row">
            <span className="acct-email" title={auth.user.email}>{auth.profile?.username || auth.user.email}</span>
            <span className={"acct-sync" + (auth.syncing ? "" : " ok")}>{auth.syncing ? "syncing…" : "✓ synced"}</span>
          </div>
          <Link className="acct-btn" href="/profile" onClick={() => onNavigate?.()}>
            <span className="en">✎ Edit profile</span><span className="ar">✎ تعديل الملف</span>
          </Link>
          <button className="acct-btn" type="button" onClick={() => auth.signOut()}>
            <span className="en">Sign out</span><span className="ar">تسجيل الخروج</span>
          </button>
        </div>
      ) : verify ? (
        <p className="acct-note">
          <span className="en">✉ Check your email to verify your account, then log in. <b>If you don&apos;t see it, look in your Spam folder</b> and mark it &quot;Not spam&quot;.</span>
          <span className="ar">✉ تفقّد بريدك لتأكيد حسابك، ثمّ سجّل الدخول. <b>وإن لم تجده، تفقّد مجلّد الرسائل غير المرغوبة (Spam)</b> وعلّمه «ليس مزعجًا».</span>
        </p>
      ) : (
        <form
          className="acct"
          onSubmit={async (e) => {
            e.preventDefault();
            const em = email.trim();
            if (!em || !pw || (mode === "up" && !username.trim())) return;
            setBusy(true);
            setErr("");
            const r: { error?: string; verify?: boolean } =
              mode === "in" ? await auth.logIn(em, pw) : await auth.signUp(em, pw, username.trim());
            setBusy(false);
            if (r.error) { setErr(friendly(r.error)); return; }
            if (mode === "up" && r.verify) { setVerify(true); return; }
            setPw(""); // signed in (handled by auth state change)
          }}
        >
          <input
            className="acct-input"
            type={mode === "in" ? "text" : "email"}
            required
            autoComplete={mode === "in" ? "username" : "email"}
            placeholder={mode === "in" ? "Email or username" : "you@email.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode === "up" ? (
            <input
              className="acct-input"
              type="text"
              required
              autoComplete="username"
              pattern="[A-Za-z0-9_]{3,20}"
              title="3–20 letters, numbers or underscore"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          ) : null}
          <input
            className="acct-input"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            placeholder={mode === "in" ? "Password" : "Password (6+ characters)"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button className="acct-btn" type="submit" disabled={busy}>
            {busy ? "…" : mode === "in"
              ? <><span className="en">Log in</span><span className="ar">دخول</span></>
              : <><span className="en">Sign up</span><span className="ar">إنشاء حساب</span></>}
          </button>
          {err ? <p className="acct-err">{err}</p> : null}
          <button
            className="acct-switch"
            type="button"
            onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }}
          >
            {mode === "in"
              ? <><span className="en">New here? Create an account</span><span className="ar">جديد؟ أنشئ حسابًا</span></>
              : <><span className="en">Have an account? Log in</span><span className="ar">لديك حساب؟ سجّل الدخول</span></>}
          </button>
        </form>
      )}
    </>
  );
}
