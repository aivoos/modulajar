// Agent routes — /api/agent/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { AI_AGENTS, PLAN_LIMITS } from "@modulajar/shared";

export const agentRoutes = new Elysia({ prefix: "/api/agent" })
  .get("/", () => ({
    agents: AI_AGENTS,
    version: "0.1.0",
    note: "Full AI generation in Phase 2",
  }))
  .get("/quota", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) {
      set.status = 401;
      return { error: "unauthorized" };
    }

    const supabase = createAdminClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, ai_quota_used, ai_quota_limit")
      .eq("user_id", userId)
      .single();

    if (!sub) {
      set.status = 404;
      return { error: "subscription_not_found" };
    }

    const limit = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS]?.full_ai_per_month ?? 0;
    const available = Math.max(0, limit - sub.ai_quota_used);

    return { plan: sub.plan, used: sub.ai_quota_used, limit, available, exhausted: available <= 0 };
  })
  .post("/generate", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) {
      set.status = 401;
      return { error: "unauthorized" };
    }

    const supabase = createAdminClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, ai_quota_used, ai_quota_limit")
      .eq("user_id", userId)
      .single();

    if (!sub) {
      set.status = 404;
      return { error: "subscription_not_found" };
    }

    if (sub.plan === "free") {
      set.status = 403;
      return { error: "plan_required", upgrade_url: "/settings/billing", message: "Full AI tersedia di Guru Pro" };
    }

    const limit = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS]?.full_ai_per_month ?? 0;
    if (sub.ai_quota_used >= limit) {
      set.status = 429;
      return {
        error: "quota_exceeded",
        used: sub.ai_quota_used,
        limit,
        topup_url: "/settings/billing?topup=true",
        message: `Kuota Full AI habis. Sisa ${limit - sub.ai_quota_used} modul bulan ini.`,
      };
    }

    return { status: "placeholder", message: "Agent orchestration implemented in Phase 2" };
  });