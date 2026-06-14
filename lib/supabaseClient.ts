import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function normalizeSupabaseUrl(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/(rest|auth|storage)\/v1\/?$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/\/(rest|auth|storage)\/v1\/?$/, "").replace(/\/$/, "");
  }
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey as string)
  : null;
