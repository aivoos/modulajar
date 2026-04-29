// SSE Stream — /api/agent/jobs/:id/stream
// Real-time job progress via SSE (no WebSocket needed)
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

function getUserId(request: Request): string | null {
  const auth =
    request.headers.get("Authorization") ?? request.headers.get("X-User-ID") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return auth || null;
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function createSSEStream(jobId: string, userId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // Send heartbeat immediately so client knows connection succeeded
      controller.enqueue(encoder.encode(sse("ping", { job_id: jobId })));
    },
    async pull(controller) {
      const supabase = createAdminClient();
      const TIMEOUT_MS = 5 * 60 * 1000; // 5 min max
      const POLL_MS = 1500;
      const deadline = Date.now() + TIMEOUT_MS;
      let lastStep = 0;

      try {
        while (Date.now() < deadline) {
          // Fetch job + latest step
          const [{ data: job }, { data: latestStep }] = await Promise.all([
            supabase
              .from("agent_jobs")
              .select("status, error, module_id")
              .eq("id", jobId)
              .eq("user_id", userId)
              .single(),
            supabase
              .from("agent_steps")
              .select("step_order")
              .eq("job_id", jobId)
              .order("step_order", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (!job) {
            controller.enqueue(encoder.encode(sse("error", { message: "Job tidak ditemukan" })));
            break;
          }

          if (job.status === "running") {
            const step = latestStep?.step_order ?? 0;
            if (step !== lastStep) {
              lastStep = step;
              controller.enqueue(encoder.encode(sse("step", { step })));
            }
          } else if (job.status === "queued") {
            // Job hasn't started yet — send wait event
            controller.enqueue(encoder.encode(sse("queued", { message: "Menunggu giliran..." })));
          } else if (job.status === "done") {
            controller.enqueue(encoder.encode(sse("done", { module_id: job.module_id })));
            break;
          } else if (job.status === "failed") {
            controller.enqueue(encoder.encode(sse("error", { message: job.error ?? "Generasi gagal" })));
            break;
          }

          // Wait before next poll
          await new Promise((r) => setTimeout(r, POLL_MS));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(sse("error", { message: String(err) })));
      } finally {
        controller.close();
      }
    },
  });
}

export const sseRoutes = new Elysia({ prefix: "agent" })
  .get("/jobs/:id/stream", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const jobId = params["id"] as string;
    if (!jobId) { set.status = 400; return { error: "job_id_required" }; }

    const supabase = createAdminClient();
    const { data: job } = await supabase
      .from("agent_jobs")
      .select("id, module_id, status")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (!job) { set.status = 404; return { error: "job_not_found" }; }

    // If already done/failed, return immediately as a single event
    if (job.status === "done") {
      return new Response(
        `event: done\ndata: ${JSON.stringify({ module_id: job.module_id })}\n\n`,
        { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } }
      );
    }
    if (job.status === "failed") {
      return new Response(
        `event: error\ndata: ${JSON.stringify({ message: "Generasi gagal" })}\n\n`,
        { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } }
      );
    }

    const stream = createSSEStream(jobId, userId);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  });