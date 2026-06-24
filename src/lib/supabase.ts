import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public, browser-safe values baked in at build time (NEXT_PUBLIC_*).
// The publishable/anon key is safe to ship — security comes from row-level-security policies.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

/** True only when both env vars are configured; UI hides account features otherwise. */
export const supabaseEnabled = !!(url && key);

/** Shared client, or null when not configured (e.g. local builds without keys). */
export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, key as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
