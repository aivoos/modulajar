// Billing routes — /api/billing/*
// Xendit invoice checkout (annual-only, no topup per spec v3)
// Ref: modulajar-spec-v3.jsx
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS, PPN_RATE, GRACE_PERIOD_DAYS } from "@modulajar/shared";
import Xendit from "xendit-node";

const xendit = new Xendit({ secretKey: process.env["XENDIT_SECRET"] ?? "" });

function getAuthUser(request: Request): string | null {
  return request.headers.get("Authorization")?.replace("Bearer ", "") ?? null;
}

// Spec v3: 3-tier — Pro (monthly/6mo/annual), School (tiered per-guru, annual), Free
// Ref: modulajar-spec-v3.jsx
const VALID_PLANS = ["free", "pro", "school"] as const;
type PlanKey = (typeof VALID_PLANS)[number];

async function createXenditInvoice(params: {
  externalId: string;
  amount: number;
  description: string;
  customerEmail?: string;
  successUrl?: string;
  failureUrl?: string;
}) {
  const invoice = await xendit.Invoice.createInvoice({
    data: {
      externalId: params.externalId,
      amount: params.amount,
      description: params.description,
      payerEmail: params.customerEmail,
      successRedirectUrl: params.successUrl,
      failureRedirectUrl: params.failureUrl,
      currency: "IDR",
      paymentMethods: ["BCA", "MANDIRI", "BNI", "BRI", "OVO", "DANA", "LINKAJA", "QRIS"],
      invoiceDuration: 24 * 60 * 60, // 24h
    },
  });
  return invoice;
}

function getPlanPrice(plan: PlanKey, billingCycle: string): number {
  const p = PLAN_LIMITS[plan];
  if (plan === "free") return 0;

  // Spec v3: Pro has monthly/6mo/annual; School is per-guru, annual
  if (plan === "pro") {
    if (billingCycle === "monthly") return (p as { price_monthly_idr?: number }).price_monthly_idr ?? p.price_yearly_idr;
    if (billingCycle === "6mo") return (p as { price_6mo_idr?: number }).price_6mo_idr ?? p.price_yearly_idr;
    return (p as { price_yearly_idr: number }).price_yearly_idr; // yearly
  }

  // Sekolah: per-guru monthly billing (tiered)
  // billingCycle encodes guru_count + tier
  const schoolP = p as { tiers?: Array<{ per_guru_month: number }> };
  return schoolP.tiers?.[0]?.per_guru_month ?? 89_000;
}

function getPlanQuotaLimit(plan: PlanKey): number {
  if (plan === "free") return 3; // 3× lifetime
  if (plan === "pro") return (PLAN_LIMITS[plan] as { ai_quota_per_month?: number }).ai_quota_per_month ?? 30;
  if (plan === "school") return (PLAN_LIMITS[plan] as { ai_quota_per_teacher?: number }).ai_quota_per_teacher ?? 30;
  return -1;
}

// ── Routes ───────────────────────────────────────────────────

