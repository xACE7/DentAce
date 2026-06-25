"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { onProgress } from "@/lib/progress";
import { pullCloud, schedulePush } from "@/lib/sync";

type Status = "loading" | "in" | "out";
export type Profile = {
  username: string; avatar_url: string | null; email: string | null;
  banned: boolean; show_pdfs: boolean; show_tests: boolean; show_lectures: boolean;
  scope: string | null;
};
type Result = { error?: string; info?: string };
type Flags = { pdfs: boolean; tests: boolean; lectures: boolean };
type AuthCtx = {
  enabled: boolean;
  user: User | null;
  profile: Profile | null;
  status: Status;
  syncing: boolean;
  isAdmin: boolean;
  banned: boolean;
  flags: Flags;
  logIn: (identifier: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string; verify?: boolean }>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<Result>;
  updateEmail: (email: string) => Promise<Result>;
  updatePassword: (password: string) => Promise<Result>;
  uploadAvatar: (file: File) => Promise<Result>;
  updateScope: (scope: string) => Promise<Result>;
  syncNow: () => Promise<Result>;
};
const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<Status>(supabaseEnabled ? "loading" : "out");
  const [syncing, setSyncing] = useState(false);
  const uidRef = useRef<string | null>(null);

  const loadProfile = async (uid: string) => {
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("username, avatar_url, email, banned, show_pdfs, show_tests, show_lectures, scope").eq("id", uid).maybeSingle();
    setProfile(data ? {
      username: data.username, avatar_url: data.avatar_url, email: data.email,
      banned: !!data.banned,
      // PDFs are hidden by default — only shown when explicitly granted (=== true).
      show_pdfs: data.show_pdfs === true, show_tests: data.show_tests !== false, show_lectures: data.show_lectures !== false,
      scope: typeof data.scope === "string" ? data.scope : null,
    } : null);
  };

  // session bootstrap + auth changes (incl. email-confirm return via detectSessionInUrl)
  useEffect(() => {
    if (!supabase) { setStatus("out"); return; }
    const handle = async (session: Session | null) => {
      const u = session?.user ?? null;
      setUser(u);
      setStatus(u ? "in" : "out");
      if (u && uidRef.current !== u.id) {
        uidRef.current = u.id;
        setSyncing(true);
        await pullCloud(u.id);
        setSyncing(false);
        void loadProfile(u.id);
      }
      if (!u) { uidRef.current = null; setProfile(null); }
    };
    supabase.auth.getSession().then(({ data }) => void handle(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => void handle(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // push local progress changes (debounced) whenever signed in
  useEffect(() => {
    if (!supabaseEnabled) return;
    return onProgress(() => { if (uidRef.current) schedulePush(uidRef.current); });
  }, []);

  const redirect = () => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    return typeof window !== "undefined" ? `${window.location.origin}${base}/` : undefined;
  };

  const logIn = async (identifier: string, password: string): Promise<{ error?: string }> => {
    if (!supabase) return { error: "Sync isn't configured." };
    let email = identifier.trim();
    if (!email.includes("@")) {
      // entered a username → resolve it to the account email
      const { data, error } = await supabase.rpc("email_for_username", { uname: email });
      if (error || !data) return { error: "No account with that username." };
      email = data as string;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUp = async (email: string, password: string, username: string): Promise<{ error?: string; verify?: boolean }> => {
    if (!supabase) return { error: "Sync isn't configured." };
    const uname = username.trim();
    const { data: free } = await supabase.rpc("username_available", { uname });
    if (free === false) return { error: "That username is taken." };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: uname }, emailRedirectTo: redirect() },
    });
    if (error) return { error: error.message };
    // With "Confirm email" on, Supabase returns an obfuscated user with NO identities
    // when the email already exists — surface that instead of the "verify" message.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: "That email already has an account — log in instead." };
    }
    // No session yet → the new user must verify by email first.
    return data.session ? {} : { verify: true };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setStatus("out");
    uidRef.current = null;
  };

  const updateUsername = async (username: string): Promise<Result> => {
    if (!supabase || !uidRef.current) return { error: "Not signed in." };
    const uname = username.trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(uname)) return { error: "Username must be 3–20 letters, numbers or underscore." };
    // upsert (not update) so it works even for accounts created before the profile trigger,
    // and so the unique-username index is actually hit (blocks duplicates).
    const payload: { id: string; username: string; email?: string } = { id: uidRef.current, username: uname };
    if (user?.email) payload.email = user.email;
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      if (/duplicate|unique/i.test(error.message)) return { error: "That username is taken." };
      if (/schema cache|does not exist/i.test(error.message)) return { error: "Profiles table isn't set up yet — run the database setup SQL." };
      return { error: error.message };
    }
    await loadProfile(uidRef.current);
    return { info: "Username updated." };
  };

  const updateEmail = async (email: string): Promise<Result> => {
    if (!supabase) return { error: "Not signed in." };
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: redirect() });
    return error ? { error: error.message } : { info: "Check your new email (incl. Spam folder) to confirm the change." };
  };

  const updatePassword = async (password: string): Promise<Result> => {
    if (!supabase) return { error: "Not signed in." };
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { error: error.message } : { info: "Password updated." };
  };

  const uploadAvatar = async (file: File): Promise<Result> => {
    if (!supabase || !uidRef.current) return { error: "Not signed in." };
    if (!file.type.startsWith("image/")) return { error: "Please choose an image file." };
    if (file.size > 3 * 1024 * 1024) return { error: "Image must be under 3 MB." };
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${uidRef.current}/avatar.${ext}`;
    const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
    if (up.error) return { error: up.error.message };
    const url = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", uidRef.current);
    if (error) return { error: error.message };
    await loadProfile(uidRef.current);
    return { info: "Avatar updated." };
  };

  const updateScope = async (scope: string): Promise<Result> => {
    if (!supabase || !uidRef.current) return { error: "Not signed in." };
    const payload: { id: string; scope: string; email?: string } = { id: uidRef.current, scope };
    if (user?.email) payload.email = user.email;
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      if (/schema cache|does not exist|column/i.test(error.message)) return { error: "Add the 'scope' column — run the database setup SQL." };
      return { error: error.message };
    }
    await loadProfile(uidRef.current);
    return { info: "Saved." };
  };

  // Manual "Sync now": pull the cloud row, merge with local, and push the union back.
  const syncNow = async (): Promise<Result> => {
    if (!supabase || !uidRef.current) return { error: "Sign in to sync." };
    setSyncing(true);
    const ok = await pullCloud(uidRef.current);
    setSyncing(false);
    return ok ? { info: "Progress synced." } : { error: "Couldn't sync (offline?)." };
  };

  // Admin status comes from a Supabase role claim (app_metadata.role), set
  // server-side via SQL/dashboard. It can't be self-granted (app_metadata is not
  // user-editable) and keeps the owner's email out of the published bundle.
  const isAdmin = !!user && user.app_metadata?.role === "admin";
  const banned = !!user && !!profile?.banned;
  // content visibility: admin sees all; tests/lectures are public by default but
  // PDFs are HIDDEN by default — only admin or an explicitly-granted member sees them.
  const flags: Flags = useMemo(() => {
    if (!supabaseEnabled || isAdmin) return { pdfs: true, tests: true, lectures: true };
    if (!user || !profile) return { pdfs: false, tests: true, lectures: true };
    return { pdfs: profile.show_pdfs, tests: profile.show_tests, lectures: profile.show_lectures };
  }, [user, isAdmin, profile]);

  return (
    <Ctx.Provider
      value={{
        enabled: supabaseEnabled, user, profile, status, syncing, isAdmin, banned, flags,
        logIn, signUp, signOut, updateUsername, updateEmail, updatePassword, uploadAvatar, updateScope, syncNow,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
