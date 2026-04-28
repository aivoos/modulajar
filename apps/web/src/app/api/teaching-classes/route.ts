import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const academicYearId = searchParams.get("academic_year_id");

  let query = supabase
    .from("teaching_classes")
    .select(`
      id, subject, grade, class_name, phase, schedule, student_count, notes,
      academic_year_id, created_at,
      academic_years (id, label)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (academicYearId) {
    query = query.eq("academic_year_id", academicYearId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, grade, class_name, phase, schedule, notes, academic_year_id } = body;

    if (!subject || !grade || !class_name) {
      return NextResponse.json(
        { error: "subject, grade, dan class_name wajib diisi" },
        { status: 400 }
      );
    }

    // If academic_year_id not provided, get the active one
    let yearId = academic_year_id;
    if (!yearId) {
      const target = getActiveAcademicYear();
      const { data: existing } = await supabase
        .from("academic_years")
        .select("id")
        .ilike("label", `${target.label}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        yearId = existing[0].id;
      } else {
        // Create personal academic year
        const { data: newYear } = await supabase
          .from("academic_years")
          .insert({
            label: `${target.label} (Personal)`,
            year: target.year,
            semester: target.semester,
            start_date: `${target.year}-07-15`,
            end_date: `${target.year + 1}-06-30`,
            is_active: true,
          })
          .select("id")
          .single();
        yearId = newYear?.id;
      }
    }

    const { data: tc, error } = await supabase
      .from("teaching_classes")
      .insert({
        user_id: user.id,
        academic_year_id: yearId,
        subject,
        grade,
        class_name,
        phase: phase ?? null,
        schedule: schedule ?? [],
        notes: notes ?? null,
        student_count: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: tc }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

function getActiveAcademicYear() {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const month = wib.getUTCMonth();
  const wibYear = wib.getUTCFullYear();

  if (month >= 6) {
    return { label: `${wibYear}/${wibYear + 1}`, year: wibYear, semester: "ganjil" as const };
  } else {
    return { label: `${wibYear - 1}/${wibYear}`, year: wibYear - 1, semester: "genap" as const };
  }
}