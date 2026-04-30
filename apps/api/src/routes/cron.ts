// Cron job routes — /api/cron/*
// quota_reset (monthly), grace_period_check (daily), subscription_expiry (daily)
// Ref: modulajar-master-v3.jsx — Day 12
// Upgraded to Upstash QStash for reliable delivery with retries
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS } from "@modulajar/shared";
import { sendEmail } from "../lib/email";
import { sendJournalReminder, sendPushToUser } from "../lib/push";
import { extractQStashHeaders, verifyQStashRequest } from "../lib/qstash";

const CRON_SECRET = process.env["CRON_SECRET"] ?? "";

function verifyCron(request: Request): boolean {
  // Check CRON_SECRET header (legacy cron-job.org)
  const cronSecret = request.headers.get("X-Cron-Secret");
  if (cronSecret === CRON_SECRET) return true;

  // Check QStash signature
  const { isQStash, signature, timestamp } = extractQStashHeaders(request);
  if (isQStash && signature && timestamp) {
    return verifyQStashRequest("", signature, timestamp);
  }

  return false;
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
      const plan = sub.plan as keyof typeof PLAN_LIMITS;
      let aiQuotaLimit = 0;
      if (plan === "free") aiQuotaLimit = 3;
      else if (plan === "pro" || plan === "school") aiQuotaLimit = 30;
      return supabase.from("subscriptions").update({
        ai_quota_used: 0,
        ai_quota_limit: aiQuotaLimit,
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

// ── Journal Reminder (hourly during school hours) ──────────────────
// Ref: modulajar-spec-v3.jsx — "30 menit dopo jam kelas → 'Bu Sari, jurnal kelas 8A belum diisi'"
// Sends push notification only if: journal not filled today, and < 3 notifs sent today
export const journalReminderCron = new Elysia({ prefix: "cron" })
  .post("/journal_reminder", async ({ request, set }) => {
    if (!verifyCron(request)) { set.status = 403; return { error: "forbidden" }; }

    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Get all active teaching classes
    const { data: classes } = await supabase
      .from("teaching_classes")
      .select("id, user_id, class_name, subject, class_time")
      .eq("is_active", true);

    if (!classes || classes.length === 0) {
      return { reminders: 0, message: "no active classes" };
    }

    const classIds = classes.map((c) => c.id);

    // Check which classes already have journals today
    const { data: journalsToday } = await supabase
      .from("journals")
      .select("teaching_class_id")
      .eq("date", today)
      .in("teaching_class_id", classIds);

    const filledClassIds = new Set((journalsToday ?? []).map((j) => j.teaching_class_id));

    // Check notification rate limit: max 3/day per user
    // Get notifications sent to each user today
    const userIds = [...new Set(classes.map((c) => c.user_id))];
    const { data: recentNotifs } = await supabase
      .from("notifications")
      .select("user_id, created_at")
      .eq("type", "journal_reminder")
      .eq("read_at", null)
      .in("user_id", userIds)
      .gte("created_at", today);

    const notifCount: Record<string, number> = {};
    for (const n of recentNotifs ?? []) {
      notifCount[n.user_id] = (notifCount[n.user_id] ?? 0) + 1;
    }

    // Send reminders
    let sent = 0;
    let skipped = 0;

    for (const cls of classes) {
      // Skip if journal already filled
      if (filledClassIds.has(cls.id)) continue;

      // Skip if user already hit 3 notifications today
      if ((notifCount[cls.user_id] ?? 0) >= 3) {
        skipped++;
        continue;
      }

      // Create in-app notification record
      await supabase.from("notifications").insert({
        user_id: cls.user_id,
        type: "journal_reminder",
        title: "📓 Jurnal Belum Diisi",
        body: `Kelas ${cls.class_name} (${cls.subject}) belum ada jurnal hari ini.`,
        meta: { teaching_class_id: cls.id, class_name: cls.class_name, subject: cls.subject },
      });

      // Send push notification
      const { sent: pushSent } = await sendJournalReminder(cls.user_id, cls.class_name, cls.subject);
      if (pushSent > 0) {
        notifCount[cls.user_id] = (notifCount[cls.user_id] ?? 0) + 1;
      }

      sent++;
    }

    return { reminders: sent, skipped, message: `Sent ${sent} journal reminders` };
  });