/**
 * Topup routes — /api/topup/*
 * Buy DNA credits (AI module generation credits) via Xendit QRIS/VA.
 * Ref: modulajar-spec-v3.jsx — Rp 10.000 = +3 AI credits
 */
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import Xendit from "xendit-node";

const xendit = new Xendit({ secretKey: process.env["XENDIT_SECRET"] ?? "" });

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID") ?? null;
}

/** Map IDR amount to DNA credits. Rp 10.000 = 3 credits. */
function idrToCredits(amountIdr: number): number {
  return Math.floor(amountIdr / 10_000) * 3;
}

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
      invoiceDuration: 24 * 60 * 60,
    },
  });
  return invoice;
}

export const topupRoutes = new Elysia({ prefix: "topup" })

  // GET /api/topup/options — available topup packages
  .get("/options", () => {
    const baseUrl = process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000";
    return {
      packages: [
        { idr: 10_000, credits: 3,  label: "+3 Credits",  tagline: "Cocok untuk coba-coba" },
        { idr: 30_000, credits: 9,  label: "+9 Credits",  tagline: "Paling populer",  popular: true },
        { idr: 50_000, credits: 15, label: "+15 Credits", tagline: "Hemat 17%" },
        { idr: 100_000, credits: 30, label: "+30 Credits", tagline: "Paket hemat" },
        { idr: 200_000, credits: 60, label: "+60 Credits", tagline: "Bulk — hemat 33%" },
      ],
      rate: "Rp 10.000 = 3 AI credits",
      applies_to: "Pro & Sekolah plan",
      success_url: `${baseUrl}/dashboard?topup=success`,
      failure_url: `${baseUrl}/settings/billing?topup=failed`,
    };
  })

  // POST /api/topup/checkout — create Xendit invoice for topup credits
  .post("/checkout", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const raw = await request.json().catch(() => ({})) as Record<string, unknown>;
    const amountIdr = parseInt(String(raw["amount_idr"] ?? "10000"), 10);
    const credits = idrToCredits(amountIdr);

    if (amountIdr < 10_000 || credits < 1) {
      set.status = 400;
      return { error: "minimum_topup", minimum_idr: 10_000, minimum_credits: 3 };
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase.from("users").select("email").eq("id", userId).single();

    const externalId = `topup_${userId}_${Date.now()}`;
    const baseUrl = process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000";

    try {
      const invoice = await createXenditInvoice({
        externalId,
        amount: amountIdr,
        description: `Modulajar Topup — ${credits} AI Credits`,
        customerEmail: user?.email,
        successUrl: `${baseUrl}/settings/billing?topup=success`,
        failureUrl: `${baseUrl}/settings/billing?topup=failed`,
      });

      // Get subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      // Insert topup record (pending)
      const { data: topup } = await supabase.from("topups").insert({
        user_id: userId,
        subscription_id: sub?.id ?? null,
        xendit_payment_id: invoice.id,
        amount_idr: amountIdr,
        ai_credits: credits,
        status: "pending",
      }).select("id").single();

      // Insert payment record
      if (sub?.id) {
        await supabase.from("payments").insert({
          subscription_id: sub.id,
          xendit_payment_id: invoice.id,
          xendit_invoice_id: invoice.id,
          amount_idr: amountIdr,
          status: "pending",
        });
      }

      return {
        status: "pending",
        payment_url: invoice.invoiceUrl,
        invoice_id: invoice.id,
        expires_at: invoice.expiryDate,
        amount_idr: amountIdr,
        credits,
        topup_id: topup?.id,
      };
    } catch (err) {
      console.error("[topup] Xendit error:", err);
      set.status = 502;
      return { error: "xendit_unavailable" };
    }
  });