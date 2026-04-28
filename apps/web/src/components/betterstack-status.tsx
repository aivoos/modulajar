"use client";

/**
 * Betterstack Uptime Monitor Script
 * Add to layout: paste the Betterstack status page script tag
 * before the closing </head> tag in layout.tsx
 *
 * Get your script from: https://betterstack.com -> Dashboard -> Monitors -> Status Pages
 *
 * Example script format:
 * <script id="betterstack-status" src="https://status.modulajar.app/status.js" async defer />
 */
export function BetterstackStatusScript() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <script
      id="betterstack-status"
      src={`${process.env.NEXT_PUBLIC_BETTERSTACK_STATUS_URL ?? "https://status.modulajar.app/status.js"}`}
      async
      defer
    />
  );
}

/**
 * Inline Betterstack uptime check
 * Can be used in footer or settings to show API health
 */
export async function checkApiHealth(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const res = await fetch("/api/health", { method: "GET" });
    const latencyMs = Date.now() - start;
    return { ok: res.ok, latencyMs };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
