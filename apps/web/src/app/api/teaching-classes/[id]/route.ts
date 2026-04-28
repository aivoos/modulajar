import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tc, error } = await supabase
    .from("teaching_classes")
    .select(`*, academic_years (id, label)`)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !tc) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  // Also get students
  const { data: students } = await supabase
    .from("students")
    .select("id, name, nis, gender, is_active")
    .eq("teaching_class_id", id)
    .order("sort_order");

  return NextResponse.json({ data: { ...tc, students: students ?? [] } });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, grade, class_name, phase, schedule, notes } = body;

    const { data: tc, error } = await supabase
      .from("teaching_classes")
      .update({ subject, grade, class_name, phase, schedule, notes })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!tc) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: tc });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("teaching_classes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}