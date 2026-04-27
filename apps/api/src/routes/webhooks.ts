// Webhook routes — /api/webhooks/*
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

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
  if (!xenditId) return;

  await supabase.from("webhook_logs").insert({ provider: "xendit", event: event ?? "unknown", payload });

  if (await isWebhookProcessed(supabase, "xendit", xenditId)) {
    console.log(`[webhook] Xendit ${xenditId} already processed`);
    return;
  }

  const data = payload["data"] as Record<string, unknown> ?? {};

  if (event === "payment.paid") {
    const xenditRef = data["external_id"] as string;

    if (xenditRef?.startsWith("sub_")) {
      const { data: sub } = await supabase.from("subscriptions").select("id").eq("xendit_subscription_id", xenditRef).single();
      if (sub) {
        await supabase.from("subscriptions").update({ status: "active", ai_quota_used: 0, grace_period_end: null }).eq("id", sub.id);
      }
    }

    if (xenditRef?.startsWith("topup_")) {
      const { data: topup } = await supabase.from("topups").select("*").eq("xendit_payment_id", xenditId).single();
      if (topup) {
        await supabase.from("topups").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", topup.id);
        const { data: current } = await supabase.from("subscriptions").select("ai_quota_limit").eq("user_id", topup.user_id).single();
        if (current) {
          await supabase.from("subscriptions").update({ ai_quota_limit: current.ai_quota_limit + topup.modul_count }).eq("user_id", topup.user_id);
        }
      }
    }
  }

  if (event === "payment.expired" || event === "payment.failed") {
    const xenditRef = data["external_id"] as string;
    if (xenditRef?.startsWith("sub_")) {
      const { data: sub } = await supabase.from("subscriptions").select("id").eq("xendit_subscription_id", xenditRef).single();
      if (sub) {
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + 3);
        await supabase.from("subscriptions").update({ status: "past_due", grace_period_end: graceEnd.toISOString() }).eq("id", sub.id);
      }
    }
  }

  await supabase.from("webhook_logs").update({ processed_at: new Date().toISOString() }).eq("provider", "xendit").eq("event", xenditId).is("processed_at", null);
}

export const webhookRoutes = new Elysia({ prefix: "/api/webhooks" })
  .post("/xendit", async ({ request }) => {
    if (!await verifyXenditSignature(request)) {
      return new Response(JSON.stringify({ error: "invalid_signature" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    try {
      const payload = await request.json() as Record<string, unknown>;
      await handleXenditWebhook(payload);
    } catch (e) {
      console.error("[webhook] Xendit error:", e);
    }

    // Always 200 to Xendit (no retry loop)
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  });