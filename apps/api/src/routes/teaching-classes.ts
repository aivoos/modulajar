/**
 * Teaching Class routes — /api/teaching-classes/*
 * Ref: modulajar-master-v3.jsx — Day 11
 * Features: CRUD + schedule builder + student management
 */
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";

// ─── Helpers ───────────────────────────────────────────────────────────────

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID") ?? null;
}

async function requireClass(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
  userId: string,
) {
  const { data } = await supabase
    .from("teaching_classes")
    .select("id, user_id, school_id")
    .eq("id", id)
    .single();

  if (!data) return { error: { status: 404, msg: "not_found" } as const };
  if (data.user_id !== userId) return { error: { status: 403, msg: "forbidden" } as const };
  return { data };
}

// ─── Validation schemas ────────────────────────────��───────────────────────

const ScheduleEntrySchema = {
  day: (v: unknown) => typeof v === "number" && v >= 1 && v <= 7,
  time_start: (v: unknown) => typeof v === "string" && v.length > 0,
  time_end: (v: unknown) => typeof v === "string" && v.length > 0,
};

function validateSchedule(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false;
  return raw.every(
    (entry) =>
      ScheduleEntrySchema.day((entry as Record<string, unknown>).day) &&
      ScheduleEntrySchema.time_start((entry as Record<string, unknown>).time_start) &&
      ScheduleEntrySchema.time_end((entry as Record<string, unknown>).time_end),
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────

export const teachingClassRoutes = new Elysia({ prefix: "teaching-classes" })

  // GET /api/teaching-classes — list with academic year + student count
  .get("/", async ({ request, set, query }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const academicYearId = query["academic_year_id"] as string | undefined;

    let q = supabase
      .from("teaching_classes")
      .select(
        "id, subject, grade, class_name, phase, student_count, notes, schedule, academic_year_id, created_at, updated_at, academic_years (id, label, year, semester)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (academicYearId) q = q.eq("academic_year_id", academicYearId);

    const { data, error } = await q;
    if (error) { set.status = 500; return { error: "list_failed" }; }

    return data ?? [];
  })

  // GET /api/teaching-classes/options — available academic years + subjects
  .get("/options", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();

    const [{ data: years }, { data: school }] = await Promise.all([
      supabase.from("academic_years").select("id, label, year, semester, is_active").order("year", { ascending: false }),
      supabase.from("users").select("school_id").eq("id", userId).single(),
    ]);

    const subjects = [
      "Bahasa Indonesia", "Matematika", "IPA", "IPS",
      "Bahasa Inggris", "PJOK", "Seni Budaya", "Prakarya",
      "Pendidikan Agama", "PKn", "Bahasa Daerah",
    ];

    return {
      academic_years: years ?? [],
      subjects,
      grades: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"],
      fases: ["A", "B", "C", "D", "E", "F"],
      school_id: school?.school_id ?? null,
    };
  })

  // POST /api/teaching-classes — create new class
  .post("/", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    const { subject, grade, class_name, phase, notes, schedule, academic_year_id } = body;

    if (!subject || !grade || !class_name) {
      set.status = 400;
      return { error: "missing_required", required: ["subject", "grade", "class_name"] };
    }

    // Get user's school
    const { data: user } = await supabase
      .from("users")
      .select("school_id")
      .eq("id", userId)
      .single();

    // Resolve academic_year_id (use active year if not specified)
    let resolvedYearId = academic_year_id as string | undefined;
    if (!resolvedYearId) {
      const { data: activeYear } = await supabase
        .from("academic_years")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .single();
      resolvedYearId = activeYear?.id;
    }

    if (!resolvedYearId) {
      set.status = 400;
      return { error: "no_academic_year", message: "Tidak ada tahun ajaran aktif. Buat tahun ajaran dulu." };
    }

    // Validate schedule
    if (schedule && !validateSchedule(schedule)) {
      set.status = 400;
      return { error: "invalid_schedule" };
    }

    const { data, error } = await supabase
      .from("teaching_classes")
      .insert({
        user_id: userId,
        school_id: user?.school_id ?? null,
        academic_year_id: resolvedYearId,
        subject: String(subject),
        grade: String(grade),
        class_name: String(class_name),
        phase: (phase as string) || null,
        notes: (notes as string) || null,
        schedule: (schedule as unknown[]) ?? [],
        student_count: 0,
      })
      .select("*, academic_years (id, label, year, semester)")
      .single();

    if (error) {
      if (error.message.includes("foreign key")) {
        set.status = 400;
        return { error: "invalid_academic_year", message: "Tahun ajaran tidak valid." };
      }
      set.status = 500;
      return { error: "create_failed" };
    }

    return data;
  })

  // GET /api/teaching-classes/:id — get class detail with students
  .get("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: tc, error } = await supabase
      .from("teaching_classes")
      .select("*, academic_years (id, label, year, semester)")
      .eq("id", params["id"])
      .single();

    if (error || !tc) { set.status = 404; return { error: "not_found" }; }
    if (tc.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }

    // Get students
    const { data: students } = await supabase
      .from("students")
      .select("id, name, nis, gender, is_active, sort_order, created_at")
      .eq("teaching_class_id", params["id"])
      .order("sort_order", { ascending: true });

    return { ...tc, students: students ?? [] };
  })

  // PATCH /api/teaching-classes/:id — update class
  .patch("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const existing = await requireClass(supabase, params["id"], userId);
    if (existing.error) { set.status = existing.error.status; return { error: existing.error.msg }; }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    // Prevent changing user_id
    delete body["user_id"];
    delete body["id"];

    // Validate schedule if provided
    if (body["schedule"] && !validateSchedule(body["schedule"])) {
      set.status = 400;
      return { error: "invalid_schedule" };
    }

    const { data, error } = await supabase
      .from("teaching_classes")
      .update(body)
      .eq("id", params["id"])
      .select("*, academic_years (id, label, year, semester)")
      .single();

    if (error) { set.status = 500; return { error: "update_failed" }; }
    return data;
  })

  // DELETE /api/teaching-classes/:id
  .delete("/:id", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const existing = await requireClass(supabase, params["id"], userId);
    if (existing.error) { set.status = existing.error.status; return { error: existing.error.msg }; }

    const { error } = await supabase
      .from("teaching_classes")
      .delete()
      .eq("id", params["id"]);

    if (error) { set.status = 500; return { error: "delete_failed" }; }
    return { success: true, deleted_at: new Date().toISOString() };
  })

  // ─── Student sub-resource ─────────────────────────────────────────────────

  // GET /api/teaching-classes/:id/students
  .get("/:id/students", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const existing = await requireClass(supabase, params["id"], userId);
    if (existing.error) { set.status = existing.error.status; return { error: existing.error.msg }; }

    const { data: students } = await supabase
      .from("students")
      .select("id, name, nis, gender, is_active, sort_order, created_at")
      .eq("teaching_class_id", params["id"])
      .order("sort_order", { ascending: true });

    return students ?? [];
  })

  // POST /api/teaching-classes/:id/students — add student
  .post("/:id/students", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const existing = await requireClass(supabase, params["id"], userId);
    if (existing.error) { set.status = existing.error.status; return { error: existing.error.msg }; }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const { name, nis, gender } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      set.status = 400;
      return { error: "name_required" };
    }

    // Get next sort_order
    const { data: last } = await supabase
      .from("students")
      .select("sort_order")
      .eq("teaching_class_id", params["id"])
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (last?.sort_order ?? 0) + 1;

    const { data: student, error } = await supabase
      .from("students")
      .insert({
        teaching_class_id: params["id"],
        name: String(name).trim(),
        nis: nis ? String(nis).trim() : null,
        gender: (gender as "L" | "P") || null,
        sort_order: sortOrder,
      })
      .select("id, name, nis, gender, is_active, sort_order, created_at")
      .single();

    if (error) { set.status = 500; return { error: "create_failed" }; }

    // Update student_count
    await supabase
      .from("teaching_classes")
      .update({ student_count: (existing.data as { student_count?: number }).student_count! + 1 })
      .eq("id", params["id"]);

    return student;
  })

  // PATCH /api/teaching-classes/:id/students/:studentId
  .patch("/:id/students/:studentId", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const existing = await requireClass(supabase, params["id"], userId);
    if (existing.error) { set.status = existing.error.status; return { error: existing.error.msg }; }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    delete body["id"];
    delete body["teaching_class_id"];

    const { data: student, error } = await supabase
      .from("students")
      .update(body)
      .eq("id", params["studentId"])
      .eq("teaching_class_id", params["id"])
      .select("id, name, nis, gender, is_active, sort_order, created_at")
      .single();

    if (error || !student) { set.status = 404; return { error: "student_not_found" }; }
    return student;
  })

  // DELETE /api/teaching-classes/:id/students/:studentId
  .delete("/:id/students/:studentId", async ({ params, request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const existing = await requireClass(supabase, params["id"], userId);
    if (existing.error) { set.status = existing.error.status; return { error: existing.error.msg }; }

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", params["studentId"])
      .eq("teaching_class_id", params["id"]);

    if (error) { set.status = 500; return { error: "delete_failed" }; }

    const { data: tc } = await supabase
      .from("teaching_classes")
      .select("student_count")
      .eq("id", params["id"])
      .single();

    if (tc && tc.student_count > 0) {
      await supabase
        .from("teaching_classes")
        .update({ student_count: tc.student_count - 1 })
        .eq("id", params["id"]);
    }

    return { success: true };
  });