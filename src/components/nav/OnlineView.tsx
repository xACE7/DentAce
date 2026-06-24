"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/site-config";
import { Bi, Emoji } from "@/lib/content/Bi";

type Row = { user_id: string; name: string; page: string | null; updated_at: string };

const WINDOW_MS = 70000; // treat rows updated within ~70s as "online"

function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

// turn /lecture/3rd/s2/ocd/5 into "Lecture · ocd 5", etc.
function prettyPage(p: string | null): string {
  if (!p || p === "/") return "Home";
  const seg = p.replace(/^\/+|\/+$/g, "").split("/");
  const kind = seg[0];
  const map: Record<string, string> = { lecture: "Lecture", test: "Test", list: "List", subject: "Subject", semester: "Semester", search: "Search", plan: "Plan", profile: "Profile", dashboard: "Dashboard", online: "Online" };
  const label = map[kind] || kind;
  if ((kind === "lecture" || kind === "test") && seg.length >= 5) return `${label} · ${seg[3]} ${seg[4]}`;
  if (kind === "subject" && seg.length >= 4) return `Subject · ${seg[3]}`;
  return label;
}

export function OnlineView() {
  const auth = useAuth();
  const isAdmin = !!auth?.user && auth.user.email === ADMIN_EMAIL;
  const [rows, setRows] = useState<Row[]>([]);
  const [tick, setTick] = useState(0); // re-render to refresh "x ago" + online filter

  useEffect(() => {
    if (!supabase || !isAdmin) return;
    let alive = true;
    const load = async () => {
      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const { data } = await supabase!.from("presence").select("user_id, name, page, updated_at").gt("updated_at", since).order("updated_at", { ascending: false });
      if (alive && data) setRows(data as Row[]);
    };
    void load();
    const poll = setInterval(load, 12000);
    const clock = setInterval(() => setTick((t) => t + 1), 5000);
    const ch = supabase.channel("presence-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "presence" }, () => void load())
      .subscribe();
    return () => { alive = false; clearInterval(poll); clearInterval(clock); supabase!.removeChannel(ch); };
  }, [isAdmin]);

  const online = useMemo(
    () => rows.filter((r) => Date.now() - new Date(r.updated_at).getTime() < WINDOW_MS),
    [rows, tick],
  );

  let body: React.ReactNode;
  if (!auth?.enabled) body = <p className="pf-note"><Bi v={{ en: "Accounts aren't configured.", ar: "الحسابات غير مُفعّلة." }} /></p>;
  else if (auth.status === "loading") body = <p className="pf-note">…</p>;
  else if (!isAdmin) body = <p className="pf-note"><Bi v={{ en: "Not authorized.", ar: "غير مصرّح." }} /></p>;
  else body = (
    <div className="pf-wrap">
      <div className="pf-card">
        <div className="pf-h-row">
          <h3 className="pf-h"><Bi v={{ en: "Online now", ar: "متّصل الآن" }} /></h3>
          <span className="ol-count">{online.length}</span>
        </div>
        {online.length === 0 ? (
          <p className="ol-empty"><Bi v={{ en: "No signed-in users right now.", ar: "لا مستخدمين مسجّلين الآن." }} /></p>
        ) : (
          <ul className="ol-list">
            {online.map((r) => (
              <li className="ol-item" key={r.user_id}>
                <span className="ol-dot" />
                <span className="ol-name">{r.name}</span>
                <span className="ol-page">{prettyPage(r.page)}</span>
                <span className="ol-ago">{ago(r.updated_at)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="ol-foot"><Bi v={{ en: "Signed-in users only. Anonymous traffic is in Google Analytics → Realtime.", ar: "المسجّلون فقط. الزوّار المجهولون في Google Analytics ← الوقت الحقيقي." }} /></p>
      </div>
    </div>
  );

  return (
    <main className="container pf-main" id="dmain">
      <section className="section">
        <div className="section-head bar">
          <h2><Emoji e="🟢" /><Bi v={{ en: "Who's online", ar: "من المتّصل" }} /></h2>
        </div>
        {body}
      </section>
    </main>
  );
}
