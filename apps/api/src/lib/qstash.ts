// Upstash QStash integration for Bun/Elysia
// Ref: https://upstash.com/docs/qstash/overall/getting-started
import { Client } from "@upstash/qstash";
import { createHmac, timingSafeEqual } from "node:crypto";

const QSTASH_URL = process.env["QSTASH_URL"] ?? "https://qstash-us-east-1.upstash.io";
const QSTASH_TOKEN = process.env["QSTASH_TOKEN"] ?? "";
const QSTASH_CURRENT_SIGNING_KEY = process.env["QSTASH_CURRENT_SIGNING_KEY"] ?? "";
const QSTASH_NEXT_SIGNING_KEY = process.env["QSTASH_NEXT_SIGNING_KEY"] ?? "";
const API_BASE_URL = process.env["API_BASE_URL"] ?? process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000";

export const qstash = new Client({ token: QSTASH_TOKEN, baseUrl: QSTASH_URL });

// ── Verify QStash webhook signature (Bun-compatible) ──────────────────
// QStash sends: Upstash-Signature: "v1=base64(timestamp).base64(sha256_body)"
// We verify: HMAC-SHA256(timestamp + "." + body, secret) == provided_signature

export function verifyQStashRequest(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  if (!QSTASH_CURRENT_SIGNING_KEY) {
    console.warn("[qstash] QSTASH_CURRENT_SIGNING_KEY not set — skipping verification");
    return true; // Skip in dev
  }

  // Verify timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    console.warn("[qstash] Signature timestamp out of range");
    return false;
  }

  // Compute expected signature: HMAC-SHA256(timestamp.body)
  const payload = `${timestamp}.${body}`;
  const expected = createHmac("sha256", QSTASH_CURRENT_SIGNING_KEY)
    .update(payload)
    .digest("base64");

  // Extract v1= signature from "v1=abc,v1=def" format
  const parts = signature.split(",");
  let providedSig = "";
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "v1") { providedSig = v; break; }
  }

  if (!providedSig) return false;

  // Constant-time comparison
  try {
    const a = Buffer.from(expected, "base64");
    const b = Buffer.from(providedSig, "base64");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ── Middleware: extract & attach QStash headers from request ────────

export interface QStashContext {
  qstash: {
    isQStash: boolean;
    messageId?: string;
    signature?: string;
    timestamp?: string;
  };
}

export function extractQStashHeaders(request: Request): {
  isQStash: boolean;
  messageId?: string;
  signature?: string;
  timestamp?: string;
} {
  const signature = request.headers.get("upstash-signature") ??
                    request.headers.get("Upstash-Signature") ?? "";
  const timestamp = request.headers.get("upstash-timestamp") ??
                   request.headers.get("Upstash-Timestamp") ?? "";
  const messageId = request.headers.get("upstash-message-id") ??
                    request.headers.get("Upstash-Message-Id") ?? "";

  return {
    isQStash: !!(signature && timestamp),
    signature: signature || undefined,
    timestamp: timestamp || undefined,
    messageId: messageId || undefined,
  };
}

// ── Elysia middleware plugin for QStash routes ───────────────────────

export function qstashMiddleware() {
  return async (request: Request): Promise<Response | null> => {
    const { signature, timestamp, isQStash } = extractQStashHeaders(request);

    if (!isQStash) return null; // Not a QStash request, pass through

    // For cron jobs: also check CRON_SECRET as fallback
    const cronSecret = request.headers.get("x-cron-secret");
    const configuredSecret = process.env["CRON_SECRET"] ?? "";

    if (configuredSecret && cronSecret !== configuredSecret) {
      // Fall back to QStash verification
      const body = await request.clone().text();
      if (!verifyQStashRequest(body, signature!, timestamp!)) {
        return new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return null; // Verified, continue
  };
}
