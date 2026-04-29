// Subscription routes — /api/subscriptions/*
// Ref: modulajar-spec-v3.jsx — Plan: free | pro | school (annual only)
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS, GRACE_PERIOD_DAYS } from "@modulajar/shared";

const VALID_PLANS = ["free", "pro", "school"] as const;
type PlanKey = (typeof VALID_PLANS)[number];

function buildPlanInfo(key: PlanKey) {
  const p = PLAN_LIMITS[key];
  return {
    id: key,
    name: p.label,
    desc: p.desc,
    price_monthly_idr: "price_monthly_idr" in p ? p["price_monthly_idr" as keyof typeof p] : null,
    price_6mo_idr: "price_6mo_idr" in p ? p["price_6mo_idr" as keyof typeof p] : null,
    price_yearly_idr: "price_yearly_idr" in p ? p["price_yearly_idr" as keyof typeof p] : null,
    ai_quota_per_month: key === "free" ? 3 : ("ai_quota_per_month" in p ? p["ai_quota_per_month" as keyof typeof p] : -1),
    tiers: "tiers" in p ? p["tiers" as keyof typeof p] : null,
    min_guru: "min_guru" in p ? p["min_guru" as keyof typeof p] : null,
    features: p.features,
    locked: p.locked,
    color: p.color,
  };
}

export const subscriptionRoutes = new Elysia({ prefix: "subscriptions" })
  // GET /subscriptions/me — current user's subscription
  .get("/me", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: sub, error: err } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (err) {
      // No subscription yet — return free tier
      return {
        plan: "free",
        status: "active",
        ai_quota_used: 0,
        ai_quota_limit: 3,
        grace_days_remaining: null,
        grace_period_end: null,
        current_period_end: null,
      };
    }

    const now = new Date();
    let graceDaysLeft: number | null = null;

    if (sub.status === "past_due" && sub.grace_period_end) {
      const graceEnd = new Date(sub.grace_period_end);
      graceDaysLeft = Math.max(
        0,
        Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    return {
      ...sub,
      grace_days_remaining: graceDaysLeft,
      is_suspended: sub.status === "past_due" && graceDaysLeft === 0,
    };
  })

  // GET /subscriptions/plans — available plans (public)
  .get("/plans", () => ({
    plans: VALID_PLANS.map(buildPlanInfo),
    grace_period_days: GRACE_PERIOD_DAYS,
  }))

  // POST /subscriptions/upgrade — redirect to billing checkout
  .post("/upgrade", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const body = await request.json() as Record<string, unknown>;
    const plan = body["plan"] as string;

    if (!plan || !VALID_PLANS.includes(plan as PlanKey)) {
      set.status = 400;
      return { error: "invalid_plan", valid_plans: VALID_PLANS };
    }

    if (plan === "free") {
      set.status = 400;
      return { error: "free_is_default", message: "Plan free is the default — no upgrade needed" };
    }

    // billing_cycle is always yearly (spec v3: annual-only)
    const billingCycle = (body["billing_cycle"] as string) ?? "yearly";
    return {
      redirect: "/settings/billing",
      plan,
      billing_cycle: billingCycle,
      note: "Annual-only pricing. No monthly option per spec v3.",
    };
  });
