// Elysia + Bun API server — Day 5 bootstrap
// Ref: modulajar-docs.jsx → ADR-001: Elysia + Bun di Railway
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { rateLimit } from "elysia-rate-limit";
import * as dotenv from "dotenv";

dotenv.config();

const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: [
        process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000",
        process.env["VERCEL_URL"] ? `https://${process.env["VERCEL_URL"]}` : "",
      ].filter(Boolean),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-User-ID"],
      credentials: true,
    })
  )
  .use(
    rateLimit({
      duration: 60_000,
      max: 100,
      errorResponse: JSON.stringify({ error: "rate_limit_exceeded", message: "Too many requests." }),
    })
  )
  .get("/health", ({ request }) => {
    const origin = request.headers.get("origin") ?? "*";
    return new Response(
      JSON.stringify({ status: "ok", ts: Date.now(), uptime: Math.floor(process.uptime()) }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin } }
    );
  })
  .onError(({ code, error, request }) => {
    const origin = request.headers.get("origin") ?? "*";
    console.error(`[${code}] ${String(error)}`, request.url);
    return new Response(
      JSON.stringify({ error: code, message: String(error) }),
      { status: code === "NOT_FOUND" ? 404 : 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin } }
    );
  });

// Lazy-load routes to avoid circular issues
const { authRoutes } = await import("./routes/auth");
const { agentRoutes } = await import("./routes/agent");
const { webhookRoutes } = await import("./routes/webhooks");
const { moduleRoutes } = await import("./routes/modules");
const { subscriptionRoutes } = await import("./routes/subscriptions");

app
  .use(authRoutes)
  .use(agentRoutes)
  .use(webhookRoutes)
  .use(moduleRoutes)
  .use(subscriptionRoutes);

const PORT = parseInt(process.env["PORT"] ?? "3000", 10);
const HOST = process.env["HOST"] ?? "0.0.0.0";

app.listen({ port: PORT, hostname: HOST }, () => {
  console.log(`🦊 Modulajar API at http://${HOST}:${PORT}`);
  console.log(`   Env: ${process.env["NODE_ENV"] ?? "dev"}`);
  console.log(`   Supabase: ${process.env["SUPABASE_URL"] ? "✓" : "✗"}`);
  console.log(`   Anthropic: ${process.env["ANTHROPIC_API_KEY"] ? "✓" : "✗"}`);
  console.log(`   Xendit: ${process.env["XENDIT_SECRET"] ? "✓" : "✗"}`);
});

export default app;