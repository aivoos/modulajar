// Subscription routes — /api/subscriptions/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS } from "@modulajar/shared";

export const subscriptionRoutes = new Elysia({ prefix: "/api/subscriptions" })
  .get("/me", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: sub, error: err } = await supabase.from("subscriptions").select("*").eq("user_id", userId).single();

    if (err) { set.status = 404; return { error: "subscription_not_found" }; }

    const now = new Date();
    let graceDaysLeft: number | null = null;
    if (sub.status === "past_due" && sub.grace_period_end) {
      const graceEnd = new Date(sub.grace_period_end);
      graceDaysLeft = Math.max(0, Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return { ...sub, grace_days_remaining: graceDaysLeft, is_suspended: sub.status === "past_due" && graceDaysLeft === 0 };
  })
  .get("/plans", () => ({
    plans: [
      { id: "free", name: "Free", price_idr: 0, features: ["Buat & preview modul", "Scratch + AI Assist"], limitations: ["Tidak bisa download PDF", "Tidak bisa Full AI"] },
      { id: "guru_pro", name: "Guru Pro", price_idr: PLAN_LIMITS.guru_pro.price_idr, features: ["10 modul Full AI/bulan", "Download PDF tanpa watermark", "Top-up Rp 5.000 = +3 modul"], limitations: [] },
      { id: "sekolah", name: "Plan Sekolah", price_idr: PLAN_LIMITS.sekolah.price_idr, features: ["Unlimited AI", "Multi-guru dashboard", "Branding sekolah di PDF", "Invoice BOS resmi"], limitations: [] },
    ],
  }))
  .post("/upgrade", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const body = await request.json() as Record<string, unknown>;
    const plan = body["plan"] as string;
    if (!plan || !["guru_pro", "sekolah"].includes(plan)) { set.status = 400; return { error: "invalid_plan" }; }

    return { status: "placeholder", message: "Xendit payment link generation in Phase 4", plan };
  });