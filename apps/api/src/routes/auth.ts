// Auth routes — /api/auth/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .get("/me", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) {
      set.status = 401;
      return { error: "unauthorized" };
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase.from("users").select("*").eq("id", userId).single();

    if (!user) {
      set.status = 404;
      return { error: "user_not_found" };
    }

    const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", userId).single();
    return { user, subscription: sub };
  })
  .get("/quota", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) {
      set.status = 401;
      return { error: "unauthorized" };
    }

    const supabase = createAdminClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("ai_quota_used, ai_quota_limit, plan")
      .eq("user_id", userId)
      .single();

    if (!sub) {
      set.status = 404;
      return { error: "subscription_not_found" };
    }

    const available = Math.max(0, sub.ai_quota_limit - sub.ai_quota_used);
    return { used: sub.ai_quota_used, limit: sub.ai_quota_limit, available, exhausted: available <= 0 };
  });