"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { MODES, DESIGNS, type Option } from "@/lib/theme/themes";
import { Bi, Emoji } from "@/lib/content/Bi";
import { SITE } from "@/lib/site-config";
import { lectureTokens, testTokens } from "@/lib/content/nav";
import { isDone, getScore, computeStreak, lecturePath, testPath } from "@/lib/progress";
import { useProgressBump } from "@/lib/useProgressBump";

type Saver = (v: string) => Promise<{ error?: string; info?: string }>;

function EditField({ label, type, initial, placeholder, autoComplete, minLength, clearOnSave, save }: {
  label: { en: string; ar: string }; type: string; initial: string; placeholder?: string;
  autoComplete?: string; minLength?: number; clearOnSave?: boolean; save: Saver;
}) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  useEffect(() => { setV(initial); }, [initial]);
  return (
    <form className="pf-field" onSubmit={async (e) => {
      e.preventDefault();
      const val = v.trim();
      if (!val) return;
      setBusy(true); setMsg(null);
      const r = await save(val);
      setBusy(false);
      setMsg(r.error ? { text: r.error } : { ok: true, text: r.info || "Saved." });
      if (!r.error && clearOnSave) setV("");
    }}>
      <span className="pf-label"><span className="en">{label.en}</span><span className="ar">{label.ar}</span></span>
      <div className="pf-row">
        <input className="pf-input" type={type} value={v} placeholder={placeholder} autoComplete={autoComplete} minLength={minLength} onChange={(e) => setV(e.target.value)} />
        <button className="pf-save" type="submit" disabled={busy}>{busy ? "…" : <><span className="en">Save</span><span className="ar">حفظ</span></>}</button>
      </div>
      {msg ? <p className={"pf-msg" + (msg.ok ? " ok" : " err")}>{msg.text}</p> : null}
    </form>
  );
}

