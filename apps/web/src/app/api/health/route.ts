import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();

  try {
    // Check Supabase connection
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: sbError } = await supabase.from("profiles").select("id").limit(1);

    const latency = Date.now() - start;

    if (sbError && sbError.code !== "PGRST116") {
      // "no rows" is OK; actual error is not
      return NextResponse.json(
        {
          status: "degraded",
          supabase: "error",
          error: sbError.message,
          latencyMs: latency,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      supabase: "connected",
      latencyMs: latency,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        supabase: "unreachable",
        error: String(err),
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}