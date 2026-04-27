// Supabase client — uses service_role on server, anon on client
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

/**
 * Client-side Supabase client (uses anon key + RLS)
 * Safe to use in browser/Next.js client components
 */
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-side Supabase client (uses service_role — bypasses RLS)
 * Only use in Elysia/Bun backend, NOT in Next.js API routes exposed to client
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Admin client for CI/CD and migrations
 */
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export type { SupabaseClient } from "@supabase/supabase-js";