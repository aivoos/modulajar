// Webhook routes — /api/webhooks/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS } from "@modulajar/shared";

// Log webhook call first
async function logWebhook(supabase: ReturnType<typeof createAdminClient>, provider: string, event: string, payload: unknown) {
  await supabase.from("webhook_logs").insert({ provider, event, payload });
}

async function verifyXenditSignature(request: Request): Promise<boolean> {
  const token = request.headers.get("X-CALLBACK-TOKEN");
  return token === process.env["XENDIT_WEBHOOK_SECRET"];
}

async function isWebhookProcessed(supabase: ReturnType<typeof createAdminClient>, provider: string, eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_logs")
    .select("id")
    .eq("provider", provider)
    .eq("event", eventId)
    .is("processed_at", null)
    .limit(1)
    .single();
  return !!data;
}

async function handleXenditWebhook(payload: Record<string, unknown>) {
  const supabase = createAdminClient();
  const event = payload["event"] as string;
  const xenditId = payload["id"] as string;

  // Log webhook immediately
  await logWebhook(supabase, "xendit", xenditId, payload);

  // Idempotency: skip already-processed webhook
  if (await isWebhookProcessed(supabase, "xendit", xenditId)) {
    console.log(`[webhook] Xendit ${xenditId} already processed`);
    return;
  }

  const data = payload["data"] as Record<string, unknown> ?? {};

  if (event === "payment.paid") {
    // Xendit sends invoice_id as external_id in data
    const xenditRef = (data["external_id"] as string) ?? (data["invoice_id"] as string);

    if (!xenditRef) {
      console.warn("[webhook] payment.paid missing external_id:", payload);
      return;
    }

    // Handle subscription upgrade payment (sub_* external_id)
    if (xenditRef.startsWith("sub_")) {
      // Parse external_id: sub_<userId>_<plan>_<billingCycle>_<timestamp>
      const parts = xenditRef.split("_");
      const plan = parts[2] as string; // "go", "plus", "sekolah"
      const billingCycle = parts[3] as string; // "monthly" or "yearly"

      if (plan && ["go", "plus", "sekolah"].includes(plan)) {
        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
        const aiLimit = limits?.full_ai_per_month ?? 0;

        // Update or create subscription
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", (data["user_id"] as string) ?? payload["user_id"] as string ?? xenditRef.split("_")[1])
          .single();

        if (existing) {
          await supabase.from("subscriptions").update({
            plan,
            billing_cycle: billingCycle,
            status: "active",
            ai_quota_limit: aiLimit,
            ai_quota_used: 0,
            xendit_subscription_id: xenditId,
            grace_period_end: null,
            updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          await supabase.from("subscriptions").insert({
            user_id: xenditRef.split("_")[1] ?? (data["user_id"] as string),
            plan,
            billing_cycle: billingCycle,
            status: "active",
            ai_quota_limit: aiLimit,
            ai_quota_used: 0,
            xendit_subscription_id: xenditId,
          });
        }

        // Update payment record
        await supabase.from("payments").update({
          status: "paid",
          payment_method: data["payment_method"] as string ?? null,
          paid_at: new Date().toISOString(),
        }).eq("xendit_invoice_id", xenditId);
      }
    }

    // Handle topup payment (topup_* external_id)
    if (xenditRef.startsWith("topup_")) {
      const { data: topup } = await supabase.from("topups").select("*").eq("xendit_payment_id", xenditId).single();
      if (topup) {
        await supabase.from("topups").update({
          status: "paid",
          paid_at: new Date().toISOString(),
        }).eq("id", topup.id);

        // Add credits to subscription
        const { data: sub } = await supabase.from("subscriptions").select("ai_quota_limit").eq("user_id", topup.user_id).single();
        await supabase.from("subscriptions").update({
          ai_quota_limit: (sub?.ai_quota_limit ?? 0) + topup.modul_count,
        }).eq("user_id", topup.user_id);

        // Update payment record
        await supabase.from("payments").update({
          status: "paid",
          paid_at: new Date().toISOString(),
        }).eq("xendit_invoice_id", xenditId);
      }
    }
  }

  if (event === "payment.expired" || event === "payment.failed") {
    const xenditRef = (data["external_id"] as string) ?? xenditId;

    if (xenditRef.startsWith("sub_")) {
      const parts = xenditRef.split("_");
      const userId = parts[1];

      if (userId) {
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + 3);
        await supabase.from("subscriptions").update({
          status: "past_due",
          grace_period_end: graceEnd.toISOString(),
        }).eq("user_id", userId);
      }
    }

    // Update payment record
    await supabase.from("payments").update({
      status: "failed",
    }).eq("xendit_invoice_id", xenditId);
  }

  // Mark as processed
  await supabase.from("webhook_logs")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider", "xendit")
    .eq("event", xenditId);
}

export const webhookRoutes = new Elysia({ prefix: "/api/webhooks" })
  .post("/xendit", async ({ request }) => {
    if (!await verifyXenditSignature(request)) {
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const payload = await request.json() as Record<string, unknown>;
      // Non-blocking webhook processing
      handleXenditWebhook(payload).catch((e) => console.error("[webhook] Xendit error:", e));
    } catch (e) {
      console.error("[webhook] Xendit parse error:", e);
    }

    // Always 200 to Xendit (idempotency handled internally)
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  });