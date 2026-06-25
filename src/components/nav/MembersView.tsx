"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Bi, Emoji } from "@/lib/content/Bi";
import { SITE } from "@/lib/site-config";

type Member = {
  id: string; username: string; email: string | null; avatar_url: string | null;
  banned: boolean; show_pdfs: boolean; show_tests: boolean; show_lectures: boolean;
  scope: string | null; created_at: string;
};
type Pres = { page: string | null; updated_at: string };

const ONLINE_MS = 2 * 60 * 1000;

function ago(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return iso; }
}
function fmtDur(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}
type Act = { kind: string; ref: string; title: string | null; seconds: number; score: number | null; max: number | null; at: string };

export function MembersView() {
  const auth = useAuth();
  const isAdmin = !!auth?.isAdmin;
  const [members, setMembers] = useState<Member[]>([]);
  const [pres, setPres] = useState<Record<string, Pres>>({});
  const [q, setQ] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [, setTick] = useState(0); // re-render so "online / last seen" stays fresh
  const [histOpen, setHistOpen] = useState<string | null>(null);
  const [hist, setHist] = useState<Record<string, Act[]>>({});
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    if (!supabase || !isAdmin) return;
    let alive = true;
    const load = async () => {
      const { data } = await supabase!
        .from("profiles")
        .select("id, username, email, avatar_url, banned, show_pdfs, show_tests, show_lectures, scope, created_at")
        .order("created_at", { ascending: false });
      if (alive && data) {
        setMembers(data.map((m) => ({
          id: m.id, username: m.username, email: m.email, avatar_url: m.avatar_url ?? null,
          created_at: m.created_at, scope: typeof m.scope === "string" ? m.scope : null,
          banned: !!m.banned, show_pdfs: m.show_pdfs === true,
          show_tests: m.show_tests !== false, show_lectures: m.show_lectures !== false,
        })));
      }
      const { data: pd } = await supabase!.from("presence").select("user_id, page, updated_at");
      if (alive && pd) {
        const map: Record<string, Pres> = {};
        (pd as { user_id: string; page: string | null; updated_at: string }[])
          .forEach((r) => { map[r.user_id] = { page: r.page ?? null, updated_at: r.updated_at }; });
        setPres(map);
      }
      if (alive) setLoaded(true);
    };
    void load();
    const poll = setInterval(load, 15000);
    const clock = setInterval(() => setTick((t) => t + 1), 5000);
    return () => { alive = false; clearInterval(poll); clearInterval(clock); };
  }, [isAdmin]);

  // Optimistic patch of any profile field(s); reverts the whole row on failure.
  const patch = async (id: string, fields: Partial<Member>) => {
    if (!supabase) return;
    const prev = members.find((m) => m.id === id);
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...fields } : m)));
    const { error } = await supabase.from("profiles").update(fields).eq("id", id);
    if (error && prev) setMembers((ms) => ms.map((m) => (m.id === id ? prev : m)));
  };

  // Expand a member to show their activity history (lectures/tests opened, time, marks).
  const toggleHist = async (id: string) => {
    if (histOpen === id) { setHistOpen(null); return; }
    setHistOpen(id);
    if (!hist[id] && supabase) {
      setHistLoading(true);
      const { data } = await supabase.from("activity")
        .select("kind, ref, title, seconds, score, max, at")
        .eq("user_id", id).order("at", { ascending: false }).limit(60);
      setHist((h) => ({ ...h, [id]: (data as Act[]) || [] }));
      setHistLoading(false);
    }
  };

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return members;
    return members.filter((m) =>
      (m.username || "").toLowerCase().includes(t) || (m.email || "").toLowerCase().includes(t));
  }, [members, q]);

  let body: React.ReactNode;
  if (!auth?.enabled) body = <p className="pf-note"><Bi v={{ en: "Accounts aren't configured.", ar: "الحسابات غير مُفعّلة." }} /></p>;
  else if (auth.status === "loading") body = <p className="pf-note">…</p>;
  else if (!isAdmin) body = <p className="pf-note"><Bi v={{ en: "Not authorized.", ar: "غير مصرّح." }} /></p>;
  else body = (
    <div className="pf-wrap">
      <div className="pf-card">
        <div className="pf-h-row">
          <h3 className="pf-h"><Bi v={{ en: "Members", ar: "الأعضاء" }} /> <span className="ol-count">{members.length}</span></h3>
          <input className="mb-search" type="search" placeholder="🔍" aria-label="Search members" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!loaded ? (
          <p className="ol-empty">…</p>
        ) : shown.length === 0 ? (
          <p className="ol-empty"><Bi v={{ en: "No members.", ar: "لا أعضاء." }} /></p>
        ) : (
          <ul className="mb-list">
            {shown.map((m) => {
              const self = m.email === auth.user?.email;
              const p = pres[m.id];
              const online = !!p && Date.now() - new Date(p.updated_at).getTime() < ONLINE_MS;
              const [yId0, sId0] = (m.scope || "").split("/");
              const year = SITE.years.find((y) => y.id === yId0) || SITE.years[0];
              const sem = year.semesters.find((s) => s.id === sId0) || year.semesters[0];
              return (
                <li key={m.id} className={"mb-item" + (m.banned ? " banned" : "")}>
                  <div className="mb-top">
                    {m.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img className="mb-avatar" src={m.avatar_url} alt="" referrerPolicy="no-referrer" />
                      : <span className="mb-avatar mb-avatar-ph">{(m.username || "?").slice(0, 1).toUpperCase()}</span>}
                    <div className="mb-id">
                      <div className="mb-namerow">
                        <input
                          key={"nm-" + m.username} className="mb-name-input" defaultValue={m.username || ""}
                          aria-label="Username" title="Username (edit + Enter)"
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== (m.username || "")) void patch(m.id, { username: v }); }}
                        />
                        {self ? <span className="mb-you">(you)</span> : null}
                        {m.banned ? <span className="mb-badge-ban">BANNED</span> : null}
                        {online ? <span className="ol-dot" title="online" /> : null}
                      </div>
                      <div className="mb-email">{m.email || "—"}</div>
                      <div className="mb-meta">
                        <span>Joined {fmtDate(m.created_at)}</span>
                        {p
                          ? <span>· {online ? "online now" : `seen ${ago(p.updated_at)} ago`}{p.page ? ` · ${p.page}` : ""}</span>
                          : <span>· never seen</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mb-scope">
                    <span className="mb-lbl"><Bi v={{ en: "Year & sem", ar: "السنة والفصل" }} /></span>
                    <select className="pf-input mb-sel" aria-label="Year" value={year.id}
                      onChange={(e) => { const y = SITE.years.find((yy) => yy.id === e.target.value)!; void patch(m.id, { scope: `${y.id}/${y.semesters[0].id}` }); }}>
                      {SITE.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                    <select className="pf-input mb-sel" aria-label="Semester" value={sem.id}
                      onChange={(e) => void patch(m.id, { scope: `${year.id}/${e.target.value}` })}>
                      {year.semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {m.scope ? null : <span className="mb-unset">not set</span>}
                  </div>

                  <div className="mb-flags">
                    <button type="button" className={"mb-flag" + (m.show_pdfs ? " on" : "")} onClick={() => patch(m.id, { show_pdfs: !m.show_pdfs })}>PDFs</button>
                    <button type="button" className={"mb-flag" + (m.show_tests ? " on" : "")} onClick={() => patch(m.id, { show_tests: !m.show_tests })}>Tests</button>
                    <button type="button" className={"mb-flag" + (m.show_lectures ? " on" : "")} onClick={() => patch(m.id, { show_lectures: !m.show_lectures })}>Lectures</button>
                    <button type="button" className={"mb-flag mb-hist-btn" + (histOpen === m.id ? " on" : "")} onClick={() => toggleHist(m.id)}>History</button>
                    <button type="button" className={"mb-ban" + (m.banned ? " on" : "")} disabled={self} onClick={() => patch(m.id, { banned: !m.banned })}>
                      {m.banned ? "Unban" : "Ban"}
                    </button>
                  </div>

                  {histOpen === m.id ? (
                    <div className="mb-hist">
                      {histLoading && !hist[m.id] ? (
                        <p className="mb-hist-empty">…</p>
                      ) : hist[m.id]?.length ? (
                        <ul className="mb-hist-list">
                          {hist[m.id].map((a, i) => (
                            <li key={i} className="mb-hist-row">
                              <span className="mb-hist-ico">{a.kind === "test" ? "📝" : "📘"}</span>
                              <span className="mb-hist-title">{a.title || a.ref}</span>
                              {a.kind === "test" && a.max ? <span className="mb-hist-score">{a.score}/{a.max} · {Math.round(((a.score || 0) / a.max) * 100)}%</span> : null}
                              <span className="mb-hist-dur">⏱ {fmtDur(a.seconds)}</span>
                              <span className="mb-hist-when">{ago(a.at)} ago</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-hist-empty"><Bi v={{ en: "No activity recorded yet.", ar: "لا نشاط مُسجّل بعد." }} /></p>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <p className="ol-foot"><Bi v={{ en: "Edit username, year/semester, content toggles or ban here. Email & password are managed by each member (auth). Content files stay publicly reachable by direct URL (static hosting).", ar: "عدّل اسم المستخدم والسنة/الفصل ومفاتيح المحتوى أو الحظر من هنا. البريد وكلمة المرور يديرهما العضو نفسه. وتبقى ملفات المحتوى قابلة للوصول برابط مباشر (استضافة ثابتة)." }} /></p>
      </div>
    </div>
  );

  return (
    <main className="container pf-main" id="dmain">
      <section className="section">
        <div className="section-head bar">
          <h2><Emoji e="👥" /><Bi v={{ en: "Members", ar: "الأعضاء" }} /></h2>
        </div>
        {body}
      </section>
    </main>
  );
}
