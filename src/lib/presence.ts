/* Live presence: each signed-in client heartbeats its current page into one row
   (public.presence). RLS lets a user write only their own row, and only the owner
   (ADMIN_EMAIL) can read the table — so the "who's online" list is private. */
import { supabase } from "@/lib/supabase";

export async function setPresence(userId: string, name: string, page: string) {
  if (!supabase) return;
  try {
    await supabase.from("presence").upsert({ user_id: userId, name, page, updated_at: new Date().toISOString() });
  } catch { /* offline / transient */ }
}

export async function clearPresence(userId: string) {
  if (!supabase) return;
  try { await supabase.from("presence").delete().eq("user_id", userId); } catch { /* ignore */ }
}
