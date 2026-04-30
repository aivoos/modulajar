// Register cron jobs with Upstash QStash
// Run this AFTER deployment to Railway (script needs publicly accessible URL)
// Usage: bun run src/scripts/register-cron.ts
import { qstash } from "../lib/qstash";

const API_BASE_URL = process.env["API_BASE_URL"] ?? process.env["NEXT_PUBLIC_BASE_URL"];

if (!API_BASE_URL) {
  console.error("❌ API_BASE_URL not set. Set it to your deployed Railway URL.");
  console.error("   Example: API_BASE_URL=https://api.modulajar.app bun run src/scripts/register-cron.ts");
  process.exit(1);
}

if (API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1")) {
  console.error("❌ Cannot register cron jobs pointing to localhost.");
  console.error("   QStash needs a publicly accessible URL.");
  console.error(`   Current API_BASE_URL: ${API_BASE_URL}`);
  console.error("   Set API_BASE_URL to your Railway deployment URL and re-run.");
  process.exit(1);
}

async function registerCronJobs() {
  console.log(`📅 Registering cron jobs with QStash...`);
  console.log(`   API URL: ${API_BASE_URL}`);

  const jobs = [
    {
      name: "quota_reset",
      cron: "1 0 1 * *", // 1st of month, 00:01
      url: `${API_BASE_URL}/api/cron/quota_reset`,
      description: "Monthly quota reset (1st of month)",
    },
    {
      name: "grace_period_check",
      cron: "0 8 * * *", // Daily 08:00
      url: `${API_BASE_URL}/api/cron/grace_period_check`,
      description: "Daily grace period check",
    },
    {
      name: "quota_warning",
      cron: "0 9 * * *", // Daily 09:00
      url: `${API_BASE_URL}/api/cron/quota_warning`,
      description: "Daily quota warning check (>70% usage)",
    },
    {
      name: "subscription_expiry",
      cron: "0 10 * * *", // Daily 10:00
      url: `${API_BASE_URL}/api/cron/subscription_expiry`,
      description: "Daily subscription expiry check",
    },
    {
      name: "journal_reminder_07",
      cron: "0 7 * * *", // Daily 07:00
      url: `${API_BASE_URL}/api/cron/journal_reminder`,
      description: "Journal reminder 07:00 WIB",
    },
    {
      name: "journal_reminder_08",
      cron: "0 8 * * *", // Daily 08:00
      url: `${API_BASE_URL}/api/cron/journal_reminder`,
      description: "Journal reminder 08:00 WIB",
    },
    {
      name: "journal_reminder_12",
      cron: "0 12 * * *", // Daily 12:00
      url: `${API_BASE_URL}/api/cron/journal_reminder`,
      description: "Journal reminder 12:00 WIB",
    },
    {
      name: "journal_reminder_14",
      cron: "0 14 * * *", // Daily 14:00
      url: `${API_BASE_URL}/api/cron/journal_reminder`,
      description: "Journal reminder 14:00 WIB",
    },
    {
      name: "journal_reminder_15",
      cron: "0 15 * * *", // Daily 15:00
      url: `${API_BASE_URL}/api/cron/journal_reminder`,
      description: "Journal reminder 15:00 WIB",
    },
  ];

  let success = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await qstash.publishJSON({
        url: job.url,
        cron: job.cron,
        headers: {
          "User-Agent": "Modulajar-Cron/1.0",
        },
      });
      console.log(`✓ ${job.name}: ${job.description}`);
      success++;
    } catch (err) {
      console.error(`✗ ${job.name} failed:`, err instanceof Error ? err.message : String(err));
      failed++;
    }
  }

  console.log(`\n${success} registered, ${failed} failed.`);
  if (success > 0) {
    console.log(`\n✅ Done! View scheduled jobs at: https://console.upstash.com/qstash`);
  }
}

registerCronJobs().catch(console.error);
