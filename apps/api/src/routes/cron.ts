// Cron job routes — /api/cron/*
// quota_reset (monthly), grace_period_check (daily), subscription_expiry (daily)
// Ref: modulajar-master-v3.jsx — Day 12
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS } from "@modulajar/shared";
import { sendEmail } from "../lib/email";

const CRON_SECRET = process.env["CRON_SECRET"] ?? "";

function verifyCron(request: Request): boolean {
  return request.headers.get("X-Cron-Secret") === CRON_SECRET;
}

// ── Quota Reset (monthly, run on 1st of month) ────────────────────

export const quotaResetCron = new Elysia({ prefix: "cron" })
  .post("/quota_reset", async ({ request, set }) => {
    if (!verifyCron(request)) { set.status = 403; return { error: "forbidden" }; }

    const supabase = createAdminClient();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get all non-free active subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan")
      .eq("status", "active")
      .neq("plan", "free");

    if (!subs || subs.length === 0) {
      return { processed: 0, month: monthKey, message: "no active paid subscriptions" };
    }

    const updates = subs.map((sub) => {
      const limits = PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS] as unknown as Record<string, number> | undefined;
      return supabase.from("subscriptions").update({
        ai_quota_used: 0,
        ai_quota_limit: limits?.["full_ai_per_month"] ?? 10,
        current_period_start: now.toISOString(),
      }).eq("id", sub.id);
    });

    await Promise.all(updates);

    return {
      processed: subs.length,
      month: monthKey,
      message: `Reset ai_quota_used to 0 for ${subs.length} subscribers`,
    };
  });

// ── Grace Period Check (daily) ───────────────────────────────────

export const gracePeriodCron = new Elysia({ prefix: "cron" })
  .post("/grace_period_check", async ({ request, set }) => {
    if (!verifyCron(request)) { set.status = 403; return { error: "forbidden" }; }

    const supabase = createAdminClient();
    const now = new Date();

    // Subs past_due where grace period has expired
    const { data: expired } = await supabase
      .from("subscriptions")
      .select("id, user_id, grace_period_end")
      .eq("status", "past_due")
      .lte("grace_period_end", now.toISOString());

    const expiredIds: string[] = [];
    const emailJobs: Array<() => Promise<void>> = [];

    for (const sub of expired ?? []) {
      expiredIds.push(sub.id);

      // Send suspension email
      emailJobs.push(async () => {
        await sendEmail(sub.user_id, {
          type: "subscription_expiring",
          userName: "User",
          daysLeft: 0,
          plan: "active",
        }).catch(console.error);
      });
    }

    if (expiredIds.length > 0) {
      // Suspend — set plan to free, status to cancelled
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from("subscriptions").update({
        status: "cancelled",
        ai_quota_limit: 2,
        grace_period_end: null,
      }).in("id", expiredIds);
    }

    // Also notify users who are in grace period (1-3 days left)
    const { data: inGrace } = await supabase
      .from("subscriptions")
      .select("id, user_id, grace_period_end")
      .eq("status", "past_due")
      .gt("grace_period_end", now.toISOString());

    const graceEmailPromises = (inGrace ?? []).map(async (sub) => {
      const graceEnd = new Date(sub.grace_period_end!);
      const daysLeft = Math.ceil((graceEnd.getTime() - now.getTime()) / 86400000);
      if (daysLeft <= 1) {
        await sendEmail(sub.user_id, {
          type: "subscription_expiring",
          userName: "User",
          daysLeft,
          plan: "active",
        }).catch(console.error);
      }
    });

    await Promise.allSettled([...emailJobs, ...graceEmailPromises]);

    return {
      suspended: expiredIds.length,
      in_grace: (inGrace ?? []).length,
      message: `Grace period check done`,
    };
  });

// ── Quota Warning (daily — check >70% usage) ─────────────────────

export const quotaWarningCron = new Elysia({ prefix: "cron" })
  .post("/quota_warning", async ({ request, set }) => {
    if (!verifyCron(request)) { set.status = 403; return { error: "forbidden" }; }

    const supabase = createAdminClient();

    // Check all active non-free subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan, ai_quota_used, ai_quota_limit")
      .eq("status", "active")
      .neq("plan", "free");

    const warnCount = subs?.filter((s) => {
      const limit = s.ai_quota_limit > 0 ? s.ai_quota_limit : 999;
      return s.ai_quota_used / limit >= 0.7;
    }).length ?? 0;

    // Fire-and-forget: queue warning emails via notification
    // (In production this would use a proper job queue, here we do direct sends)
    const emailPromises = (subs ?? [])
      .filter((s) => {
        const limit = s.ai_quota_limit > 0 ? s.ai_quota_limit : 999;
        return s.ai_quota_used / limit >= 0.7;
      })
      .map((sub) => {
        const limit = sub.ai_quota_limit > 0 ? sub.ai_quota_limit : 999;
        return sendEmail(sub.user_id, {
          type: "quota_warning",
          userName: "User",
          used: sub.ai_quota_used,
          limit,
          left: Math.max(0, limit - sub.ai_quota_used),
        }).catch(console.error);
      });

    await Promise.allSettled(emailPromises);

    return {
      warned: warnCount,
      message: `Quota warning emails sent to ${warnCount} users`,
    };
  });

// ── Subscription Expiry Check (daily) ────────────────────────────

export const expiryCron = new Elysia({ prefix: "cron" })
  .post("/subscription_expiry", async ({ request, set }) => {
    if (!verifyCron(request)) { set.status = 403; return { error: "forbidden" }; }

    const supabase = createAdminClient();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);

    // Subs expiring in the next 7 days (current_period_end within 7 days)
    const { data: expiring } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan, current_period_end")
      .eq("status", "active")
      .neq("plan", "free")
      .gte("current_period_end", now.toISOString())
      .lte("current_period_end", sevenDaysFromNow.toISOString());

    const emailPromises = (expiring ?? []).map((sub) => {
      const end = new Date(sub.current_period_end!);
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return sendEmail(sub.user_id, {
        type: "subscription_expiring",
        userName: "User",
        daysLeft,
        plan: sub.plan,
      }).catch(console.error);
    });

    await Promise.allSettled(emailPromises);

    return {
      notified: expiring?.length ?? 0,
      message: `Expiry notices sent to ${expiring?.length ?? 0} subscribers`,
    };
  });