function Seg<T extends string>({ label, items, current, onPick }: {
  label: { en: string; ar: string }; items: Option<T>[]; current: T; onPick: (id: T) => void;
}) {
  return (
    <div className="pf-seg-wrap">
      <span className="pf-label"><span className="en">{label.en}</span><span className="ar">{label.ar}</span></span>
      <div className="pf-seg">
        {items.map((o) => (
          <button key={o.id} type="button" className={"pf-seg-btn" + (o.id === current ? " on" : "")} onClick={() => onPick(o.id)}>
            <span className="en">{o.en}</span><span className="ar">{o.ar}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScopeSelect({ label, lang, value, save }: {
  label: { en: string; ar: string }; lang: "en" | "ar"; value: string;
  save: (scope: string) => Promise<{ error?: string; info?: string }>;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [yId, sId] = (value || "").split("/");
  const year = SITE.years.find((y) => y.id === yId) || SITE.years[0];
  const sem = year.semesters.find((s) => s.id === sId) || year.semesters[0];
  const pick = async (scope: string) => {
    setBusy(true); setMsg(null);
    const r = await save(scope);
    setBusy(false);
    setMsg(r.error ? { text: r.error } : { ok: true, text: r.info || "Saved." });
  };
  return (
    <div className="pf-field">
      <span className="pf-label"><span className="en">{label.en}</span><span className="ar">{label.ar}</span></span>
      <div className="pf-row pf-scope">
        <select className="pf-input" aria-label="Year" disabled={busy} value={year.id}
          onChange={(e) => { const y = SITE.years.find((yy) => yy.id === e.target.value)!; void pick(`${y.id}/${y.semesters[0].id}`); }}>
          {SITE.years.map((y) => <option key={y.id} value={y.id}>{lang === "ar" ? y.nameAr : y.name}</option>)}
        </select>
        <select className="pf-input" aria-label="Semester" disabled={busy} value={sem.id}
          onChange={(e) => void pick(`${year.id}/${e.target.value}`)}>
          {year.semesters.map((s) => <option key={s.id} value={s.id}>{lang === "ar" ? s.nameAr : s.name}</option>)}
        </select>
      </div>
      {msg ? <p className={"pf-msg" + (msg.ok ? " ok" : " err")}>{msg.text}</p> : null}
    </div>
  );
}

const LANGS: Option<"en" | "ar">[] = [
  { id: "en", en: "English", ar: "الإنجليزية" },
  { id: "ar", en: "Arabic", ar: "العربية" },
];

export function ProfileView() {
  const auth = useAuth();
  const { mode, design, lang, setMode, setDesign, setLang } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avBusy, setAvBusy] = useState(false);
  const [avMsg, setAvMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  // study stats (live via progress bump), scoped to the year+semester chosen in Edit Account
  const bump = useProgressBump();
  const firstScope = `${SITE.years[0].id}/${SITE.years[0].semesters[0].id}`;
  const [scope, setScope] = useState(firstScope);
  // adopt the account's saved scope once the profile loads (synced via Supabase)
  useEffect(() => { const sc = auth?.profile?.scope; if (sc) setScope(sc); }, [auth?.profile?.scope]);
  const saveScope = async (s: string) => {
    setScope(s);
    return auth ? auth.updateScope(s) : { error: "Not signed in." };
  };
  const scopeLabel = useMemo(() => {
    const [yId, sId] = scope.split("/");
    const y = SITE.years.find((yy) => yy.id === yId) || SITE.years[0];
    const s = y.semesters.find((ss) => ss.id === sId) || y.semesters[0];
    return { en: `${y.name} · ${s.name}`, ar: `${y.nameAr} · ${s.nameAr}` };
  }, [scope]);
  const [st, setSt] = useState({ streak: 0, lecDone: 0, lecTot: 0, tDone: 0, avg: 0, scored: 0 });
  useEffect(() => {
    let lecDone = 0, lecTot = 0, tDone = 0, scored = 0, sum = 0;
    SITE.years.forEach((y) => y.semesters.forEach((s) => {
      if (scope !== "all" && scope !== `${y.id}/${s.id}`) return;
      s.subjects.forEach((sub) => {
        const lec = lectureTokens(y.id, s.id, sub.id); lecTot += lec.length;
        lec.forEach((t) => { if (isDone(lecturePath(y.id, s.id, sub.id, t))) lecDone++; });
        testTokens(y.id, s.id, sub.id).forEach((t) => {
          const id = testPath(y.id, s.id, sub.id, t);
          if (isDone(id)) tDone++;
          const sc = getScore(id); if (sc && sc.max) { scored++; sum += Math.round((sc.s / sc.max) * 100); }
        });
      });
    }));
    setSt({ streak: computeStreak(), lecDone, lecTot, tDone, avg: scored ? Math.round(sum / scored) : 0, scored });
  }, [bump, scope]);

  const pickAvatar = async (f: File | undefined) => {
    if (!f || !auth) return;
    setAvBusy(true); setAvMsg(null);
    const r = await auth.uploadAvatar(f);
    setAvBusy(false);
    setAvMsg(r.error ? { text: r.error } : { ok: true, text: r.info || "Saved." });
    if (fileRef.current) fileRef.current.value = "";
  };

  let body: React.ReactNode;
  if (!auth || !auth.enabled) {
    body = <p className="pf-note"><Bi v={{ en: "Accounts aren't configured.", ar: "الحسابات غير مُفعّلة." }} /></p>;
  } else if (auth.status === "loading") {
    body = <p className="pf-note">…</p>;
  } else if (!auth.user) {
    body = <p className="pf-note"><Bi v={{ en: "Open the profile button (top-right) to sign in first.", ar: "افتح زرّ الملف (أعلى اليمين) لتسجيل الدخول أوّلًا." }} /></p>;
  } else {
    const u = auth.user;
    const initial = (auth.profile?.username || u.email || "?").charAt(0).toUpperCase();
    const since = u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    body = (
      <div className="pf-wrap">
        {/* identity */}
        <div className="pf-card pf-id">
          <button className="pf-id-avatar" type="button" title="Change avatar" disabled={avBusy} onClick={() => fileRef.current?.click()}>
            {auth.profile?.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={auth.profile.avatar_url} alt="" />
              : <span className="ph">{initial}</span>}
            <span className="pf-id-cam" aria-hidden>{avBusy ? "…" : "📷"}</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickAvatar(e.target.files?.[0])} />
          <div className="pf-id-meta">
            <div className="pf-name">{auth.profile?.username || u.email?.split("@")[0]}</div>
            <div className="pf-email">{u.email}</div>
            <div className="pf-since">
              {since ? <><Bi v={{ en: "Member since", ar: "عضو منذ" }} /> {since} · </> : null}
              <span className={auth.syncing ? "" : "ok"}>{auth.syncing ? "syncing…" : "✓ synced"}</span>
            </div>
            {avMsg ? <p className={"pf-msg" + (avMsg.ok ? " ok" : " err")}>{avMsg.text}</p> : null}
          </div>
        </div>

        {/* progress stats — scoped to the year+semester chosen in Edit Account */}
        <div className="pf-card">
          <div className="pf-h-row">
            <h3 className="pf-h"><Bi v={{ en: "Your progress", ar: "تقدّمك" }} /></h3>
            <span className="pf-scope-tag"><Bi v={scopeLabel} /></span>
          </div>
          <div className="pf-stats">
            <div className="pf-stat c-streak"><span className="pf-stat-n">🔥 {st.streak}</span><span className="pf-stat-l"><Bi v={{ en: "day streak", ar: "يوم متتالٍ" }} /></span></div>
            <div className="pf-stat c-lec"><span className="pf-stat-n">📘 {st.lecDone}/{st.lecTot}</span><span className="pf-stat-l"><Bi v={{ en: "lectures", ar: "محاضرة" }} /></span></div>
            <div className="pf-stat c-test"><span className="pf-stat-n">📝 {st.tDone}</span><span className="pf-stat-l"><Bi v={{ en: "tests done", ar: "اختبار" }} /></span></div>
            <div className="pf-stat c-avg"><span className="pf-stat-n">🎯 {st.scored ? st.avg + "%" : "—"}</span><span className="pf-stat-l"><Bi v={{ en: "avg score", ar: "متوسّط" }} /></span></div>
          </div>
        </div>

        {/* edit account */}
        <div className="pf-card">
          <h3 className="pf-h"><Bi v={{ en: "Edit account", ar: "تعديل الحساب" }} /></h3>
          <EditField label={{ en: "Username", ar: "اسم المستخدم" }} type="text" initial={auth.profile?.username || ""} autoComplete="username" save={auth.updateUsername} />
          <EditField label={{ en: "Email", ar: "البريد الإلكتروني" }} type="email" initial={u.email || ""} autoComplete="email" save={auth.updateEmail} />
          <EditField label={{ en: "New password", ar: "كلمة مرور جديدة" }} type="password" initial="" placeholder="••••••" autoComplete="new-password" minLength={6} clearOnSave save={auth.updatePassword} />
          <ScopeSelect label={{ en: "Year & semester", ar: "السنة والفصل" }} lang={lang} value={scope} save={saveScope} />
        </div>

        {/* appearance */}
        <div className="pf-card">
          <h3 className="pf-h"><Bi v={{ en: "Appearance", ar: "المظهر" }} /></h3>
          <Seg label={{ en: "Mode", ar: "الوضع" }} items={MODES} current={mode} onPick={setMode} />
          <Seg label={{ en: "Design", ar: "التصميم" }} items={DESIGNS} current={design} onPick={setDesign} />
          <Seg label={{ en: "Language", ar: "اللغة" }} items={LANGS} current={lang} onPick={setLang} />
        </div>

        {/* developer (admin only) */}
        {auth.isAdmin ? (
          <div className="pf-card">
            <h3 className="pf-h"><Bi v={{ en: "Developer", ar: "المطوّر" }} /></h3>
            <div className="pf-actions">
              <Link className="pf-link" href="/members"><Emoji e="👥" /> <Bi v={{ en: "Members & access", ar: "الأعضاء والصلاحيات" }} /></Link>
              <Link className="pf-link" href="/online"><Emoji e="🟢" /> <Bi v={{ en: "Who's online", ar: "من المتّصل" }} /></Link>
            </div>
          </div>
        ) : null}

        {/* actions */}
        <div className="pf-card pf-actions">
          <Link className="pf-link" href="/plan"><Emoji e="📅" /> <Bi v={{ en: "Build a study plan", ar: "ابنِ خطة مذاكرة" }} /></Link>
          <Link className="pf-link" href="/dashboard"><Emoji e="📊" /> <Bi v={{ en: "Progress dashboard", ar: "لوحة التقدّم" }} /></Link>
          <button className="pf-signout" type="button" onClick={() => auth.signOut()}><Bi v={{ en: "Sign out", ar: "تسجيل الخروج" }} /></button>
        </div>
      </div>
    );
  }

  return (
    <main className="container pf-main" id="dmain">
      <section className="section">
        <div className="section-head bar">
          <h2><Emoji e="👤" /><Bi v={{ en: "Profile", ar: "الملف الشخصي" }} /></h2>
        </div>
        {body}
      </section>
    </main>
  );
}
