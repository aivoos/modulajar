// Push Notification Service
// Ref: modulajar-spec-v3.jsx — Push Notification (Day 9)
// web-push for Web Push API (Chrome/Firefox/Safari)
import { createAdminClient } from "@modulajar/db";

const VAPID_PUBLIC = process.env["VAPID_PUBLIC_KEY"] ?? "";
const VAPID_PRIVATE = process.env["VAPID_PRIVATE_KEY"] ?? "";
const VAPID_SUBJECT = process.env["VAPID_SUBJECT"] ?? "mailto:hello@modulajar.app";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn("[push] VAPID keys not configured — skipping push");
    return { sent: 0, failed: 0 };
  }

  const supabase = createAdminClient();

  // Get all push subscriptions for this user
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Dynamic import to avoid requiring web-push at build time if not needed
  const webPush = await import("web-push");
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const pushPayload = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      await webPush.sendNotification(subscription, pushPayload);
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[push] failed to ${sub.endpoint.slice(0, 50)}: ${msg}`);

      // Remove invalid subscriptions
      if (msg.includes("unsubscribe") || msg.includes("410") || msg.includes("not_found")) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
      failed++;
    }
  }

  return { sent, failed };
}

export async function sendJournalReminder(
  userId: string,
  className: string,
  subject: string
): Promise<{ sent: number; failed: number }> {
  return sendPushToUser(userId, {
    title: "📓 Jurnal Belum Diisi",
    body: `Kelas ${className} (${subject}) belum ada jurnal hari ini. Isi sekarang — 60 detik saja!`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "journal_reminder",
    data: { type: "journal_reminder", url: "/journal" },
  });
}

export async function sendQuotaWarning(
  userId: string,
  used: number,
  limit: number
): Promise<{ sent: number; failed: number }> {
  const left = Math.max(0, limit - used);
  return sendPushToUser(userId, {
    title: "⚠️ Kuota AI Hampir Habis",
    body: `Tinggal ${left}× AI generate bulan ini. Upgrade ke Pro untuk 30×/bulan.`,
    icon: "/icons/icon-192.png",
    tag: "quota_warning",
    data: { type: "quota_warning", url: "/settings/billing" },
  });
}

export async function sendPMMDeadlineReminder(
  userId: string,
  daysLeft: number
): Promise<{ sent: number; failed: number }> {
  return sendPushToUser(userId, {
    title: "🏅 Deadline PMM Mendekati",
    body: `${daysLeft} hari lagi! Pastikan bukti kinerja sudah lengkap. Generate paket di Modulajar.`,
    icon: "/icons/icon-192.png",
    tag: "pmm_deadline",
    data: { type: "pmm_deadline", url: "/pmm" },
  });
}
