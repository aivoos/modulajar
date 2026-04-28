// Journal routes — /api/journals/*
// Ref: modulajar-master-v2.jsx — Days 16-18 (Jurnal harian + ADR-012 offline)
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

export const journalRoutes = new Elysia({ prefix: "journals" })
  .get("/", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const url = new URL(request.url);
    const teachingClassId = url.searchParams.get("teaching_class_id");
    const month = url.searchParams.get("month");     // "YYYY-MM"
    const limit = parseInt(url.searchParams.get("limit") ?? "30", 10);

    let q = supabase
      .from("journals")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (teachingClassId) q = q.eq("teaching_class_id", teachingClassId);
    if (month) q = q.like("date", `${month}%`);

    const { data, error } = await q;
    if (error) { set.status = 500; return { error: "list_failed" }; }
    return data ?? [];
  })
  .post("/", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as Record<string, unknown>;

    const { data, error } = await supabase
      .from("journals")
      .insert({ user_id: userId, is_synced: true, ...body })
      .select()
      .single();

    if (error) { set.status = 500; return { error: "create_failed" }; }
    return data;
  })
  // Batch upsert journals (offline sync — ADR-012)
  .post("/sync", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as { journals: Array<Record<string, unknown>> };

    if (!body.journals?.length) { set.status = 400; return { error: "journals[] required" }; }

    const results = [];
    for (const j of body.journals) {
      if (!j["local_id"]) { continue; }
      // Upsert by local_id
      const existing = await supabase
        .from("journals")
        .select("id, local_id")
        .eq("local_id", j["local_id"])
        .eq("user_id", userId)
        .single();

      if (existing.data) {
        const { data } = await supabase
          .from("journals")
          .update({ ...j, is_synced: true })
          .eq("id", existing.data.id)
          .select()
          .single();
        results.push(data);
      } else {
        const { data } = await supabase
          .from("journals")
          .insert({ ...j, user_id: userId, is_synced: true })
          .select()
          .single();
        results.push(data);
      }
    }
    return { synced: results.length, journals: results };
  })
  .get("/:id", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("id", params["id"])
      .single();

    if (error || !data) { set.status = 404; return { error: "not_found" }; }
    if (data.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }
    return data;
  })
  .patch("/:id", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as Record<string, unknown>;
    const { data, error } = await supabase
      .from("journals")
      .update(body)
      .eq("id", params["id"])
      .eq("user_id", userId)
      .select()
      .single();

    if (error) { set.status = 500; return { error: "update_failed" }; }
    return data;
  });

// Attendance routes
export const attendanceRoutes = new Elysia({ prefix: "attendances" })
  .get("/", async ({ request, set }) => {
    const url = new URL(request.url);
    const journalId = url.searchParams.get("journal_id");
    if (!journalId) { set.status = 400; return { error: "journal_id required" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("attendances")
      .select("*, student:students(id, name, nis)")
      .eq("journal_id", journalId);

    if (error) { set.status = 500; return { error: "fetch_failed" }; }
    return data ?? [];
  })
  // Batch upsert attendances per journal
  .post("/batch", async ({ request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json() as {
      journal_id: string;
      attendances: Array<{ student_id: string; status: string; notes?: string }>;
    };

    if (!body.journal_id || !body.attendances?.length) {
      set.status = 400; return { error: "journal_id and attendances[] required" };
    }

    // Upsert per attendance
    const results = [];
    for (const att of body.attendances) {
      const { data } = await supabase
        .from("attendances")
        .upsert({
          journal_id: body.journal_id,
          student_id: att.student_id,
          status: att.status,
          notes: att.notes ?? null,
        }, { onConflict: "journal_id,student_id" })
        .select()
        .single();
      results.push(data);
    }
    return { saved: results.length, attendances: results };
  });