export const billingRoutes = new Elysia({ prefix: "billing" })

  // POST /api/billing/checkout — create Xendit invoice for plan upgrade
  // Spec v3: Pro (monthly/6mo/annual), School (tiered per-guru, annual)
  .post("/checkout", async ({ request, set }) => {
    const userId = getAuthUser(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json().catch(() => ({})) as Record<string, unknown>;
    const plan = raw["plan"] as string;
    // billing_cycle: "monthly" | "6mo" | "yearly" (Pro); "yearly" (School, per-guru)
    const billingCycle = (raw["billing_cycle"] as string) ?? "monthly";

    if (!plan || !VALID_PLANS.includes(plan as PlanKey)) {
      set.status = 400;
      return { error: "invalid_plan", valid_plans: VALID_PLANS };
    }

    if (plan === "free") {
      set.status = 400;
      return { error: "invalid_plan", message: "Free is default — no checkout needed" };
    }

    const supabase = createAdminClient();
    const [{ data: user }, { data: existingSub }] = await Promise.all([
      supabase.from("users").select("email, full_name, school_id").eq("id", userId).single(),
      supabase.from("subscriptions").select("id, plan").eq("user_id", userId).maybeSingle(),
    ]);

    if (!user) { set.status = 404; return { error: "user_not_found" }; }

    const basePrice = getPlanPrice(plan as PlanKey, billingCycle);
    if (!basePrice) { set.status = 400; return { error: "price_not_configured" }; }

    // Spec v3: PPN 11% included in displayed prices
    const totalPrice = Math.round(basePrice * (1 + PPN_RATE));
    const externalId = `sub_${userId}_${plan}_${billingCycle}_${Date.now()}`;

    const planLabel = PLAN_LIMITS[plan as PlanKey].label;
    const baseUrl = process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000";

    try {
      const invoice = await createXenditInvoice({
        externalId,
        amount: totalPrice,
        description: `Modulajar ${planLabel} ${billingCycle === "monthly" ? "(Bulanan)" : billingCycle === "6mo" ? "(6 Bulan)" : "(Tahunan)"} + PPN ${PPN_RATE * 100}%`,
        customerEmail: user.email,
        successUrl: `${baseUrl}/settings/billing?success=true`,
        failureUrl: `${baseUrl}/settings/billing?failed=true`,
      });

      // Insert or get subscription
      let subscriptionId = existingSub?.id;
      if (!subscriptionId) {
        const { data: newSub } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            school_id: user.school_id,
            plan: plan as PlanKey,
            billing_cycle: "yearly",
            status: "trialing",
            ai_quota_limit: getPlanQuotaLimit(plan as PlanKey),
            ai_quota_used: 0,
          })
          .select("id")
          .single();
        subscriptionId = newSub?.id;
      }

      // Insert payment record
      if (subscriptionId) {
        await supabase.from("payments").insert({
          subscription_id: subscriptionId,
          xendit_payment_id: invoice.id,
          xendit_invoice_id: invoice.id,
          amount_idr: totalPrice,
          status: "pending",
        });
      }

      return {
        status: "pending",
        payment_url: invoice.invoiceUrl,
        invoice_id: invoice.id,
        expires_at: invoice.expiryDate,
        amount_idr: totalPrice,
        plan,
        billing_cycle: billingCycle,
      };
    } catch (err) {
      console.error("[billing] Xendit error:", err);
      set.status = 502;
      return { error: "xendit_unavailable", message: "Payment gateway unavailable. Try again shortly." };
    }
  })

  // GET /api/billing/history — payment history for current user
  .get("/history", async ({ request, set }) => {
    const userId = getAuthUser(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();

    // Get subscription_id first, then payments
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub) return { payments: [] };

    const { data: payments } = await supabase
      .from("payments")
      .select(`
        id,
        amount_idr,
        status,
        method,
        invoice_url,
        pdf_url,
        paid_at,
        created_at,
        subscription:subscriptions(plan)
      `)
      .eq("subscription_id", sub.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      payments: (payments ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        plan: (p["subscription"] as Record<string, unknown> | null)?.["plan"] ?? "unknown",
      })),
    };
  })

  // GET /api/billing/subscription — current subscription + usage
  .get("/subscription", async ({ request, set }) => {
    const userId = getAuthUser(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub) {
      return {
        plan: "free",
        status: "active",
        ai_quota_used: 0,
        ai_quota_limit: 3,
        grace_period_end: null,
        current_period_end: null,
        grace_days_remaining: null,
        is_suspended: false,
      };
    }

    const planQuota = getPlanQuotaLimit(sub.plan as PlanKey);
    const graceMs = sub.grace_period_end
      ? new Date(sub.grace_period_end).getTime() - Date.now()
      : 0;
    const graceDaysLeft = graceMs > 0 ? Math.ceil(graceMs / 86400000) : null;

    return {
      ...sub,
      ai_quota_limit: planQuota,
      grace_days_remaining: graceDaysLeft,
      grace_period_days: GRACE_PERIOD_DAYS,
      is_suspended: sub.status === "past_due" && (graceDaysLeft ?? 0) <= 0,
    };
  });
