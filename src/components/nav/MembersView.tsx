"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Bi, Emoji } from "@/lib/content/Bi";

type Member = {
  id: string; username: string; email: string | null; banned: boolean;
  show_pdfs: boolean; show_tests: boolean; show_lectures: boolean; created_at: string;
};
type BoolKey = "banned" | "show_pdfs" | "show_tests" | "show_lectures";

export function MembersView() {
  const auth = useAuth();
  const isAdmin = !!auth?.isAdmin;
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supabase || !isAdmin) return;
    let alive = true;
    (async () => {
      const { data } = await supabase!
        .from("profiles")
        .select("id, username, email, banned, show_pdfs, show_tests, show_lectures, created_at")
        .order("created_at", { ascending: false });
      if (alive && data) {
        setMembers(data.map((m) => ({
          id: m.id, username: m.username, email: m.email, created_at: m.created_at,
          banned: !!m.banned, show_pdfs: m.show_pdfs === true, show_tests: m.show_tests !== false, show_lectures: m.show_lectures !== false,
        })));
      }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, [isAdmin]);

  const toggle = async (id: string, key: BoolKey, value: boolean) => {
    if (!supabase) return;
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, [key]: value } : m))); // optimistic
    const { error } = await supabase.from("profiles").update({ [key]: value }).eq("id", id);
    if (error) setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, [key]: !value } : m))); // revert on failure
  };

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return members;
    return members.filter((m) => (m.username || "").toLowerCase().includes(t) || (m.email || "").toLowerCase().includes(t));
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
              return (
                <li key={m.id} className={"mb-item" + (m.banned ? " banned" : "")}>
                  <div className="mb-head">
                    <span className="mb-name">{m.username || "—"}{self ? <span className="mb-you"> (you)</span> : null}</span>
                    <span className="mb-email">{m.email}</span>
                  </div>
                  <div className="mb-flags">
                    <button type="button" className={"mb-flag" + (m.show_pdfs ? " on" : "")} onClick={() => toggle(m.id, "show_pdfs", !m.show_pdfs)}>PDFs</button>
                    <button type="button" className={"mb-flag" + (m.show_tests ? " on" : "")} onClick={() => toggle(m.id, "show_tests", !m.show_tests)}>Tests</button>
                    <button type="button" className={"mb-flag" + (m.show_lectures ? " on" : "")} onClick={() => toggle(m.id, "show_lectures", !m.show_lectures)}>Lectures</button>
                    <button type="button" className={"mb-ban" + (m.banned ? " on" : "")} disabled={self} onClick={() => toggle(m.id, "banned", !m.banned)}>
                      {m.banned ? "Unban" : "Ban"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="ol-foot"><Bi v={{ en: "Toggles hide sections in a member's app. Content files stay publicly reachable by direct URL (static hosting).", ar: "المفاتيح تُخفي الأقسام في تطبيق العضو. وتبقى ملفات المحتوى قابلة للوصول برابط مباشر (استضافة ثابتة)." }} /></p>
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
