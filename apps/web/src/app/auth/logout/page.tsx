export const dynamic = 'force-dynamic';

import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LogoutPage() {
  const supabase = await createServerClient();
  const cookieStore = await cookies();

  // Sign out on the server (invalidates session in Supabase)
  await supabase.auth.signOut();

  // Clear session cookies
  cookieStore.delete("sb-access-token");
  cookieStore.delete("sb-refresh-token");

  // Redirect to home (will go to login since not authenticated)
  redirect("/");
}