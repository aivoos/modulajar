// Grades routes — /api/grades/*
// Ref: modulajar-spec-v3.jsx — Grade feature with AI descriptions
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

export const gradesRoutes = new Elysia({ prefix: "grades" })

  // GET /api/grades/:teachingClassId — all grades for a class
  .get("/:classId", async ({ params, request, set }) => {
    const userId = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const url = new URL(request.url);
    const assessmentType = url.searchParams.get("assessment_type");

    let q = supabase
      .from("grade_entries")
      .select("*")
      .eq("teaching_class_id", params["classId"]);

    if (assessmentType) q = q.eq("assessment_type", assessmentType);

    const { data, error } = await q;
    if (error) { set.status = 500; return { error: "fetch_failed" }; }
    return data ?? [];
  })

  // POST /api/grades/:classId — upsert grade entries
  .post("/:classId", async ({ params, request, set }) => {
    const userId = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const body = await request.json() as {
      entries: Array<{
        student_id: string;
        assessment_type: string;
        tp_code: string;
        score: number | null;
        notes?: string;
      }>;
    };

    if (!body.entries?.length) {
      set.status = 400; return { error: "entries[] required" };
    }

    const supabase = createAdminClient();
    const upsertData = body.entries.map((e) => ({
      user_id: userId,
      teaching_class_id: params["classId"],
      student_id: e.student_id,
      assessment_type: e.assessment_type,
      tp_code: e.tp_code,
      tp_label: e.tp_code,
      score: e.score,
      notes: e.notes ?? null,
      assessed_at: new Date().toISOString().split("T")[0],
    }));

    const { error } = await supabase
      .from("grade_entries")
      .upsert(upsertData, { onConflict: "teaching_class_id,student_id,assessment_type,tp_code" });

    if (error) { set.status = 500; return { error: "upsert_failed" }; }
    return { saved: body.entries.length };
  })

  // POST /api/grades/generate-descriptions — trigger AI description generation
  .post("/generate-descriptions", async ({ request, set }) => {
    const userId = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const body = await request.json() as { teaching_class_id: string };
    if (!body.teaching_class_id) { set.status = 400; return { error: "teaching_class_id required" }; }

    const supabase = createAdminClient();

    // Create deskripsi_nilai job
    const { data: job, error: jobError } = await supabase
      .from("agent_jobs")
      .insert({
        user_id: userId,
        job_type: "deskripsi_nilai",
        status: "queued",
        input: { teaching_class_id: body.teaching_class_id },
      })
      .select("id")
      .single();

    if (jobError) { set.status = 500; return { error: "job_creation_failed" }; }

    return {
      job_id: job.id,
      status: "queued",
      message: "Deskripsi AI sedang dibuat. Cek endpoint /api/grades/job/:id untuk status.",
    };
  });