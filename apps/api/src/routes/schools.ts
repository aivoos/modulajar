// Schools routes — /api/schools/*
// Ref: modulajar-spec-v3.jsx — Sekolah plan (B2B)
import { Elysia, t } from "elysia";
import { createAdminClient } from "@modulajar/db";

export const schoolRoutes = new Elysia({ prefix: "schools" })

  // GET /api/schools/me — current user's school (for KS dashboard)
  .get("/me", async ({ request, set }) => {
    const userId = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("users")
      .select("school_id, role")
      .eq("id", userId)
      .single();

    if (!user || !user.school_id) {
      return { school: null, teachers: [], error: "not_in_school" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("*")
      .eq("id", user.school_id)
      .single();

    if (!school) {
      return { school: null, teachers: [], error: "school_not_found" };
    }

    // For KS dashboard: get all teachers in this school
    const { data: teachers } = await supabase
      .from("users")
      .select("id, full_name, email, role, created_at")
      .eq("school_id", user.school_id)
      .order("created_at", { ascending: false });

    return { school, teachers: teachers ?? [] };
  })

  // POST /api/schools/invite — generate invite token for teacher
  .post("/invite", async ({ request, set }) => {
    const userId = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const body = await request.json();
    const email = body["email"] as string;
    const role = (body["role"] as string) ?? "guru";

    if (!email) { set.status = 400; return { error: "email_required" }; }

    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("users")
      .select("school_id, role")
      .eq("id", userId)
      .single();

    if (!user || !user.school_id) {
      set.status = 403;
      return { error: "forbidden", message: "You must be in a school to invite teachers" };
    }

    // Only kepala_sekolah can invite
    if (user.role !== "kepala_sekolah" && user.role !== "super_admin") {
      set.status = 403;
      return { error: "forbidden", message: "Only kepala sekolah can invite teachers" };
    }

    // Check subscription max seats (Sekolah plan: max 30 teachers)
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("ai_quota_limit")
      .eq("school_id", user.school_id)
      .single();

    const maxSeats = subscription?.ai_quota_limit ?? 30; // -1 = unlimited, but for invite we cap at 30
    const { count: currentCount } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("school_id", user.school_id);

    if (currentCount !== null && currentCount >= maxSeats) {
      set.status = 400;
      return {
        error: "max_seats_reached",
        message: `Maks ${maxSeats} guru untuk plan Sekolah. Upgrade untuk tambah seat.`,
      };
    }

    // Generate invite token (6-char random string)
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store invite (could use a separate table or just use the token directly)
    const { data: invite } = await supabase
      .from("schools")
      .update({
        invite_token: token,
        invite_token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .eq("id", user.school_id)
      .select("invite_token")
      .single();

    return {
      invite_url: `${process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000"}/invite/${token}`,
      token: invite?.invite_token,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  })

  // POST /api/schools/join — accept invite token
  .post("/join", async ({ request, set }) => {
    const userId = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const body = await request.json();
    const token = body["token"] as string;

    if (!token) { set.status = 400; return { error: "token_required" }; }

    const supabase = createAdminClient();

    // Find school by invite token
    const { data: school } = await supabase
      .from("schools")
      .select("*")
      .eq("invite_token", token)
      .single();

    if (!school) {
      set.status = 404;
      return { error: "invalid_token" };
    }

    // Check token expiry
    if (school.invite_token_expires_at && new Date(school.invite_token_expires_at) < new Date()) {
      set.status = 400;
      return { error: "token_expired" };
    }

    // Join school
    const { data: user } = await supabase
      .from("users")
      .update({ school_id: school.id })
      .eq("id", userId)
      .select("id, full_name, school_id")
      .single();

    if (!user) {
      set.status = 404;
      return { error: "user_not_found" };
    }

    return {
      success: true,
      school: { id: school.id, name: school.name },
      message: `Berhasil bergabung dengan ${school.name}`,
    };
  })

  // GET /api/schools/compliance — curriculum compliance report for KS dashboard
  .get("/compliance", async ({ request, set }) => {
    const userId = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("users")
      .select("school_id, role")
      .eq("id", userId)
      .single();

    if (!user || !user.school_id) {
      set.status = 403;
      return { error: "forbidden" };
    }

    if (user.role !== "kepala_sekolah" && user.role !== "super_admin") {
      set.status = 403;
      return { error: "forbidden" };
    }

    // Get all teachers in school
    const { data: teachers } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("school_id", user.school_id);

    // Get compliance metrics (simplified: count modules per teacher this semester)
    const teacherIds = (teachers ?? []).map((t) => t.id);
    const now = new Date();
    const semesterStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const { data: modules } = await supabase
      .from("modules")
      .select("user_id, status, created_at")
      .in("user_id", teacherIds)
      .gte("created_at", semesterStart);

    // Group by teacher
    const compliance = (teachers ?? []).map((t) => {
      const teacherModules = (modules ?? []).filter((m) => m.user_id === t.id);
      const published = teacherModules.filter((m) => m.status === "published").length;
      return {
        teacher_id: t.id,
        teacher_name: t.full_name,
        modules_created: teacherModules.length,
        modules_published: published,
        compliant: published >= 1, // At least 1 module this semester
      };
    });

    return {
      semester: semesterStart,
      total_teachers: teachers?.length ?? 0,
      compliant_teachers: compliance.filter((c) => c.compliant).length,
      compliance_rate: teachers?.length
        ? Math.round((compliance.filter((c) => c.compliant).length / teachers.length) * 100)
        : 0,
      by_teacher: compliance,
    };
  });
