// Server Supabase client (service_role — bypasses RLS)
// Only used in Next.js Server Components / API Routes
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get current user from server-side session (Server Components / Route Handlers)
 */
export async function getServerUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) return null;

  const client = await createServerClient();
  const { data: { user }, error } = await client.auth.getUser(accessToken);

  if (error || !user) return null;

  // Fetch extended user profile
  const { data: profile } = await client
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ? { ...user, profile } : user;
}
