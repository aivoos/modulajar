// Billing routes — /api/billing/*
// Xendit invoice checkout + topup
// Ref: modulajar-master-v3.jsx — Day 11
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS, PPN_RATE } from "@modulajar/shared";
import Xendit from "xendit-node";

const xendit = new Xendit({ secretKey: process.env["XENDIT_SECRET"] ?? "" });

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID") ?? null;
}

// ── Checkout (Xendit Invoice) ─────────────────────────────────

async function createXenditInvoice(params: {
  externalId: string;
  amount: number;
  description: string;
  customerEmail?: string;
  successUrl?: string;
  failureUrl?: string;
}) {
  // Xendit v7 API: createInvoice({ data: CreateInvoiceRequest })
  // callbackUrl is set in Xendit dashboard (API Settings → Callback URL)
  const invoice = await xendit.Invoice.createInvoice({
    data: {
      externalId: params.externalId,
      amount: params.amount,
      description: params.description,
      payerEmail: params.customerEmail,
      successRedirectUrl: params.successUrl,
      failureRedirectUrl: params.failureUrl,
      currency: "IDR",
      paymentMethods: ["BCA", "MANDIRI", "BNI", "BRI", "OVO", "DANA", "LINKAJA", "SHOPEEPAY", "QRIS"],
      invoiceDuration: 24 * 60 * 60, // 24h in seconds
    },
  });
  return invoice;
}

// ── Routes ───────────────────────────────────────────────────

export const billingRoutes = new Elysia({ prefix: "/api/billing" })

  // POST /api/billing/checkout — create Xendit invoice for plan upgrade
  .post("/checkout", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json().catch(() => ({})) as Record<string, unknown>;
    const plan = raw["plan"] as string;
    const billingCycle = (raw["billing_cycle"] as string) ?? "monthly";

    if (!plan || !["go", "plus", "sekolah"].includes(plan)) {
      set.status = 400; return { error: "invalid_plan" };
    }

    const supabase = createAdminClient();

    // Fetch user + subscription
    const [{ data: user }, { data: sub }] = await Promise.all([
      supabase.from("users").select("email, full_name").eq("id", userId).single(),
      supabase.from("subscriptions").select("id, plan, xendit_subscription_id").eq("user_id", userId).maybeSingle(),
    ]);

    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] as unknown as Record<string, number> | undefined;
    if (!limits) { set.status = 400; return { error: "invalid_plan" }; }

    const basePrice = billingCycle === "yearly"
      ? (limits["price_yearly_idr"] ?? limits["price_idr"] ?? 0)
      : (limits["price_idr"] ?? 0);

    if (!basePrice) { set.status = 400; return { error: "price_not_configured" }; }

    const totalPrice = Math.round(basePrice * (1 + PPN_RATE));
    const externalId = `sub_${userId}_${plan}_${billingCycle}_${Date.now()}`;

    try {
      const invoice = await createXenditInvoice({
        externalId,
        amount: totalPrice,
        description: `Modulajar ${plan.charAt(0).toUpperCase() + plan.slice(1)} ${billingCycle === "yearly" ? "(Tahunan)" : "(Bulanan)"}${PPN_RATE > 0 ? ` + PPN ${PPN_RATE * 100}%` : ""}`,
        customerEmail: user?.email,
        successUrl: `${process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000"}/settings/billing?success=true`,
        failureUrl: `${process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000"}/settings/billing?failed=true`,
      });

      // Store invoice reference
      await supabase.from("payments").insert({
        user_id: userId,
        subscription_id: sub?.id ?? null,
        xendit_invoice_id: invoice.id,
        external_id: externalId,
        amount: totalPrice,
        plan,
        billing_cycle: billingCycle,
        status: "pending",
        payment_method: null,
      });

      return {
        status: "pending",
        payment_url: invoice.invoiceUrl,
        invoice_id: invoice.id,
        expires_at: invoice.expiryDate,
        amount: totalPrice,
      };
    } catch (err) {
      console.error("[billing] Xendit error:", err);
      set.status = 502; return { error: "xendit_unavailable" };
    }
  })

  // POST /api/billing/topup — create Xendit payment link for AI quota top-up
  .post("/topup", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json().catch(() => ({})) as Record<string, unknown>;
    const amount = parseInt(raw["amount"] as string ?? "0", 10);
    if (amount <= 0) { set.status = 400; return { error: "invalid_amount" }; }

    const supabase = createAdminClient();
    const topupCredits = Math.floor(amount / 5000) * 3; // Rp 5.000 = +3 modul
    const externalId = `topup_${userId}_${Date.now()}`;

    try {
      const invoice = await createXenditInvoice({
        externalId,
        amount,
        description: `Modulajar Top-up: +${topupCredits} kredit Full AI`,
        successUrl: `${process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000"}/settings/billing?topup=success`,
        failureUrl: `${process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000"}/settings/billing?topup=failed`,
      });

      await supabase.from("topups").insert({
        user_id: userId,
        xendit_payment_id: invoice.id,
        amount,
        modul_count: topupCredits,
        status: "pending",
      });

      return {
        status: "pending",
        payment_url: invoice.invoiceUrl,
        invoice_id: invoice.id,
        topup_credits: topupCredits,
        amount,
      };
    } catch (err) {
      console.error("[billing] topup Xendit error:", err);
      set.status = 502; return { error: "xendit_unavailable" };
    }
  })

  // GET /api/billing/history — payment history for current user
  .get("/history", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    return { payments: payments ?? [] };
  })

  // GET /api/billing/subscription — current subscription + usage
  .get("/subscription", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!sub) {
      return {
        plan: "free",
        status: "active",
        ai_quota_used: 0,
        ai_quota_limit: 2,
        is_suspended: false,
        grace_days_remaining: null,
      };
    }

    const limits = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS];
    const quotaLimit = limits?.full_ai_per_month ?? 0;
    const graceMs = sub.grace_period_end ? new Date(sub.grace_period_end).getTime() - Date.now() : 0;
    const graceDaysLeft = graceMs > 0 ? Math.ceil(graceMs / 86400000) : null;

    return {
      ...sub,
      ai_quota_limit: quotaLimit,
      is_suspended: sub.status === "past_due" && graceDaysLeft === 0,
      grace_days_remaining: graceDaysLeft,
    };
  });